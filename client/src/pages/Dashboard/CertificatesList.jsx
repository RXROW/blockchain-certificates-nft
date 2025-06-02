import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { FaEye, FaFileAlt, FaSpinner, FaCheck, FaBan, FaExchangeAlt, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';
import {placeholderImage,BATCH_SIZE,MAX_CERTIFICATES,DISPLAY_LIMIT,PAGE_SIZE,CACHE_TTL,CERTIFICATES_CACHE_KEY,IMAGE_CACHE_KEY,METADATA_CACHE_KEY,IPFS_GATEWAYS, fetchMetadataFromIPFS, normalizeAddress,deduplicateCertificates,getCachedData,setCachedData ,getImageUrlFromMetadata } from '../../components/sperates/f1.js'; 
import { initCertificateStates } from '../../components/sperates/f2.js'; 
import{updateVisibleCertificates,processCertificatesBatch,formatGrade,getStatusColor,getStatusText}from '../../components/sperates/cert_utilits.js';
import{
  fetchCertificatesBatchDetails
  } from '../../components/sperates/filters.js';
import { fetchAllCertificates } from '../../components/sperates/cert_fetch.js';
import { useCertificateEvents } from '../../hooks/useCertificateEvents';
import { useCertificateRecent } from '../../hooks/useCertificateRecent';
import { useCertificateMetadata } from '../../hooks/useCertificateMetadata';
import { useCertificateVerification } from '../../hooks/useCertificateVerification';
import { useCertificateRevocation } from '../../hooks/useCertificateRevocation';
import { useCertificateBurn } from '../../hooks/useCertificateBurn';
import { useWalletConnection } from '../../hooks/useWalletConnection';
import { useCertificateFetching } from '../../hooks/useCertificateFetching';
import { useContractInitialization } from '../../hooks/useContractInitialization';
import { useCertificateMetadataModal } from '../../hooks/useCertificateMetadataModal';
import { useCertificateImageModal } from '../../hooks/useCertificateImageModal';
import { useCertificateSearch } from '../../hooks/useCertificateSearch';
import StatusCards from '../../components/Certificates/StatusCards';
import ErrorDisplay from '../../components/Certificates/ErrorDisplay';
import AdminSearchPanel from '../../components/Certificates/AdminSearchPanel';
import DateRangeFilter from '../../components/Certificates/DateRangeFilter';
import UserSearchPanel from '../../components/Certificates/UserSearchPanel';
import CourseSearchBox from '../../components/Certificates/CourseSearchBox';
import SearchExplanation from '../../components/Certificates/SearchExplanation';
import NoResultsState from '../../components/Certificates/NoResultsState';
import LoadingState from '../../components/Certificates/LoadingState';
import CertificateGrid from '../../components/Certificates/CertificateDisplay/CertificateGrid';
import CertificateTable from '../../components/Certificates/CertificateDisplay/CertificateTable';
import PaginationControls from '../../components/Certificates/CertificateDisplay/PaginationControls';
import MetadataModal from '../../components/Certificates/Modals/MetadataModal';
import ImageModal from '../../components/Certificates/Modals/ImageModal';
import RevokeModal from '../../components/Certificates/Modals/RevokeModal';
import BatchActionBar from '../../components/Certificates/Modals/BatchActionBar';
import BurnModal from '../../components/Certificates/Modals/BurnModal';
import TransactionErrorModal from '../../components/ui/TransactionErrorModal';
import QRCodeModal from '../../components/Certificates/Modals/QRCodeModal';
import { useCertificateQRModal } from '../../hooks/useCertificateQRModal';

const CertificatesList = () => {
  
    const {
      certificates, setCertificates,
      loading, setLoading,
      searchLoading, setSearchLoading,
      error, setError,
      contract, setContract,
      account, setAccount,
      isConnecting, setIsConnecting,
      isAdmin, setIsAdmin,
      verifyLoading, setVerifyLoading,
      revokeLoading, setRevokeLoading,
      showRevokeModal, setShowRevokeModal,
      revocationReason, setRevocationReason,
      searchTerm, setSearchTerm,
      statusFilter, setStatusFilter,
      viewMode, setViewMode,
      lastUpdated, setLastUpdated,
      currentPage, setCurrentPage,
      hasMore, setHasMore,
      loadingMore, setLoadingMore,
      visibleCertificates, setVisibleCertificates,
      totalCertificates, setTotalCertificates,
      studentAddressFilter, setStudentAddressFilter,
      institutionFilter, setInstitutionFilter,
      isSearching, setIsSearching,
      maxResults,
      selectedCertificates, setSelectedCertificates,
      bulkActionLoading, setBulkActionLoading,
      startDate, setStartDate,
      endDate, setEndDate,
      showDateFilter, setShowDateFilter,
      noResultsAddress, setNoResultsAddress,
      courseNameFilter, setCourseNameFilter
    } = initCertificateStates();

  // Add state for selectedCertificate for use with other modals
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
  // Add state for batch burn modal
  const [showBatchBurnModal, setShowBatchBurnModal] = useState(false);
  const [batchBurnReason, setBatchBurnReason] = useState('');
  
  // Add state for burning certificates
  const [burningCertificates, setBurningCertificates] = useState({});
  
  // Add state for transfer functionality
  const [transfersAllowed, setTransfersAllowed] = useState(false);
  
  // Use the certificate search hook
  const {
    courseIdFilter,
    setCourseIdFilter,
    courseNameFilter: searchCourseFilter,
    setCourseNameFilter: setSearchCourseFilter,
    isSearching: searchInProgress,
    setIsSearching: setSearchInProgress,
    handleCourseIdSearch,
    handleCourseNameSearch,
    handleStudentSearch,
    handleInstitutionSearch,
    handleDateRangeSearch,
    handleStatusSearch,
    handleTokenIdSearch,
    handleClearSearchAndShowAll,
    handleSearch
  } = useCertificateSearch(
    contract,
    certificates,
    setCertificates,
    setVisibleCertificates,
    setError,
    setSearchLoading,
    setLoading,
    setCurrentPage,
    setHasMore,
    setLastUpdated,
    searchTerm,
    statusFilter,
    setNoResultsAddress,
    maxResults
  );

  // Add state for institute role
  const [isInstitute, setIsInstitute] = useState(false);

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

  // Update visible certificates when filters change
  useEffect(() => {
    updateVisibleCertificates(certificates, searchTerm, statusFilter, setVisibleCertificates);
  }, [certificates, searchTerm, statusFilter]);

  // Function to check if user is institute
  const checkInstituteStatus = async (contractInstance, currentAccount) => {
    try {
      if (!contractInstance || !currentAccount) return false;

      // First try the authorizedInstitutions mapping
      let isInstitute = await contractInstance.authorizedInstitutions(currentAccount);
      console.log('Is institute account (via authorizedInstitutions):', isInstitute);

      // If that fails, try checking INSTITUTION_ROLE
      if (!isInstitute) {
        try {
          const institutionRole = await contractInstance.INSTITUTION_ROLE();
          isInstitute = await contractInstance.hasRole(institutionRole, currentAccount);
          console.log('Is institute account (via hasRole):', isInstitute);
        } catch (roleError) {
          console.warn('Error checking INSTITUTION_ROLE:', roleError);
        }
      }

      setIsInstitute(isInstitute);
      return isInstitute;
    } catch (err) {
      console.error('Error checking institute status:', err);
      return false;
    }
  };

  // Update MetaMask event listeners to check institute status
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        setAccount(null);
        setCertificates([]);
        setError('Please connect your wallet');
      } else {
        const newAccount = accounts[0];
        setAccount(newAccount);
        if (contract) {
          await checkAdminStatus(contract, newAccount);
          await checkInstituteStatus(contract, newAccount);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [contract, checkAdminStatus, checkInstituteStatus]);

  // Replace the wallet connection functions with the hook, using different names
  const { 
    getCurrentAccount: getCurrentWalletAccount, 
    connectWallet: connectWalletHelper, 
    checkNetwork: checkNetworkConnection 
  } = useWalletConnection(
    setError,
    setLoading,
    setIsConnecting,
    setAccount
  );

  // Replace the initialization useEffect with the hook
  const { isInitialized, error: initError } = useContractInitialization(
    connectWalletHelper,
    checkAdminStatus,
    isAdmin,
    maxResults,
    currentPage,
    certificates,
    loadingMore,
    isSearching,
    searchTerm,
    statusFilter,
    studentAddressFilter,
    institutionFilter,
    startDate,
    endDate,
    setCurrentPage,
    setHasMore,
    setLoading,
    setSearchLoading,
    setCertificates,
    setVisibleCertificates,
    setLoadingMore,
    setIsSearching,
    setError,
    setTotalCertificates,
    setLastUpdated,
    setNoResultsAddress,
    updateVisibleCertificates,
    setContract,
    checkInstituteStatus,
    isInstitute,
    setIsInstitute
  );

  // Inside component, replace the handleCertificateEvent definition with:
  const { 
    handleCertificateEvent, 
    handleCertificateStatusEvent,
    handleCertificateBurnEvent,
    handleCertificateBurnApprovedEvent,
    handleCertificateBurnedEvent 
  } = useCertificateEvents(
    contract,
    certificates,
    totalCertificates,
    setCertificates,
    setTotalCertificates,
    setLastUpdated,
    updateVisibleCertificates,
    setVisibleCertificates,
    searchTerm,
    statusFilter,
    MAX_CERTIFICATES,
    isAdmin,
    isInstitute,
    account
  );

  // Setup optimized event listeners for real-time updates
  useEffect(() => {
    if (!contract) return;

    const setupEventListeners = async () => {
      // Listen for all relevant events with optimized handlers
      contract.on('CertificateIssued', handleCertificateEvent);
      contract.on('CertificateVerified', handleCertificateEvent);
      contract.on('CertificateRevoked', handleCertificateEvent);
      contract.on('CertificateUpdated', handleCertificateEvent);
      
      // NEW: Add listener for status change events
      contract.on('CertificateStatusChanged', handleCertificateStatusEvent);
      
      // Add listeners for burn events
      contract.on('CertificateBurnRequested', handleCertificateBurnEvent);
      contract.on('CertificateBurnApproved', handleCertificateBurnApprovedEvent);
      contract.on('CertificateBurned', handleCertificateBurnedEvent);
      
      // Monitor block changes for real-time updates
      let lastProcessedBlock = 0;
      
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        provider.on('block', async (blockNumber) => {
          // Only process every 10 blocks for performance (~ every 2 minutes)
          if (blockNumber - lastProcessedBlock >= 10) {
            lastProcessedBlock = blockNumber;
            
            if (isAdmin || isInstitute) {
              // For admins and institutions, check for new certificates in the contract
              // Check for new certificates rather than refreshing all data
              const newTotalSupply = await contract.totalSupply().catch(() => 0);
              
              if (newTotalSupply > totalCertificates) {
                console.log(`Block ${blockNumber}: New certificates detected (${newTotalSupply} > ${totalCertificates})`);
                setTotalCertificates(Number(newTotalSupply));
                
                // If we have significantly more certificates, trigger an incremental load
                if (Number(newTotalSupply) - totalCertificates > 5) {
                  fetchAllCertificates(contract, {
                    reset: true,
                    isAdmin,
                    maxResults,
                    currentPage,
                    certificates,
                    loadingMore,
                    isSearching,
                    searchTerm,
                    statusFilter,
                    studentAddressFilter,
                    institutionFilter,
                    startDate,
                    endDate,
                    setCurrentPage,
                    setHasMore,
                    setLoading,
                    setSearchLoading,
                    setCertificates,
                    setVisibleCertificates,
                    setLoadingMore,
                    setIsSearching,
                    setError,
                    setTotalCertificates,
                    setLastUpdated,
                    setNoResultsAddress,
                    updateVisibleCertificates
                  });
                }
              }
            } else if (account) {
              // For regular users, check if any of their certificates have status changes
              try {
                // Get current balance
                const balance = await contract.balanceOf(account).catch(() => 0);
                
                // Check if the user has certificates
                if (Number(balance) > 0) {
                  // For performance, we'll verify a subset of certificates
                  // by batch checking their status
                  const certificatesToCheck = [];
                  
                  // Prefer to check certificates that aren't verified yet
                  const pendingCerts = certificates.filter(c => !c.isVerified && !c.isRevoked)
                    .map(c => Number(c.id));
                  
                  if (pendingCerts.length > 0) {
                    // Add up to 5 pending certificates to check
                    certificatesToCheck.push(...pendingCerts.slice(0, 5));
                  }
                  
                  // Add some random certificates from the user's collection if needed
                  if (certificatesToCheck.length < 3 && certificates.length > 3) {
                    const randomCerts = certificates
                      .filter(c => !certificatesToCheck.includes(Number(c.id)))
                      .sort(() => 0.5 - Math.random()) // shuffle
                      .slice(0, 3)
                      .map(c => Number(c.id));
                    
                    certificatesToCheck.push(...randomCerts);
                  }
                  
                  if (certificatesToCheck.length > 0) {
                    console.log(`Checking status of ${certificatesToCheck.length} certificates for user`);
                    
                    // Fetch updated certificate details
                    const updatedCerts = await processCertificatesBatch(contract, certificatesToCheck);
                    
                    let hasChanges = false;
                    
                    // Update certificates if status has changed
                    setCertificates(prev => {
                      const newCerts = [...prev];
                      
                      updatedCerts.forEach(updatedCert => {
                        const index = newCerts.findIndex(c => c.id === updatedCert.id);
                        if (index >= 0) {
                          // Check if status has changed
                          const oldCert = newCerts[index];
                          if (oldCert.isVerified !== updatedCert.isVerified || 
                              oldCert.isRevoked !== updatedCert.isRevoked) {
                            console.log(`Certificate ${updatedCert.id} status changed: verified=${updatedCert.isVerified}, revoked=${updatedCert.isRevoked}`);
                            newCerts[index] = {
                              ...newCerts[index],
                              isVerified: updatedCert.isVerified,
                              isRevoked: updatedCert.isRevoked
                            };
                            hasChanges = true;
                          }
                        }
                      });
                      
                      return hasChanges ? newCerts : prev;
                    });
                    
                    if (hasChanges) {
                      // Update visible certificates and last updated timestamp
                      updateVisibleCertificates(certificates, searchTerm, statusFilter, setVisibleCertificates);
                      setLastUpdated(Date.now());
                    }
                  }
                }
              } catch (error) {
                console.error('Error checking certificate status updates:', error);
              }
            }
          }
        });
      }
    };

    setupEventListeners();

    // Cleanup listeners
    return () => {
      if (contract) {
        contract.removeAllListeners('CertificateIssued');
        contract.removeAllListeners('CertificateVerified');
        contract.removeAllListeners('CertificateRevoked');
        contract.removeAllListeners('CertificateUpdated');
        contract.removeAllListeners('CertificateStatusChanged');
        contract.removeAllListeners('CertificateBurnRequested');
        contract.removeAllListeners('CertificateBurnApproved');
        contract.removeAllListeners('CertificateBurned');
      }
      
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        provider.removeAllListeners('block');
      }
    };
  }, [
    contract, 
    totalCertificates, 
    handleCertificateEvent, 
    handleCertificateStatusEvent,
    handleCertificateBurnEvent,
    handleCertificateBurnApprovedEvent,
    handleCertificateBurnedEvent,
    isAdmin,
    isInstitute,
    account,
    certificates,
    searchTerm,
    statusFilter,
    updateVisibleCertificates,
    setVisibleCertificates,
    setLastUpdated,
    processCertificatesBatch,
    fetchAllCertificates,
    maxResults,
    currentPage,
    loadingMore,
    isSearching,
    studentAddressFilter,
    institutionFilter,
    startDate,
    endDate,
    setCurrentPage,
    setHasMore,
    setLoading,
    setSearchLoading,
    setCertificates,
    setLoadingMore,
    setIsSearching,
    setError,
    setTotalCertificates,
    setNoResultsAddress
  ]);

  // NEW: Function to fetch recent certificates
  const { fetchRecentCertificates } = useCertificateRecent(
    contract,
    setLoading,
    setError,
    setCertificates,
    updateVisibleCertificates,
    setVisibleCertificates,
    setHasMore,
    setLastUpdated,
    searchTerm,
    statusFilter,
    isInstitute && !isAdmin, // Only use institute filtering if not an admin
    account,
    isAdmin // Pass isAdmin to ensure it's prioritized
  );

  // Remove the loadMetadataForCertificate function and replace with the hook
  const { loadMetadataForCertificate } = useCertificateMetadata(contract);

  // Auto-refresh data periodically (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (contract && account) {
        console.log('Periodic refresh triggered...');
        await handleCertificateEvent();
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [contract, account, handleCertificateEvent]);

  // Replace the handleVerifyCertificate function with the hook
  const { 
    handleVerifyCertificate,
    error: verifyError,
    showErrorModal: showVerifyErrorModal,
    closeErrorModal: closeVerifyErrorModal
  } = useCertificateVerification(
    contract,
    selectedCertificate,
    setVerifyLoading,
    setCertificates,
    setSelectedCertificate,
    CERTIFICATES_CACHE_KEY
  );

  // Replace the handleRevokeCertificate function with the hook
  const { 
    handleRevokeCertificate,
    error: revokeError,
    showErrorModal: showRevokeErrorModal,
    closeErrorModal: closeRevokeErrorModal
  } = useCertificateRevocation(
    contract,
    selectedCertificate,
    setRevokeLoading,
    setCertificates,
    setSelectedCertificate,
    setShowRevokeModal,
    setRevocationReason,
    CERTIFICATES_CACHE_KEY
  );

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => setSearchTerm(term), 300),
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Replace the old functions with the hook
  const { fetchCertificates, fetchCertificateData } = useCertificateFetching(
    setCertificates,
    setError,
    setLoading
  );

  // Add the metadata modal hook
  const {
    showMetadata,
    setShowMetadata,
    imageLoading: metadataImageLoading,
    selectedCertificate: metadataCertificate,
    setSelectedCertificate: setMetadataCertificate,
    error: metadataError,
    handleViewMetadata: openMetadataModal,
    closeModal: closeMetadataModal
  } = useCertificateMetadataModal(loadMetadataForCertificate);

  // Add the image modal hook
  const {
    showImage,
    setShowImage,
    imageLoading,
    selectedCertificate: imageCertificate,
    setSelectedCertificate: setImageCertificate,
    error: imageError,
    handleViewImage,
    handleImageLoad,
    handleImageError,
    closeImageModal
  } = useCertificateImageModal(loadMetadataForCertificate, closeMetadataModal, showMetadata);

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
    handleRevokeCertificate(selectedCertificate, revocationReason);
  };

  // New function for selecting certificates
  const toggleCertificateSelection = useCallback((certificate) => {
    setSelectedCertificates(prev => {
      const isSelected = prev.some(c => c.id === certificate.id);
      if (isSelected) {
        return prev.filter(c => c.id !== certificate.id);
      } else {
        return [...prev, certificate];
      }
    });
  }, []);
  
  // Function to select all visible certificates
  const selectAllVisible = useCallback(() => {
    setSelectedCertificates(visibleCertificates);
  }, [visibleCertificates]);
  
  // Function to clear all selections
  const clearSelection = useCallback(() => {
    setSelectedCertificates([]);
  }, []);
  
  // Function to handle bulk verification of certificates
  const bulkVerifyCertificates = useCallback(async () => {
    try {
      if (!contract || selectedCertificates.length === 0) return;
      
      setBulkActionLoading(true);
      
      // Extract the token IDs from selected certificates
      const tokenIds = selectedCertificates.map(cert => cert.id);
      console.log(`Bulk verifying ${tokenIds.length} certificates:`, tokenIds);
      
      // First, get the detailed status of all selected certificates
      const detailsBatch = await fetchCertificatesBatchDetails(tokenIds);
      console.log('Retrieved batch details:', detailsBatch);
      
      // Filter to only get certificates that aren't verified
      const unverifiedTokenIds = tokenIds.filter(id => {
        const cert = selectedCertificates.find(c => c.id === id);
        return cert && !cert.isVerified;
      });
      
      if (unverifiedTokenIds.length === 0) {
        console.log('No unverified certificates to process');
        setBulkActionLoading(false);
        return;
      }
      
      // Create a provider instance
      const provider = new BrowserProvider(window.ethereum);
      
      // Use the contract's batch verification method
      const signerContract = contract.connect(await provider.getSigner());
      const tx = await signerContract.verifyMultipleCertificates(unverifiedTokenIds);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`Bulk verification completed:`, receipt);
      
      // Update the UI state optimistically
      const updatedCertificates = certificates.map(cert => {
        if (unverifiedTokenIds.includes(cert.id)) {
          return {
            ...cert,
            isVerified: true
          };
        }
        return cert;
      });
      
      setCertificates(updatedCertificates);
      updateVisibleCertificates(updatedCertificates, searchTerm, statusFilter, setVisibleCertificates);
      setSelectedCertificates([]);
      setLastUpdated(Date.now());
      
    } catch (error) {
      console.error('Error during bulk verification:', error);
      setError(`Bulk verification failed: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  }, [contract, selectedCertificates, certificates, searchTerm, statusFilter, updateVisibleCertificates]);


  // Add back the closeRevokeModal function that was removed
  const closeRevokeModal = useCallback(() => {
    setShowRevokeModal(false);
    setRevocationReason('');
  }, []);

  // Add the batch burn request functionality to the existing useCertificateBurn hook
  const {
    burnLoading,
    showBurnModal,
    burnReason,
    burnTimelock,
    setBurnReason,
    requestBurnCertificate,
    requestBurnMultipleCertificates,
    approveBurnCertificate,
    burnCertificate,
    openBurnModal,
    closeBurnModal,
    cancelBurnRequest,
    error: burnError,
    showErrorModal: showBurnErrorModal,
    closeErrorModal: closeBurnErrorModal
  } = useCertificateBurn(
    contract,
    setCertificates,
    setSelectedCertificate
  );

  // Function to handle batch burn request
  const handleBatchBurnRequest = useCallback(async () => {
    if (!contract || selectedCertificates.length === 0 || !batchBurnReason.trim()) {
      return;
    }
    
    try {
      // Extract IDs from selected certificates
      const certificateIds = selectedCertificates.map(cert => cert.id);
      
      // Call the hook function
      await requestBurnMultipleCertificates(certificateIds, batchBurnReason);
      
      // Clear selection and close modal
      setSelectedCertificates([]);
      setShowBatchBurnModal(false);
      setBatchBurnReason('');
      
      // Show success message (you could add toasts or other notifications here)
      console.log(`Burn requests submitted for ${certificateIds.length} certificates`);
      
    } catch (error) {
      console.error('Error during batch burn request:', error);
      setError(`Batch burn request failed: ${error.message}`);
    }
  }, [contract, selectedCertificates, batchBurnReason, requestBurnMultipleCertificates, setError]);

  // Update the closeAllModals function
  const closeAllModals = useCallback(() => {
    closeMetadataModal();
    closeImageModal();
    closeRevokeModal();
    closeBurnModal();
  }, [closeMetadataModal, closeImageModal, closeRevokeModal, closeBurnModal]);

  // Add infinite scroll support for large certificate lists
  const loadMoreCertificates = useCallback(() => {
    if (!loading && !loadingMore && hasMore && contract) {
      // For institute users, use institute-specific paging
      if (isInstitute && !isAdmin) {
        setLoadingMore(true);
        console.log(`Loading more institute certificates from page ${currentPage}`);
        
        // Calculate start index for pagination
        const startIndex = currentPage * 20; // 20 per page
        
        // Use the specialized method for institutes with appropriate paging
        if (typeof contract.getCertificatesByInstitution === 'function') {
          (async () => {
            try {
              const instituteCertIds = await contract.getCertificatesByInstitution(
                account,
                startIndex,
                20 // Fetch 20 at a time
              );
              
              console.log(`Loaded ${instituteCertIds.length} more institute certificates`);
              
              if (instituteCertIds && instituteCertIds.length > 0) {
                // Process the certificates
                const newCerts = await processCertificatesBatch(contract, instituteCertIds.map(id => Number(id)));
                
                // Combine with existing certificates
                const updatedCerts = [...certificates, ...newCerts];
                
                // Update state
                setCertificates(updatedCerts);
                updateVisibleCertificates(updatedCerts, searchTerm, statusFilter, setVisibleCertificates);
                setCurrentPage(currentPage + 1);
                setHasMore(instituteCertIds.length >= 20); // More to load if we got a full page
                setLastUpdated(Date.now());
              } else {
                // No more certificates
                setHasMore(false);
              }
            } catch (err) {
              console.error('Error loading more institute certificates:', err);
              setError('Failed to load more certificates');
            } finally {
              setLoadingMore(false);
            }
          })();
        } else {
          // Fallback to standard loading if specialized method not available
          fetchAllCertificates(contract, {
            reset: false,
            isAdmin: false,
            isInstitute: true, 
            maxResults,
            currentPage,
            certificates,
            loadingMore,
            isSearching,
            searchTerm,
            statusFilter,
            studentAddressFilter,
            institutionFilter: account,
            startDate,
            endDate,
            setCurrentPage,
            setHasMore,
            setLoading,
            setSearchLoading,
            setCertificates,
            setVisibleCertificates,
            setLoadingMore,
            setIsSearching,
            setError,
            setTotalCertificates,
            setLastUpdated,
            setNoResultsAddress,
            updateVisibleCertificates
          });
        }
      } else {
        // Admin users and regular users use standard approach
        fetchAllCertificates(contract, {
          reset: false,
          isAdmin,
          isInstitute: false,
          maxResults,
          currentPage,
          certificates,
          loadingMore,
          isSearching,
          searchTerm,
          statusFilter,
          studentAddressFilter,
          institutionFilter: isAdmin ? institutionFilter : '',
          startDate,
          endDate,
          setCurrentPage,
          setHasMore,
          setLoading,
          setSearchLoading,
          setCertificates,
          setVisibleCertificates,
          setLoadingMore,
          setIsSearching,
          setError,
          setTotalCertificates,
          setLastUpdated,
          setNoResultsAddress,
          updateVisibleCertificates
        });
      }
    }
  }, [loading, loadingMore, hasMore, contract, currentPage, certificates, isSearching, searchTerm, statusFilter, studentAddressFilter, institutionFilter, isAdmin, isInstitute, account, maxResults, startDate, endDate]);

  // Add this function to start the burn animation
  const startBurnAnimation = useCallback((certificate) => {
    console.log(`Start burn animation for certificate #${certificate.id}`);
    
    // Add a small delay to ensure the modal is closed first
    setTimeout(() => {
      setBurningCertificates(prev => ({
        ...prev,
        [certificate.id]: true
      }));
    }, 100);
  }, []);

  // QR Code Modal
  const {
    showQRModal,
    selectedCertificate: qrCertificate,
    openQRModal,
    closeQRModal
  } = useCertificateQRModal();

  // Update the modal rendering section
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 text-white pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">
              {isAdmin ? "Certificate Management" : isInstitute ? "Institute Certificates" : "My Certificates"}
            </h2>
            {lastUpdated && (
              <p className="text-gray-400 text-sm">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          {/* Remove toggle button for admins to switch between views */}
        </div>

        {/* Replace status cards with the new component */}
        <StatusCards 
          totalCertificates={totalCertificates}
          certificatesCount={certificates.length}
          visibleCount={visibleCertificates.length}
          lastUpdated={lastUpdated}
          isLoading={loading}
          onFetchRecent={fetchRecentCertificates}
          isAdmin={isAdmin}
          isInstitute={isInstitute}
        />

        {/* Replace error display with new component */}
        <ErrorDisplay error={error} />

        {/* Admin search bar - only show for admins */}
        {(isAdmin || isInstitute) && (
          <AdminSearchPanel 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            studentAddressFilter={studentAddressFilter}
            setStudentAddressFilter={setStudentAddressFilter}
            institutionFilter={institutionFilter}
            setInstitutionFilter={setInstitutionFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchLoading={searchLoading}
            loading={loading}
            setNoResultsAddress={setNoResultsAddress}
            normalizeAddress={normalizeAddress}
            setError={setError}
            setSearchLoading={setSearchLoading}
            setCurrentPage={setCurrentPage}
            contract={contract}
            handleSearch={handleSearch}
            viewMode={viewMode}
            setViewMode={setViewMode}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            showDateFilter={showDateFilter}
            setShowDateFilter={setShowDateFilter}
            courseNameFilter={searchCourseFilter}
          />
        )}

        {/* Regular user search bar - only show for non-admins */}
        {!isAdmin && !isInstitute && (
          <UserSearchPanel
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        {/* Replace Course Name filter section with new component */}
        <CourseSearchBox
          courseNameFilter={searchCourseFilter}
          setCourseNameFilter={setSearchCourseFilter}
          handleCourseNameSearch={handleCourseNameSearch}
          searchLoading={searchLoading}
          loading={loading}
        />

        {/* Replace explanatory section with new component */}
        <SearchExplanation />

        <div className="bg-gray-800/50 rounded-lg overflow-hidden">
          {loading && certificates.length === 0 ? (
            <LoadingState />
          ) : visibleCertificates.length === 0 ? (
            <NoResultsState
              error={error}
              noResultsAddress={noResultsAddress}
              studentAddressFilter={studentAddressFilter}
              institutionFilter={institutionFilter}
              certificates={certificates}
              handleClearSearchAndShowAll={handleClearSearchAndShowAll}
            />
          ) : (
            <div
              className="overflow-auto"
              style={{ maxHeight: "70vh" }}
            >
              {viewMode === 'grid' ? (
                <CertificateGrid 
                  visibleCertificates={visibleCertificates}
                  selectedCertificates={selectedCertificates}
                  isAdmin={isAdmin}
                  isInstitute={isInstitute}
                  toggleCertificateSelection={toggleCertificateSelection}
                  openMetadataModal={openMetadataModal}
                  handleViewImage={handleViewImage}
                  handleVerifyCertificate={handleVerifyCertificate}
                  verifyLoading={verifyLoading}
                  openRevokeModal={openRevokeModal}
                  revokeLoading={revokeLoading}
                  openBurnModal={openBurnModal}
                  burnTimelock={burnTimelock}
                  openQRModal={openQRModal}
                  onBurnAnimationStart={startBurnAnimation}
                />
              ) : (
                <CertificateTable 
                  visibleCertificates={visibleCertificates}
                  selectedCertificates={selectedCertificates}
                  isAdmin={isAdmin}
                  isInstitute={isInstitute}
                  toggleCertificateSelection={toggleCertificateSelection}
                  selectAllVisible={selectAllVisible}
                  clearSelection={clearSelection}
                  openMetadataModal={openMetadataModal}
                  handleViewImage={handleViewImage}
                  handleVerifyCertificate={handleVerifyCertificate}
                  verifyLoading={verifyLoading}
                  openRevokeModal={openRevokeModal}
                  revokeLoading={revokeLoading}
                  openBurnModal={openBurnModal}
                  burnTimelock={burnTimelock}
                  openQRModal={openQRModal}
                  onBurnAnimationStart={startBurnAnimation}
                />
              )}
              
              <PaginationControls
                loadingMore={loadingMore}
                hasMore={hasMore}
                loadMoreCertificates={loadMoreCertificates}
                certificates={certificates}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replace the metadata modal with the new component */}
      <MetadataModal
        showMetadata={showMetadata}
        metadataCertificate={metadataCertificate}
        metadataImageLoading={metadataImageLoading}
        closeMetadataModal={closeMetadataModal}
      />

      {/* Replace the image modal with the new component */}
      <ImageModal
        showImage={showImage}
        imageCertificate={imageCertificate}
        imageLoading={imageLoading}
        closeImageModal={closeImageModal}
        handleImageLoad={handleImageLoad}
        handleImageError={handleImageError}
        placeholderImage={placeholderImage}
        isAdmin={isAdmin}
        isInstitute={isInstitute}
        handleVerifyCertificate={handleVerifyCertificate}
        verifyLoading={verifyLoading}
        openRevokeModal={openRevokeModal}
        revokeLoading={revokeLoading}
      />

      {/* Replace the revoke modal with the new component */}
      <RevokeModal
        showRevokeModal={showRevokeModal}
        selectedCertificate={selectedCertificate}
        revocationReason={revocationReason}
        setRevocationReason={setRevocationReason}
        closeRevokeModal={closeRevokeModal}
        handleRevokeSubmit={handleRevokeSubmit}
        revokeLoading={revokeLoading}
      />

      {/* Modify the BatchActionBar component to include the burn request button */}
      {selectedCertificates.length > 0 && (
        <BatchActionBar
          selectedCertificates={selectedCertificates}
          clearSelection={() => setSelectedCertificates([])}
          bulkVerifyCertificates={bulkVerifyCertificates}
          bulkActionLoading={bulkActionLoading}
          onRequestBurnClick={() => setShowBatchBurnModal(true)} 
          isInstitute={isInstitute}
        />
      )}

      {/* Add batch burn request modal */}
      {showBatchBurnModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Request Burn for Multiple Certificates</h3>
            
            <p className="text-gray-300 mb-4">
              You are about to request burn for {selectedCertificates.length} certificate(s).
              Please provide a reason for this request.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Reason for burn request</label>
              <textarea
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                rows="3"
                value={batchBurnReason}
                onChange={(e) => setBatchBurnReason(e.target.value)}
                placeholder="Enter reason for burn request..."
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                onClick={() => {
                  setShowBatchBurnModal(false);
                  setBatchBurnReason('');
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50`}
                disabled={!batchBurnReason.trim() || burnLoading}
                onClick={handleBatchBurnRequest}
              >
                {burnLoading ? 'Processing...' : 'Submit Burn Request'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add the burn modal */}
      <BurnModal
        showBurnModal={showBurnModal}
        selectedCertificate={selectedCertificate}
        burnReason={burnReason}
        setBurnReason={setBurnReason}
        burnTimelock={burnTimelock}
        closeBurnModal={closeBurnModal}
        handleBurnRequest={requestBurnCertificate}
        handleCancelRequest={cancelBurnRequest}
        burnLoading={burnLoading}
        canDirectBurn={isAdmin}
        handleDirectBurn={burnCertificate}
        isInstitute={isInstitute}
        onBurnAnimationStart={startBurnAnimation}
      />

      {/* Transaction error modal */}
      <TransactionErrorModal
        show={showRevokeErrorModal}
        onClose={closeRevokeErrorModal}
        error={revokeError}
        action="revoke"
      />

      <TransactionErrorModal
        show={showVerifyErrorModal}
        onClose={closeVerifyErrorModal}
        error={verifyError}
        action="verify"
      />

      <TransactionErrorModal
        show={showBurnErrorModal}
        onClose={closeBurnErrorModal}
        error={burnError}
        action="burn"
      />

      {/* QR Code Modal */}
      <QRCodeModal
        showQRModal={showQRModal}
        certificate={qrCertificate}
        closeQRModal={closeQRModal}
      />

    </div>
  );
};

export default CertificatesList;
