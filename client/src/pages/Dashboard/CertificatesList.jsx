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

  // Update visible certificates when filters change
  useEffect(() => {
    updateVisibleCertificates(certificates, searchTerm, statusFilter, setVisibleCertificates);
  }, [certificates, searchTerm, statusFilter, updateVisibleCertificates, setVisibleCertificates]);

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

  // Add MetaMask event listeners
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
  }, [contract, checkAdminStatus]);

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
    setContract
  );

  // Inside component, replace the handleCertificateEvent definition with:
  const { handleCertificateEvent, handleCertificateStatusEvent } = useCertificateEvents(
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
    MAX_CERTIFICATES
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
      
      // Use a single block listener with throttling for better performance
      let lastProcessedBlock = 0;
      
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        provider.on('block', async (blockNumber) => {
          // Only process every 10 blocks for performance (~ every 2 minutes)
          if (blockNumber - lastProcessedBlock >= 10) {
            lastProcessedBlock = blockNumber;
            
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
        contract.removeAllListeners('CertificateStatusChanged'); // NEW: cleanup for new event
      }
      
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        provider.removeAllListeners('block');
      }
    };
  }, [contract, totalCertificates, handleCertificateEvent, fetchAllCertificates]);

  // Add infinite scroll support for large certificate lists
  const loadMoreCertificates = useCallback(() => {
    if (!loading && !loadingMore && hasMore && contract) {
      fetchAllCertificates(contract, {
        reset: false,
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
  }, [loading, loadingMore, hasMore, contract, currentPage, certificates, loadingMore, isSearching, searchTerm, statusFilter, studentAddressFilter, institutionFilter, isAdmin, maxResults, startDate, endDate]);

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
    statusFilter
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
  const { handleVerifyCertificate } = useCertificateVerification(
    contract,
    selectedCertificate,
    setVerifyLoading,
    setCertificates,
    setSelectedCertificate,
    CERTIFICATES_CACHE_KEY
  );

  // Replace the handleRevokeCertificate function with the hook
  const { handleRevokeCertificate } = useCertificateRevocation(
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

  // Update the closeAllModals function
  const closeAllModals = useCallback(() => {
    closeMetadataModal();
    closeImageModal();
    closeRevokeModal();
  }, [closeMetadataModal, closeImageModal, closeRevokeModal]);

  // Update the modal rendering section
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 text-white pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">
              {isAdmin ? "Certificate Management" : "My Certificates"}
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
        />

        {/* Replace error display with new component */}
        <ErrorDisplay error={error} />

        {/* Admin search bar - only show for admins */}
        {isAdmin && (
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
        {!isAdmin && (
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
                  toggleCertificateSelection={toggleCertificateSelection}
                  openMetadataModal={openMetadataModal}
                  handleViewImage={handleViewImage}
                  handleVerifyCertificate={handleVerifyCertificate}
                  verifyLoading={verifyLoading}
                  openRevokeModal={openRevokeModal}
                  revokeLoading={revokeLoading}
                />
              ) : (
                <CertificateTable 
                  visibleCertificates={visibleCertificates}
                  selectedCertificates={selectedCertificates}
                  isAdmin={isAdmin}
                  toggleCertificateSelection={toggleCertificateSelection}
                  selectAllVisible={selectAllVisible}
                  clearSelection={clearSelection}
                  openMetadataModal={openMetadataModal}
                  handleViewImage={handleViewImage}
                  handleVerifyCertificate={handleVerifyCertificate}
                  verifyLoading={verifyLoading}
                  openRevokeModal={openRevokeModal}
                  revokeLoading={revokeLoading}
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

      {/* Replace the batch action bar with the new component */}
      <BatchActionBar
        selectedCertificates={selectedCertificates}
        clearSelection={clearSelection}
        bulkVerifyCertificates={bulkVerifyCertificates}
        bulkActionLoading={bulkActionLoading}
      />
    </div>
  );
};

export default CertificatesList;
