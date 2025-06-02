import React, { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { FaFire, FaHistory, FaCheckCircle, FaClock, FaTimesCircle, FaFilter, FaSearch } from 'react-icons/fa';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { useCertificateBurn } from '../../hooks/useCertificateBurn';
import ApprovalConfirmationModal from '../../components/Certificates/Modals/ApprovalConfirmationModal';
import BatchActionBar from '../../components/Certificates/Modals/BatchActionBar';
import Loading from '../../components/Shared/LoadingSpinner';
import { toast } from 'react-hot-toast';
import TransactionErrorModal from '../../components/ui/TransactionErrorModal';

const BurnApprovals = () => {
  // State for burn requests
  const [burnRequests, setBurnRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for user role
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  
  // State for modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
  // State for batch actions
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showBatchBar, setShowBatchBar] = useState(false);
  
  // Contract and burn hooks
  const [contract, setContract] = useState(null);
  const { 
    approveBurnCertificate, 
    cancelBurnRequest,
    error: burnError,
    showErrorModal: showBurnErrorModal,
    closeErrorModal: closeBurnErrorModal
  } = useCertificateBurn(contract, setBurnRequests, setSelectedCertificate);
  
  // First, add burnTimelock to state and get it from the contract
  const [burnTimelock, setBurnTimelock] = useState(0);
  
  // Check the user's roles
  const checkUserRoles = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) return;
      
      setUserAddress(accounts[0]);
      
      const provider = new BrowserProvider(window.ethereum);
      const contractInstance = new Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );
      
      setContract(contractInstance);
      
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const INSTITUTION_ROLE = await contractInstance.INSTITUTION_ROLE();
      
      const [hasAdminRole, hasInstitutionRole] = await Promise.all([
        contractInstance.hasRole(DEFAULT_ADMIN_ROLE, accounts[0]),
        contractInstance.hasRole(INSTITUTION_ROLE, accounts[0])
      ]);
      
      setIsAdmin(hasAdminRole);
      setIsInstitution(hasInstitutionRole);
      
    } catch (error) {
      console.error("Error checking user roles:", error);
      setError("Failed to check user permissions.");
    }
  }, []);
  
  // Add this function right after checkUserRoles
  const getBurnTimelock = useCallback(async () => {
    if (!contract) return;
    
    try {
      const timelock = await contract.burnTimelock();
      setBurnTimelock(Number(timelock) * 1000); // Convert to milliseconds
    } catch (error) {
      console.error("Error getting burn timelock:", error);
    }
  }, [contract]);
  
  // Fetch burn requests from events
  const fetchBurnRequests = useCallback(async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      
      // Get the total number of certificates
      const totalSupply = await contract.totalSupply();
      
      // Get all certificates
      const allCertificates = [];
      const batchSize = 10;
      
      const totalSupplyNumber = Number(totalSupply);
      
      for (let i = 0; i < totalSupplyNumber; i += batchSize) {
        const endIndex = Math.min(i + batchSize, totalSupplyNumber);
        const tokenIds = [];
        
        for (let j = i; j < endIndex; j++) {
          try {
            const tokenId = await contract.tokenByIndex(j);
            tokenIds.push(Number(tokenId));
          } catch (error) {
            console.error(`Error getting token at index ${j}:`, error);
          }
        }
        
        // Get certificate details
        const [students, institutions, courseIds, completionDates, grades, verificationStatuses, revocationStatuses] = 
          await contract.getCertificatesBatch(tokenIds);
        
        // Get additional details
        const [revocationReasons, versions, lastUpdateDates, updateReasons] = 
          await contract.getCertificatesBatchDetails(tokenIds);
        
        // Combine the data
        for (let k = 0; k < tokenIds.length; k++) {
          // Check if burn was requested for this certificate
          const burnTimestamp = await contract.burnRequestTimestamps(tokenIds[k]);
          const burnApproved = await contract.burnApproved(tokenIds[k]);
          
          // Only include certificates with burn requests
          if (burnTimestamp > 0) {
            let burnReason = "No reason provided";
            try {
              // This is a simplified approach - in a production app, you would query events
              // or implement a proper way to store and retrieve the burn reason
              const filter = contract.filters.CertificateBurnRequested(tokenIds[k]);
              const events = await contract.queryFilter(filter);
              
              if (events.length > 0) {
                // Use the most recent event
                burnReason = events[events.length - 1].args.reason || "No reason provided";
              }
            } catch (error) {
              console.error(`Error getting burn reason for certificate ${tokenIds[k]}:`, error);
            }
            
            const certificate = {
              id: tokenIds[k].toString(),
              tokenId: tokenIds[k].toString(),
              student: students[k],
              institution: institutions[k],
              courseId: courseIds[k].toString(),
              completionDate: new Date(Number(completionDates[k]) * 1000),
              grade: Number(grades[k]),
              isVerified: verificationStatuses[k],
              isRevoked: revocationStatuses[k],
              revocationReason: revocationReasons[k],
              version: versions[k].toString(),
              lastUpdateDate: new Date(Number(lastUpdateDates[k]) * 1000),
              updateReason: updateReasons[k],
              burnRequestTime: new Date(Number(burnTimestamp) * 1000),
              burnApproved: burnApproved,
              burnReason: burnReason
            };
            
            // If user is an institution, only show their certificates
            if (!isAdmin && isInstitution) {
              if (certificate.institution.toLowerCase() === userAddress.toLowerCase()) {
                allCertificates.push(certificate);
              }
            } else {
              allCertificates.push(certificate);
            }
          }
        }
      }
      
      // Set the burn requests
      setBurnRequests(allCertificates);
      setFilteredRequests(allCertificates);
      
    } catch (error) {
      console.error("Error fetching burn requests:", error);
      setError("Failed to load burn requests.");
    } finally {
      setLoading(false);
    }
  }, [contract, isAdmin, isInstitution, userAddress]);
  
  // Filter and sort the burn requests
  const filterAndSortRequests = useCallback(() => {
    if (!burnRequests.length) return;
    
    let filtered = [...burnRequests];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.id.includes(searchTerm) || 
        req.student.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus === 'pending') {
      filtered = filtered.filter(req => !req.burnApproved);
    } else if (filterStatus === 'approved') {
      filtered = filtered.filter(req => req.burnApproved);
    }
    
    // Sort
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => b.burnRequestTime - a.burnRequestTime);
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => a.burnRequestTime - b.burnRequestTime);
    } else if (sortOrder === 'id') {
      filtered.sort((a, b) => Number(a.id) - Number(b.id));
    }
    
    setFilteredRequests(filtered);
  }, [burnRequests, searchTerm, filterStatus, sortOrder]);
  
  // Handle certificate selection for batch actions
  const handleSelectCertificate = (certificate) => {
    setSelectedRequests(prev => {
      const isSelected = prev.some(req => req.id === certificate.id);
      
      if (isSelected) {
        const updated = prev.filter(req => req.id !== certificate.id);
        if (updated.length === 0) setShowBatchBar(false);
        return updated;
      } else {
        setShowBatchBar(true);
        return [...prev, certificate];
      }
    });
  };
  
  // Handle batch approval
  const handleBatchApprove = async () => {
    if (!contract || selectedRequests.length === 0) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenIds = selectedRequests.map(req => req.id);
      
      // Call the contract method to approve multiple burn requests
      const tx = await contract.connect(signer).approveBurnMultipleCertificates(tokenIds);
      
      toast.promise(tx.wait(), {
        loading: `Approving ${tokenIds.length} burn requests...`,
        success: `Successfully approved ${tokenIds.length} burn requests!`,
        error: 'Failed to approve burn requests.'
      });
      
      await tx.wait();
      
      // Update the local state
      setBurnRequests(prev => 
        prev.map(req => 
          tokenIds.includes(req.id) ? { ...req, burnApproved: true } : req
        )
      );
      
      // Clear selection
      setSelectedRequests([]);
      setShowBatchBar(false);
      
      // Refresh the data
      await fetchBurnRequests();
      
    } catch (error) {
      console.error("Error approving batch burn requests:", error);
      toast.error('Failed to approve burn requests.');
    }
  };
  
  // Add a function to handle batch cancellation
  const handleBatchCancel = async () => {
    if (!contract || selectedRequests.length === 0) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenIds = selectedRequests.map(req => req.id);
      
      // Call the contract method to cancel multiple burn requests
      const tx = await contract.connect(signer).cancelBurnMultipleRequests(tokenIds);
      
      toast.promise(tx.wait(), {
        loading: `Canceling ${tokenIds.length} burn requests...`,
        success: `Successfully canceled ${tokenIds.length} burn requests!`,
        error: 'Failed to cancel burn requests.'
      });
      
      await tx.wait();
      
      // Update the local state
      setBurnRequests(prev => 
        prev.map(req => 
          tokenIds.includes(req.id) 
            ? { 
                ...req, 
                burnRequested: false,
                burnRequestTime: null,
                burnReason: '',
                burnApproved: false
              } 
            : req
        )
      );
      
      // Clear selection
      setSelectedRequests([]);
      setShowBatchBar(false);
      
      // Refresh the data
      await fetchBurnRequests();
      
    } catch (error) {
      console.error("Error canceling batch burn requests:", error);
      toast.error('Failed to cancel burn requests.');
    }
  };
  
  // Add a function to execute burn
  const executeBurn = async (certificate) => {
    if (!contract || !certificate) return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Execute the burn
      const tx = await contract.connect(signer).burnCertificate(
        certificate.id,
        `Executed burn after approval and timelock expiry`
      );
      
      toast.promise(tx.wait(), {
        loading: `Burning certificate #${certificate.id}...`,
        success: `Certificate #${certificate.id} burned successfully!`,
        error: 'Failed to burn certificate.'
      });
      
      await tx.wait();
      
      // Remove the certificate from the list
      setBurnRequests(prev => prev.filter(req => req.id !== certificate.id));
      
      // Refresh the data
      await fetchBurnRequests();
      
    } catch (error) {
      console.error("Error executing burn:", error);
      toast.error('Failed to burn certificate.');
    }
  };
  
  // Add a function to execute batch burns
  const handleBatchBurn = async () => {
    if (!contract || selectedRequests.length === 0) return;
    
    // Filter to only include certificates that are approved and timelock expired
    const eligibleCertificates = selectedRequests.filter(
      cert => cert.burnApproved && isTimelockExpired(cert.burnRequestTime)
    );
    
    if (eligibleCertificates.length === 0) {
      toast.error('No selected certificates are eligible for burning');
      return;
    }
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenIds = eligibleCertificates.map(cert => cert.id);
      
      // Call the contract method to burn multiple certificates
      const tx = await contract.connect(signer).burnMultipleCertificates(
        tokenIds,
        `Batch burn execution after approval and timelock expiry`
      );
      
      toast.promise(tx.wait(), {
        loading: `Burning ${tokenIds.length} certificates...`,
        success: `Successfully burned ${tokenIds.length} certificates!`,
        error: 'Failed to burn certificates.'
      });
      
      await tx.wait();
      
      // Remove the burned certificates from the list
      setBurnRequests(prev => prev.filter(req => !tokenIds.includes(req.id)));
      
      // Clear selection
      setSelectedRequests([]);
      setShowBatchBar(false);
      
      // Refresh the data
      await fetchBurnRequests();
      
    } catch (error) {
      console.error("Error executing batch burn:", error);
      toast.error('Failed to burn certificates.');
    }
  };
  
  // Initialize on component mount
  useEffect(() => {
    checkUserRoles();
  }, [checkUserRoles]);
  
  // Fetch burn requests when contract is set
  useEffect(() => {
    if (contract && (isAdmin || isInstitution)) {
      fetchBurnRequests();
      getBurnTimelock();
    }
  }, [contract, isAdmin, isInstitution, fetchBurnRequests, getBurnTimelock]);
  
  // Apply filters when any filter or sort criteria changes
  useEffect(() => {
    filterAndSortRequests();
  }, [burnRequests, searchTerm, filterStatus, sortOrder, filterAndSortRequests]);
  
  // Add a function to check if timelock has expired
  const isTimelockExpired = (requestTime) => {
    if (!requestTime || !burnTimelock) return false;
    const now = Date.now();
    return (now - requestTime.getTime()) >= burnTimelock;
  };
  
  // If user is not admin or institution, show access denied
  if (!loading && !isAdmin && !isInstitution) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 text-6xl mb-4">
          <FaTimesCircle />
        </div>
        <h1 className="text-2xl font-bold text-gray-300 mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md text-center">
          You need to be an administrator or institution to access this page.
        </p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center mb-2">
          <FaFire className="text-red-500 mr-3" />
          Burn Request Approvals
        </h1>
        <p className="text-gray-400">
          {isAdmin 
            ? "As an administrator, you can review and approve certificate burn requests."
            : "As an institution, you can review and approve burn requests for certificates you issued."}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loading variant="cube" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Search by certificate ID or student address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-500" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="id">Certificate ID</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaHistory className="text-gray-500" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Burn Requests Table */}
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 bg-gray-800 rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500"
                          checked={selectedRequests.length === filteredRequests.length}
                          onChange={() => {
                            if (selectedRequests.length === filteredRequests.length) {
                              setSelectedRequests([]);
                              setShowBatchBar(false);
                            } else {
                              setSelectedRequests([...filteredRequests]);
                              setShowBatchBar(true);
                            }
                          }}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Certificate ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-violet-600 bg-gray-700 border-gray-600 rounded focus:ring-violet-500"
                          checked={selectedRequests.some(req => req.id === request.id)}
                          onChange={() => handleSelectCertificate(request)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-violet-400">
                        #{request.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {`${request.student.substring(0, 6)}...${request.student.substring(request.student.length - 4)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {`${request.institution.substring(0, 6)}...${request.institution.substring(request.institution.length - 4)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {request.burnRequestTime.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div className="max-w-xs truncate" title={request.burnReason}>
                          {request.burnReason || "No reason provided"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.burnApproved ? (
                          isTimelockExpired(request.burnRequestTime) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheckCircle className="mr-1" />
                              Ready for Burn
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                                <FaCheckCircle className="mr-1" />
                                Approved
                              </span>
                              <div className="text-xs text-gray-400 mt-1">
                                <FaClock className="inline mr-1" />
                                {(() => {
                                  const elapsed = Date.now() - request.burnRequestTime.getTime();
                                  const remaining = Math.max(0, burnTimelock - elapsed);
                                  if (remaining <= 0) return "Timelock expired";
                                  
                                  // Format the remaining time
                                  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                  
                                  if (days > 0) return `${days}d ${hours}h remaining`;
                                  if (hours > 0) return `${hours}h ${minutes}m remaining`;
                                  return `${minutes}m remaining`;
                                })()}
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FaClock className="mr-1" />
                            Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!request.burnApproved ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCertificate(request);
                                setShowApprovalModal(true);
                              }}
                              className="text-green-400 hover:text-green-300 transition-colors mr-3"
                            >
                              Approve
                            </button>
                            
                            <button
                              onClick={async () => {
                                await cancelBurnRequest(request);
                                fetchBurnRequests();
                              }}
                              className="text-red-400 hover:text-red-300 transition-colors mr-3"
                            >
                              Cancel
                            </button>
                          </>
                        ) : isTimelockExpired(request.burnRequestTime) ? (
                          <button
                            onClick={() => executeBurn(request)}
                            className="text-red-400 hover:text-red-300 transition-colors mr-3"
                          >
                            Execute Burn
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-500 cursor-not-allowed mr-3"
                          >
                            Awaiting Timelock
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedCertificate(request);
                            setShowApprovalModal(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4 flex justify-center">
                <FaFire className="opacity-30" />
              </div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">No Burn Requests Found</h3>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter settings."
                  : "There are no pending burn requests at this time."}
              </p>
            </div>
          )}
          
          {/* Batch Action Bar */}
          {showBatchBar && (
            <BatchActionBar
              selectedCount={selectedRequests.length}
              onApprove={handleBatchApprove}
              onCancel={handleBatchCancel}
              onBurn={handleBatchBurn}
              onClear={() => {
                setSelectedRequests([]);
                setShowBatchBar(false);
              }}
              hasEligibleForBurn={selectedRequests.some(
                req => req.burnApproved && isTimelockExpired(req.burnRequestTime)
              )}
              hasPendingRequests={selectedRequests.some(
                req => !req.burnApproved
              )}
            />
          )}
          
          {/* Approval Confirmation Modal */}
          {showApprovalModal && selectedCertificate && (
            <ApprovalConfirmationModal
              certificate={selectedCertificate}
              onClose={() => {
                setShowApprovalModal(false);
                setSelectedCertificate(null);
              }}
              onApprove={async () => {
                await approveBurnCertificate(selectedCertificate);
                setShowApprovalModal(false);
                setSelectedCertificate(null);
                fetchBurnRequests();
              }}
              onExecuteBurn={executeBurn}
              isApproved={selectedCertificate.burnApproved}
            />
          )}
          
          {/* Transaction Error Modal */}
          <TransactionErrorModal
            show={showBurnErrorModal}
            onClose={closeBurnErrorModal}
            error={burnError}
            action="burn"
          />
        </>
      )}
    </div>
  );
};

export default BurnApprovals; 