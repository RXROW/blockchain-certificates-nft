import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { FaEye, FaFileAlt, FaSpinner, FaCheck, FaBan, FaExchangeAlt, FaUsers } from 'react-icons/fa';
import PINATA_CONFIG from '../../config/pinata';

const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkM2Q0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YzcyN2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

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
  const [actionLoading, setActionLoading] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [viewAllCertificates, setViewAllCertificates] = useState(false);
  const [allCertificatesLoading, setAllCertificatesLoading] = useState(false);

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
      setActionLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log(`Verifying certificate ${certificate.id}`);
      const tx = await contractWithSigner.verifyCertificate(certificate.tokenId);

      await tx.wait();
      console.log(`Certificate ${certificate.id} verified successfully`);

      // Update the certificate in state
      const updatedCertificates = certificates.map(cert =>
        cert.id === certificate.id ? { ...cert, isVerified: true } : cert
      );
      setCertificates(updatedCertificates);

      // Also update the selected certificate if it's the one being verified
      if (selectedCertificate && selectedCertificate.id === certificate.id) {
        setSelectedCertificate({ ...selectedCertificate, isVerified: true });
      }

      // Show success notification
      alert(`Certificate ${certificate.id} verified successfully`);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      alert(`Failed to verify certificate: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke certificate function for admin
  const revokeCertificate = async (certificate, reason) => {
    try {
      setActionLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      console.log(`Revoking certificate ${certificate.id} with reason: ${reason}`);
      const tx = await contractWithSigner.revokeCertificate(certificate.tokenId, reason);

      await tx.wait();
      console.log(`Certificate ${certificate.id} revoked successfully`);

      // Update the certificate in state
      const updatedCertificates = certificates.map(cert =>
        cert.id === certificate.id ? { ...cert, isRevoked: true, revocationReason: reason } : cert
      );
      setCertificates(updatedCertificates);

      // Also update the selected certificate if it's the one being revoked
      if (selectedCertificate && selectedCertificate.id === certificate.id) {
        setSelectedCertificate({ ...selectedCertificate, isRevoked: true, revocationReason: reason });
      }

      // Close revoke modal and reset reason
      setShowRevokeModal(false);
      setRevocationReason('');

      // Show success notification
      alert(`Certificate ${certificate.id} revoked successfully`);
    } catch (error) {
      console.error('Error revoking certificate:', error);
      alert(`Failed to revoke certificate: ${error.message}`);
    } finally {
      setActionLoading(false);
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
    } catch (err) {
      console.error('Error fetching all certificates:', err);
    } finally {
      setAllCertificatesLoading(false);
    }
  };

  // Handle view change (my certificates vs all certificates)
  const handleViewChange = async () => {
    const newValue = !viewAllCertificates;
    setViewAllCertificates(newValue);

    // If switching to all certificates and they're not loaded yet
    if (newValue && isAdmin && allCertificates.length === 0) {
      await fetchAllCertificates(contract);
    }
  };

  // Effect to fetch all certificates when switching to all certificates view
  useEffect(() => {
    if (isAdmin && viewAllCertificates && allCertificates.length === 0 && contract) {
      fetchAllCertificates(contract);
    }
  }, [viewAllCertificates, isAdmin, contract]);

  // Determine which certificates to display based on admin view toggle
  const certificatesToDisplay = viewAllCertificates && isAdmin ? allCertificates : certificates;

  // Filter certificates based on search term and status
  const filteredCertificates = certificatesToDisplay.filter(cert => {
    const matchesSearch = cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.includes(searchTerm) ||
      cert.institution.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'verified') return matchesSearch && cert.isVerified && !cert.isRevoked;
    if (statusFilter === 'pending') return matchesSearch && !cert.isVerified && !cert.isRevoked;
    if (statusFilter === 'revoked') return matchesSearch && cert.isRevoked;

    return matchesSearch;
  });

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

  const formatGrade = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  const getStatusColor = (certificate) => {
    if (certificate.isRevoked) return 'bg-red-500 text-white';
    if (certificate.isVerified) return 'bg-green-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  const getStatusText = (certificate) => {
    if (certificate.isRevoked) return 'Revoked';
    if (certificate.isVerified) return 'Verified';
    return 'Pending';
  };

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
      alert('Please provide a reason for revocation');
      return;
    }
    revokeCertificate(selectedCertificate, revocationReason);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 text-white pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            {isAdmin && viewAllCertificates ? "All Certificates" : "My Certificates"}
          </h2>
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={handleViewChange}
                className="flex items-center px-4 py-2 bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
              >
                <FaExchangeAlt className="mr-2" />
                {viewAllCertificates ? "View My Certificates" : "View All Certificates"}
              </button>
            </div>
          )}
        </div>

        {/* Loading state for all certificates */}
        {allCertificatesLoading && viewAllCertificates && (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-4xl text-violet-500 mr-4" />
            <span className="text-xl">Loading all certificates...</span>
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by course name, ID, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2   focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="revoked">Revoked</option>
            </select>
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-violet-600' : 'bg-gray-800'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 ${viewMode === 'list' ? 'bg-violet-600' : 'bg-gray-800'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="max-w-md mx-auto">
              <FaFileAlt className="mx-auto text-4xl text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Certificates Found</h3>
              <p className="text-gray-400">
                {certificatesToDisplay.length === 0
                  ? "No certificates available."
                  : "No certificates match your search criteria."}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden hover:border-violet-500 transition-all duration-300 shadow-lg"
              >
                <div className={`h-2 ${getStatusColor(certificate)}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-violet-400 truncate">{certificate.courseName}</h3>
                    <span className={`${getStatusColor(certificate)} px-3 py-1 rounded-full text-sm font-medium`}>
                      {getStatusText(certificate)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-gray-400">Certificate ID: {certificate.id}</p>
                    <p className="flex items-center text-sm">
                      <span className="text-gray-400 w-32">Student:</span>
                      <span className="truncate">{certificate.student.substring(0, 10)}...{certificate.student.substring(certificate.student.length - 8)}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-gray-400 w-32">Institution:</span>
                      <span className="truncate">{certificate.institution.substring(0, 10)}...{certificate.institution.substring(certificate.institution.length - 8)}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-gray-400 w-32">Completion:</span>
                      <span>{certificate.completionDate}</span>
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="text-gray-400 w-32">Grade:</span>
                      <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatGrade(certificate.grade)} ({certificate.grade}%)
                      </span>
                    </p>
                    {certificate.revocationReason && (
                      <p className="flex items-center text-sm">
                        <span className="text-gray-400 w-32">Revoked:</span>
                        <span className="text-red-400">{certificate.revocationReason}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewMetadata(certificate)}
                      className="flex items-center px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-sm"
                    >
                      <FaFileAlt className="mr-1" />
                      Metadata
                    </button>
                    <button
                      onClick={() => handleViewImage(certificate)}
                      className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                    >
                      <FaEye className="mr-1" />
                      View
                    </button>

                    {isAdmin && !certificate.isVerified && !certificate.isRevoked && (
                      <button
                        onClick={() => verifyCertificate(certificate)}
                        disabled={actionLoading}
                        className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                      >
                        {actionLoading ? (
                          <FaSpinner className="animate-spin mr-1" />
                        ) : (
                          <FaCheck className="mr-1" />
                        )}
                        Verify
                      </button>
                    )}

                    {isAdmin && !certificate.isRevoked && (
                      <button
                        onClick={() => openRevokeModal(certificate)}
                        disabled={actionLoading}
                        className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                      >
                        {actionLoading ? (
                          <FaSpinner className="animate-spin mr-1" />
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
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Institution</th>
                  <th className="px-4 py-3 text-left">Completion Date</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3">{certificate.id}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{certificate.courseName}</td>
                    <td className="px-4 py-3">{certificate.student.substring(0, 6)}...{certificate.student.substring(certificate.student.length - 4)}</td>
                    <td className="px-4 py-3">{certificate.institution.substring(0, 6)}...{certificate.institution.substring(certificate.institution.length - 4)}</td>
                    <td className="px-4 py-3">{certificate.completionDate}</td>
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
                          className="p-1 text-violet-400 hover:text-violet-300"
                          title="View Metadata"
                        >
                          <FaFileAlt />
                        </button>
                        <button
                          onClick={() => handleViewImage(certificate)}
                          className="p-1 text-purple-400 hover:text-purple-300"
                          title="View Certificate"
                        >
                          <FaEye />
                        </button>

                        {isAdmin && !certificate.isVerified && !certificate.isRevoked && (
                          <button
                            onClick={() => verifyCertificate(certificate)}
                            disabled={actionLoading}
                            className="p-1 text-green-400 hover:text-green-300"
                            title="Verify Certificate"
                          >
                            <FaCheck />
                          </button>
                        )}

                        {isAdmin && !certificate.isRevoked && (
                          <button
                            onClick={() => openRevokeModal(certificate)}
                            disabled={actionLoading}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Revoke Certificate"
                          >
                            <FaBan />
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
      </div>

      {/* Metadata Modal */}
      {showMetadata && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-violet-400">Certificate Metadata</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-violet-300 mb-2">Certificate Details</h4>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Token ID:</span> {selectedCertificate.id}</p>
                  <p><span className="text-gray-400">Course Name:</span> {selectedCertificate.courseName}</p>
                  <p><span className="text-gray-400">Course ID:</span> {selectedCertificate.courseId}</p>
                  <p><span className="text-gray-400">Completion Date:</span> {selectedCertificate.completionDate}</p>
                  <p><span className="text-gray-400">Grade:</span> {formatGrade(selectedCertificate.grade)} ({selectedCertificate.grade}%)</p>
                  <p><span className="text-gray-400">Status:</span> {selectedCertificate.isRevoked ? 'Revoked' : selectedCertificate.isVerified ? 'Verified' : 'Pending'}</p>
                </div>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-violet-300 mb-2">Blockchain Data</h4>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Student:</span> <span className="break-all text-xs">{selectedCertificate.student}</span></p>
                  <p><span className="text-gray-400">Institution:</span> <span className="break-all text-xs">{selectedCertificate.institution}</span></p>
                  {selectedCertificate.revocationReason && (
                    <p><span className="text-gray-400">Revocation:</span> <span className="text-red-400">{selectedCertificate.revocationReason}</span></p>
                  )}
                </div>
              </div>
            </div>

            {selectedCertificate.imageCID && (
              <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-violet-300 mb-2">IPFS Data</h4>
                <p><span className="text-gray-400">Image CID:</span> <span className="break-all text-xs">{selectedCertificate.imageCID}</span></p>
                <p><span className="text-gray-400">Metadata CID:</span> <span className="break-all text-xs">{selectedCertificate.metadataCID}</span></p>
              </div>
            )}

            {selectedCertificate.metadata && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-violet-300 mb-2">Metadata Content</h4>
                <div className="space-y-2">
                  <p><span className="text-gray-400">Name:</span> {selectedCertificate.metadata.name}</p>
                  <p><span className="text-gray-400">Description:</span> {selectedCertificate.metadata.description}</p>
                  {selectedCertificate.metadata.attributes && (
                    <div>
                      <p className="text-gray-400 mb-1">Attributes:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedCertificate.metadata.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-800 p-2 rounded border border-gray-700">
                            <span className="text-violet-300 text-sm">{attr.trait_type}: </span>
                            <span>{attr.value}</span>
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImage && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-violet-400">Certificate Image</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <div className="relative flex justify-center bg-gray-900/50 p-4 rounded-lg mb-4">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <FaSpinner className="animate-spin text-4xl text-violet-500" />
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
              <div className="text-sm text-gray-400">
                <p>Certificate ID: {selectedCertificate.id}</p>
                {selectedCertificate.imageCID && (
                  <p className="truncate">CID: {selectedCertificate.imageCID}</p>
                )}
              </div>

              <div className="flex space-x-3">
                {isAdmin && (
                  <button
                    onClick={() => verifyCertificate(selectedCertificate)}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
                    Verify Certificate
                  </button>
                )}

                {isAdmin && !selectedCertificate.isRevoked && (
                  <button
                    onClick={() => openRevokeModal(selectedCertificate)}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
                    Revoke Certificate
                  </button>
                )}

                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-red-900/30 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-red-400">Revoke Certificate</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <p className="mb-4 text-gray-300">You are about to revoke certificate <span className="font-semibold">#{selectedCertificate.id}</span> for course <span className="font-semibold">{selectedCertificate.courseName}</span>.</p>

            <form onSubmit={handleRevokeSubmit}>
              <div className="mb-4">
                <label htmlFor="revocationReason" className="block text-gray-400 mb-1">Reason for Revocation</label>
                <textarea
                  id="revocationReason"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                  rows={3}
                  placeholder="Enter reason for revocation..."
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {actionLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
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