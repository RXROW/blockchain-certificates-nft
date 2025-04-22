import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { FaEye, FaFileAlt, FaCheck, FaBan, FaSearch, FaFilter, FaThLarge, FaList, FaTimes, FaSync } from 'react-icons/fa';
import PINATA_CONFIG from '../../config/pinata';
import {
  formatGrade, getStatusColor, getStatusText
  , placeholderImage, getStatusBorderColor
} from '../../components/HelpersFunctions/Utility';
import Loading from '../../components/Shared/LoadingSpinner';
import toast from 'react-hot-toast';

const CertificatesList = () => {
  const [certificates, setCertificates] = useState([]);
  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [allCertificatesLoading, setAllCertificatesLoading] = useState(false);
  const [hasMoreCertificates, setHasMoreCertificates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [paginatedCertificates, setPaginatedCertificates] = useState([]);
  const certificatesPerPage = 9;

  // Determine which certificates to display based on admin status
  const certificatesToDisplay = isAdmin ? allCertificates : certificates;

  // Memoize the filtered certificates to prevent recalculation on every render
  const filteredCertificates = React.useMemo(() => {
    return certificatesToDisplay.filter(cert => {
      const matchesSearch = cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.id.includes(searchTerm) ||
        cert.institution.toLowerCase().includes(searchTerm.toLowerCase());

      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'verified') return matchesSearch && cert.isVerified && !cert.isRevoked;
      if (statusFilter === 'pending') return matchesSearch && !cert.isVerified && !cert.isRevoked;
      if (statusFilter === 'revoked') return matchesSearch && cert.isRevoked;

      return matchesSearch;
    });
  }, [certificatesToDisplay, searchTerm, statusFilter]);

  // Update paginated certificates when filtered results or page changes
  useEffect(() => {
    const paginatedResults = filteredCertificates.slice(0, currentPage * certificatesPerPage);
    setPaginatedCertificates(paginatedResults);
    setHasMoreCertificates(filteredCertificates.length > currentPage * certificatesPerPage);
  }, [filteredCertificates, currentPage, certificatesPerPage]);

  // Function to check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this application');
      setLoading(false);
      return false;
    }
    return true;
  };

  // Function to get current account
  const getCurrentAccount = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        return accounts[0];
      }
      return null;
    } catch (err) {
      console.error('Error getting current account:', err);
      return null;
    }
  };

  // Function to connect wallet
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      if (!checkMetaMask()) {
        setIsConnecting(false);
        return null;
      }

      // First check if already connected
      let currentAccount = await getCurrentAccount();
      if (currentAccount) {
        console.log('Already connected to account:', currentAccount);
        setAccount(currentAccount);
        setIsConnecting(false);
        return currentAccount;
      }

      // If not connected, request connection
      console.log('Requesting wallet connection...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please connect your wallet.');
        setIsConnecting(false);
        return null;
      }

      currentAccount = accounts[0];
      console.log('Connected to account:', currentAccount);
      setAccount(currentAccount);
      setIsConnecting(false);
      return currentAccount;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet: ' + err.message);
      setIsConnecting(false);
      return null;
    }
  };

  // Function to check network
  const checkNetwork = async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 11155111n) { // Sepolia chainId
        setError('Please connect to Sepolia network');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking network:', err);
      setError('Failed to check network: ' + err.message);
      return false;
    }
  };

  // Function to check if user is admin
  const checkAdminStatus = async (contractInstance, currentAccount) => {
    try {
      if (!contractInstance || !currentAccount) return false;

      // Get the admin role bytes32 value
      const adminRole = await contractInstance.DEFAULT_ADMIN_ROLE();
      const hasRole = await contractInstance.hasRole(adminRole, currentAccount);

      console.log('Admin status:', hasRole);
      setIsAdmin(hasRole);
      return hasRole;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  // Function to initialize contract
  const initializeContract = async (currentAccount) => {
    try {
      if (!currentAccount) {
        throw new Error('No account connected');
      }

      console.log('Initializing contract with account:', currentAccount);

      const provider = new BrowserProvider(window.ethereum);
      const contractInstance = new Contract(
        contractAddress.CertificateNFT,
        contractABI.CertificateNFT,
        provider
      );

      setContract(contractInstance);

      // Check if user is admin
      await checkAdminStatus(contractInstance, currentAccount);

      await fetchCertificates(contractInstance, currentAccount);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(`Failed to initialize contract: ${err.message}`);
      setLoading(false);
    }
  };

  // Function to fetch certificates
  const fetchCertificates = async (contractInstance, currentAccount) => {
    try {
      if (!currentAccount) {
        throw new Error('No account connected');
      }

      console.log('Fetching certificates for account:', currentAccount);

      const balance = await contractInstance.balanceOf(currentAccount);
      console.log('Certificate balance:', balance.toString());

      const certs = [];

      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contractInstance.tokenOfOwnerByIndex(currentAccount, i);
          console.log(`Fetching certificate ${i + 1}/${balance}, TokenID: ${tokenId}`);

          const certificateData = await fetchCertificateData(contractInstance, tokenId);
          if (certificateData) {
            certs.push(certificateData);
          }
        } catch (err) {
          console.error(`Error fetching certificate ${i}:`, err);
          continue;
        }
      }

      console.log('Fetched certificates:', certs);
      setCertificates(certs);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(`Failed to fetch certificates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateData = async (contractInstance, tokenId) => {
    try {
      console.log(`Fetching data for token ID ${tokenId}:`);

      // Get certificate data from contract
      const cert = await contractInstance.getCertificate(tokenId);

      if (!cert || cert.length === 0) {
        console.error(`No certificate data found for token ${tokenId}`);
        return null;
      }

      console.log(`Certificate data from contract:`, {
        student: cert[0],
        institution: cert[1],
        courseId: cert[2].toString(),
        completionDate: new Date(Number(cert[3]) * 1000).toLocaleDateString(),
        grade: Number(cert[4]),
        isVerified: cert[5],
        isRevoked: cert[6],
        revocationReason: cert[7],
        version: cert[8],
        lastUpdateDate: cert[9],
        updateReason: cert[10]
      });

      // Get token URI and certificate hash
      let tokenURI = await contractInstance.tokenURI(tokenId);
      console.log(`Token URI for ${tokenId}:`, tokenURI);

      // If tokenURI is empty, try using certificateHash from contract data
      if (!tokenURI || tokenURI === '') {
        try {
          const certData = await contractInstance.academicCertificates(tokenId);
          if (certData && certData.certificateHash) {
            tokenURI = certData.certificateHash;
            console.log(`Using certificateHash as fallback for token ${tokenId}:`, tokenURI);
          }
        } catch (err) {
          console.error(`Error fetching academicCertificates for ${tokenId}:`, err);
        }
      }

      // If we have a tokenURI or certificateHash, fetch the metadata
      let metadata = null;
      let imageCID = null;
      let imageUrl = null;

      if (tokenURI && tokenURI !== '') {
        try {
          // Remove ipfs:// prefix if present
          const metadataCID = tokenURI.startsWith('ipfs://') ? tokenURI.slice(7) : tokenURI;
          console.log(`Fetching metadata from CID: ${metadataCID}`);

          // Fetch metadata from Pinata
          const ipfsUrl = `https://${PINATA_CONFIG.gateway}/ipfs/${metadataCID}`;
          console.log(`Fetching from IPFS URL: ${ipfsUrl}`);

          const response = await fetch(ipfsUrl);
          if (response.ok) {
            metadata = await response.json();
            console.log(`Metadata for token ${tokenId}:`, metadata);

            // Get image CID from metadata
            if (metadata.image) {
              imageCID = metadata.image.startsWith('ipfs://') ?
                metadata.image.slice(7) : metadata.image;
              imageUrl = `https://${PINATA_CONFIG.gateway}/ipfs/${imageCID}`;
              console.log(`Image URL constructed: ${imageUrl}`);
            }
          } else {
            console.error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error(`Error fetching metadata for token ${tokenId}:`, error);
        }
      }

      // Get the certificate hash from contract data
      let certificateHash = '';
      try {
        const certData = await contractInstance.academicCertificates(tokenId);
        certificateHash = certData.certificateHash || '';
      } catch (err) {
        console.error(`Error fetching certificateHash for ${tokenId}:`, err);
      }

      // Return all the data we've gathered
      const certificateData = {
        id: tokenId.toString(),
        tokenId,
        tokenURI: tokenURI || '',
        certificateHash,
        metadataCID: tokenURI && tokenURI !== '' ?
          (tokenURI.startsWith('ipfs://') ? tokenURI.slice(7) : tokenURI) : null,
        imageCID,
        imageUrl,
        metadata,
        student: cert[0],
        institution: cert[1],
        courseId: cert[2].toString(),
        courseName: metadata?.name || `Course ${cert[2].toString()}`,
        completionDate: new Date(Number(cert[3]) * 1000).toLocaleDateString(),
        grade: Number(cert[4]),
        isVerified: cert[5],
        isRevoked: cert[6],
        revocationReason: cert[7],
        version: cert[8],
        lastUpdateDate: cert[9],
        updateReason: cert[10]
      };

      console.log(`Certificate ${tokenId} final data:`, certificateData);
      return certificateData;
    } catch (error) {
      console.error(`Error fetching certificate ${tokenId}:`, error);
      return null;
    }
  };

  // Verify certificate function for admin
  const verifyCertificate = async (certificate) => {
    try {
      setVerifyingId(certificate.id);
      const toastId = toast.loading('Verifying certificate...');

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log(`Verifying certificate ${certificate.id}`);
      const tx = await contractWithSigner.verifyCertificate(certificate.tokenId);

      await tx.wait();
      console.log(`Certificate ${certificate.id} verified successfully`);

      // Update both certificates arrays
      const updateCertificate = cert =>
        cert.id === certificate.id ? { ...cert, isVerified: true } : cert;

      setCertificates(prevCerts => prevCerts.map(updateCertificate));
      setAllCertificates(prevAllCerts => prevAllCerts.map(updateCertificate));

      // Also update the selected certificate if it's the one being verified
      if (selectedCertificate && selectedCertificate.id === certificate.id) {
        setSelectedCertificate({ ...selectedCertificate, isVerified: true });
      }

      // Show success notification
      toast.success(`Certificate ${certificate.id} verified successfully`, { id: toastId });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast.error(`Failed to verify certificate: ${error.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Revoke certificate function for admin
  const revokeCertificate = async (certificate, reason) => {
    try {
      setRevokingId(certificate.id);
      const toastId = toast.loading('Revoking certificate...');

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log(`Revoking certificate ${certificate.id} with reason: ${reason}`);
      const tx = await contractWithSigner.revokeCertificate(certificate.tokenId, reason);

      await tx.wait();
      console.log(`Certificate ${certificate.id} revoked successfully`);

      // Update both certificates arrays
      const updateCertificate = cert =>
        cert.id === certificate.id ? { ...cert, isRevoked: true, revocationReason: reason } : cert;

      setCertificates(prevCerts => prevCerts.map(updateCertificate));
      setAllCertificates(prevAllCerts => prevAllCerts.map(updateCertificate));

      // Also update the selected certificate if it's the one being revoked
      if (selectedCertificate && selectedCertificate.id === certificate.id) {
        setSelectedCertificate({ ...selectedCertificate, isRevoked: true, revocationReason: reason });
      }

      // Close revoke modal and reset reason
      setShowRevokeModal(false);
      setRevocationReason('');

      // Show success notification
      toast.success(`Certificate ${certificate.id} revoked successfully`, { id: toastId });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      toast.error(`Failed to revoke certificate: ${error.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  // Function to fetch all certificates (admin only)
  const fetchAllCertificates = async (contractInstance) => {
    try {
      setAllCertificatesLoading(true);
      console.log('Fetching all certificates (admin)');

      // Get total supply of certificates
      const totalSupply = await contractInstance.totalSupply();
      console.log('Total certificates:', totalSupply.toString());

      const allCerts = [];

      // Loop through all tokens
      for (let i = 0; i < totalSupply; i++) {
        try {
          const tokenId = await contractInstance.tokenByIndex(i);
          console.log(`Fetching certificate ID: ${tokenId}`);

          const certificateData = await fetchCertificateData(contractInstance, tokenId);
          if (certificateData) {
            allCerts.push(certificateData);
          }
        } catch (err) {
          console.error(`Error fetching certificate at index ${i}:`, err);
          continue;
        }
      }

      console.log('All certificates fetched:', allCerts.length);
      setAllCertificates(allCerts);
      setHasMoreCertificates(allCerts.length > certificatesPerPage);
    } catch (err) {
      console.error('Error fetching all certificates:', err);
    } finally {
      setAllCertificatesLoading(false);
    }
  };

  // Load more certificates
  const loadMoreCertificates = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Increment the current page
      setCurrentPage(prevPage => prevPage + 1);

      // Check if we've reached the end
      const totalCertificates = isAdmin ? allCertificates.length : certificates.length;
      const nextPageStart = currentPage * certificatesPerPage;

      if (nextPageStart >= totalCertificates) {
        setHasMoreCertificates(false);
      }
    } catch (error) {
      console.error('Error loading more certificates:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Effect to fetch all certificates when component mounts if user is admin
  useEffect(() => {
    if (isAdmin && contract && allCertificates.length === 0) {
      fetchAllCertificates(contract);
    }
  }, [isAdmin, contract]);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        if (!mounted) return;

        setLoading(true);
        setError('');

        // Connect wallet first
        const connectedAccount = await connectWallet();
        if (!connectedAccount) {
          console.log('No account connected');
          setLoading(false);
          return;
        }

        // Check network
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
          console.log('Wrong network');
          setLoading(false);
          return;
        }

        // Initialize contract with the connected account
        await initializeContract(connectedAccount);
      } catch (err) {
        console.error('Setup error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    setup();

    // Add event listeners
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (!mounted) return;

        if (accounts.length === 0) {
          setAccount(null);
          setCertificates([]);
          setLoading(false);
          setIsAdmin(false);
        } else {
          const newAccount = accounts[0];
          console.log('Account changed to:', newAccount);
          setAccount(newAccount);
          // Refresh certificates when account changes
          if (contract) {
            await checkAdminStatus(contract, newAccount);
            await fetchCertificates(contract, newAccount);
          }
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        mounted = false;
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const handleViewMetadata = (certificate) => {
    setSelectedCertificate(certificate);
    setShowMetadata(true);
    setShowImage(false);
  };

  const handleViewImage = (certificate) => {
    setImageLoading(true);
    setSelectedCertificate(certificate);
    setShowImage(true);
    setShowMetadata(false);
  };

  const closeModal = () => {
    setShowMetadata(false);
    setShowImage(false);
    setSelectedCertificate(null);
    setImageLoading(false);
    setShowRevokeModal(false);
    setRevocationReason('');
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    console.error('Image failed to load');
    setImageLoading(false);
    e.target.onerror = null;
    e.target.src = placeholderImage;
  };

  const openRevokeModal = (certificate) => {
    setSelectedCertificate(certificate);
    setShowRevokeModal(true);
  };

  const handleRevokeSubmit = (e) => {
    e.preventDefault();
    if (!revocationReason.trim()) {
      toast.error('Please provide a reason for revocation');
      return;
    }
    revokeCertificate(selectedCertificate, revocationReason);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950  to-violet-950 text-white pt-20 pb-20">


      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent">
              {isAdmin ? "All Certificates" : "My Certificates"}
            </h2>
            <p className="text-slate-400 mt-1">
              {isAdmin
                ? "Manage and verify all certificates in the system"
                : "View and manage your academic certificates"}
            </p>
          </div>
        </div>

        {allCertificatesLoading && isAdmin && (
          <div className="fixed inset-0 backdrop-blur-sm z-50 flex justify-center items-center bg-black/70">
            <Loading size="large" variant="cube" />

          </div>
        )}


        {/* Search and Filter Section */}
        <div className="mb-8 bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by course name, ID, or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-slate-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-white appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="revoked">Revoked</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 flex items-center ${viewMode === 'grid' ? 'bg-violet-600/80' : 'bg-slate-900/50 hover:bg-slate-800/50'}`}
                >
                  <FaThLarge className="mr-2" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 flex items-center ${viewMode === 'list' ? 'bg-violet-600/80' : 'bg-slate-900/50 hover:bg-slate-800/50'}`}
                >
                  <FaList className="mr-2" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 border border-slate-700/50 rounded-lg">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <FaFileAlt className="text-3xl text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-200">No Certificates Found</h3>
              <p className="text-slate-400">
                {certificatesToDisplay.length === 0
                  ? "You don't have any certificates yet."
                  : "No certificates match your search criteria."}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className={`bg-slate-800/40 border border-violet-600/5  rounded-lg overflow-hidden ${getStatusBorderColor(certificate)} transition-all duration-300 shadow-lg group`}

              >
                <div className={`h-1.5 ${getStatusColor(certificate)}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-violet-300 truncate group-hover:text-violet-200 transition-colors">
                      {certificate.courseName}
                    </h3>
                    <span className={`${getStatusColor(certificate)} px-3 py-1 rounded-full text-xs font-medium`}>
                      {getStatusText(certificate)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-400">Certificate ID: {certificate.id}</p>
                    <p className="flex items-center text-sm">
                      <span className="text-slate-400 w-32">Student:</span>
                      <span className="truncate text-slate-300">{certificate.student.substring(0, 10)}...{certificate.student.substring(certificate.student.length - 8)}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-slate-400 w-32">Institution:</span>
                      <span className="truncate text-slate-300">{certificate.institution.substring(0, 10)}...{certificate.institution.substring(certificate.institution.length - 8)}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-slate-400 w-32">Completion:</span>
                      <span className="text-slate-300">{certificate.completionDate}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-slate-400 w-32">Grade:</span>
                      <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatGrade(certificate.grade)} ({certificate.grade}%)
                      </span>
                    </p>
                    {certificate.revocationReason && (
                      <p className="flex items-center text-sm">
                        <span className="text-slate-400 w-32">Revoked:</span>
                        <span className="text-red-400">{certificate.revocationReason}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewMetadata(certificate)}
                      className="flex items-center px-3 py-1.5 bg-violet-600/80 hover:bg-violet-600 rounded-lg transition-colors text-sm"
                    >
                      <FaFileAlt className="mr-1" />
                      Metadata
                    </button>
                    <button
                      onClick={() => handleViewImage(certificate)}
                      className="flex items-center px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg transition-colors text-sm"
                    >
                      <FaEye className="mr-1" />
                      View
                    </button>

                    {isAdmin && !certificate.isVerified && !certificate.isRevoked && (
                      <button
                        onClick={() => verifyCertificate(certificate)}
                        disabled={verifyingId === certificate.id}
                        className="flex items-center px-3 py-1.5 bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors text-sm"
                      >
                        {verifyingId === certificate.id ? (
                          <Loading size="small" />
                        ) : (
                          <FaCheck className="mr-1" />
                        )}
                        Verify
                      </button>
                    )}

                    {isAdmin && !certificate.isRevoked && (
                      <button
                        onClick={() => openRevokeModal(certificate)}
                        disabled={revokingId === certificate.id}
                        className="flex items-center px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-sm"
                      >
                        {revokingId === certificate.id ? (
                          <Loading size="small" />
                        ) : (
                          <FaBan className="mr-1" />
                        )}
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto rounded-lg border border-slate-700/50">
            <table className="w-full bg-slate-800/50">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Course</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Student</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Institution</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Completion Date</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Grade</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCertificates.map((certificate) => (
                  <tr key={certificate.id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300">{certificate.id}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-300">{certificate.courseName}</td>
                    <td className="px-4 py-3 text-slate-300">{certificate.student.substring(0, 6)}...{certificate.student.substring(certificate.student.length - 4)}</td>
                    <td className="px-4 py-3 text-slate-300">{certificate.institution.substring(0, 6)}...{certificate.institution.substring(certificate.institution.length - 4)}</td>
                    <td className="px-4 py-3 text-slate-300">{certificate.completionDate}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatGrade(certificate.grade)} ({certificate.grade}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${getStatusColor(certificate)} px-2 py-1 rounded-full text-xs font-medium`}>
                        {getStatusText(certificate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewMetadata(certificate)}
                          className="p-1.5 text-violet-400 hover:text-violet-300 hover:bg-slate-700/50 rounded-md transition-colors"
                          title="View Metadata"
                        >
                          <FaFileAlt />
                        </button>
                        <button
                          onClick={() => handleViewImage(certificate)}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-md transition-colors"
                          title="View Certificate"
                        >
                          <FaEye />
                        </button>

                        {isAdmin && !certificate.isVerified && !certificate.isRevoked && (
                          <button
                            onClick={() => verifyCertificate(certificate)}
                            disabled={verifyingId === certificate.id}
                            className="p-1.5 text-green-400 hover:text-green-300 hover:bg-slate-700/50 rounded-md transition-colors"
                            title="Verify Certificate"
                          >
                            {verifyingId === certificate.id ? (
                              <Loading size="small" />
                            ) : (
                              <FaCheck />
                            )}
                          </button>
                        )}

                        {isAdmin && !certificate.isRevoked && (
                          <button
                            onClick={() => openRevokeModal(certificate)}
                            disabled={revokingId === certificate.id}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-700/50 rounded-md transition-colors"
                            title="Revoke Certificate"
                          >
                            {revokingId === certificate.id ? (
                              <Loading size="small" />
                            ) : (
                              <FaBan />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {hasMoreCertificates && paginatedCertificates.length < filteredCertificates.length && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMoreCertificates}
              disabled={isLoadingMore}
              className="flex items-center px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
            >
              {isLoadingMore ? (
                <Loading size="small" />
              ) : (
                <FaSync className="mr-2" />
              )}
              {isLoadingMore ? "Loading..." : "Load More Certificates"}
            </button>
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      {showMetadata && selectedCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-violet-300">Certificate Metadata</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-2xl  hover:bg-red-500/30 h-10 w-10 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h4 className="font-semibold text-violet-300 mb-3">Certificate Details</h4>
                <div className="space-y-2">
                  <p className="flex justify-between"><span className="text-slate-400">Token ID:</span> <span className="text-slate-200">{selectedCertificate.id}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Course Name:</span> <span className="text-slate-200">{selectedCertificate.courseName}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Course ID:</span> <span className="text-slate-200">{selectedCertificate.courseId}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Completion Date:</span> <span className="text-slate-200">{selectedCertificate.completionDate}</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Grade:</span> <span className={`font-semibold ${selectedCertificate.grade >= 70 ? 'text-green-400' : selectedCertificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{formatGrade(selectedCertificate.grade)} ({selectedCertificate.grade}%)</span></p>
                  <p className="flex justify-between"><span className="text-slate-400">Status:</span> <span className={`${selectedCertificate.isRevoked ? 'text-red-400' : selectedCertificate.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>{selectedCertificate.isRevoked ? 'Revoked' : selectedCertificate.isVerified ? 'Verified' : 'Pending'}</span></p>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h4 className="font-semibold text-violet-300 mb-3">Blockchain Data</h4>
                <div className="space-y-2">
                  <p className="flex flex-col"><span className="text-slate-400">Student:</span> <span className="break-all text-xs text-slate-300 mt-1">{selectedCertificate.student}</span></p>
                  <p className="flex flex-col"><span className="text-slate-400">Institution:</span> <span className="break-all text-xs text-slate-300 mt-1">{selectedCertificate.institution}</span></p>
                  {selectedCertificate.revocationReason && (
                    <p className="flex flex-col"><span className="text-slate-400">Revocation:</span> <span className="text-red-400 mt-1">{selectedCertificate.revocationReason}</span></p>
                  )}
                </div>
              </div>
            </div>

            {selectedCertificate.imageCID && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-4">
                <h4 className="font-semibold text-violet-300 mb-3">IPFS Data</h4>
                <div className="space-y-2">
                  <p className="flex flex-col"><span className="text-slate-400">Image CID:</span> <span className="break-all text-xs text-slate-300 mt-1">{selectedCertificate.imageCID}</span></p>
                  <p className="flex flex-col"><span className="text-slate-400">Metadata CID:</span> <span className="break-all text-xs text-slate-300 mt-1">{selectedCertificate.metadataCID}</span></p>
                </div>
              </div>
            )}

            {selectedCertificate.metadata && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                <h4 className="font-semibold text-violet-300 mb-3">Metadata Content</h4>
                <div className="space-y-3">
                  <p className="flex flex-col"><span className="text-slate-400">Name:</span> <span className="text-slate-200 mt-1">{selectedCertificate.metadata.name}</span></p>
                  <p className="flex flex-col"><span className="text-slate-400">Description:</span> <span className="text-slate-200 mt-1">{selectedCertificate.metadata.description}</span></p>
                  {selectedCertificate.metadata.attributes && (
                    <div>
                      <p className="text-slate-400 mb-2">Attributes:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedCertificate.metadata.attributes.map((attr, index) => (
                          <div key={index} className="p-2 border-t border-violet-500/50">
                            <span className="text-violet-300 text-sm">{attr.trait_type}: </span>
                            <span className="text-slate-300">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImage && selectedCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg p-6 max-w-4xl w-full border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-violet-300">Certificate Image</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-2xl  hover:bg-red-500/30 h-10 w-10 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="relative flex justify-center bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-4">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                  <Loading size="large" />
                </div>
              )}
              <img
                src={selectedCertificate.imageUrl || placeholderImage}
                alt={`Certificate ${selectedCertificate.id}`}
                className="max-w-full h-auto rounded-lg shadow-xl"
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{ maxHeight: '70vh' }}
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="text-sm text-slate-400">
                <p>Certificate ID: {selectedCertificate.id}</p>
                {selectedCertificate.imageCID && (
                  <p className="truncate">CID: {selectedCertificate.imageCID}</p>
                )}
              </div>

              <div className="flex space-x-2">
                {isAdmin && !selectedCertificate.isVerified && (
                  <button
                    onClick={() => verifyCertificate(selectedCertificate)}
                    disabled={verifyingId === selectedCertificate.id}
                    className="flex items-center px-2 py-2 bg-green-600/80 text-sm hover:bg-green-600 rounded-lg transition-colors"
                  >
                    {verifyingId === selectedCertificate.id ? <Loading size="small" /> : <FaCheck className="mr-2" />}
                    Verify Certificate
                  </button>
                )}

                {isAdmin && !selectedCertificate.isRevoked && (
                  <button
                    onClick={() => openRevokeModal(selectedCertificate)}
                    disabled={revokingId === selectedCertificate.id}
                    className="flex items-center px-2 py-2 bg-red-600/80 text-sm hover:bg-red-600 rounded-lg transition-colors"
                  >
                    {revokingId === selectedCertificate.id ? <Loading size="small" /> : <FaBan className="mr-2" />}
                    Revoke Certificate
                  </button>
                )}

                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 text-sm hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-red-900/30 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-red-400">Revoke Certificate</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-2xl  hover:bg-red-500/30 h-10 w-10 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>

            <p className="mb-4 text-slate-300">You are about to revoke certificate <span className="font-semibold text-white">#{selectedCertificate.id}</span> for course <span className="font-semibold text-white">{selectedCertificate.courseName}</span>.</p>

            <form onSubmit={handleRevokeSubmit}>
              <div className="mb-4">
                <label htmlFor="revocationReason" className="block text-slate-400 mb-1">Reason for Revocation</label>
                <textarea
                  id="revocationReason"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  rows={3}
                  placeholder="Enter reason for revocation..."
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revokingId === selectedCertificate.id}
                  className="flex items-center px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
                >
                  {revokingId === selectedCertificate.id ? <Loading size="small" /> : <FaBan className="mr-2" />}
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesList;