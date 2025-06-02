import { useState, useCallback } from 'react';
import { PAGE_SIZE, normalizeAddress } from '../components/sperates/f1';
import { 
  fetchCertificatesByDateRange,
  fetchCertificatesByStudent,
  fetchCertificatesByInstitution,
  searchCertificatesByCourseName,
  fetchVerifiedCertificates,
  fetchPendingCertificates,
  fetchRevokedCertificates,
  fetchCertificateByTokenId
} from '../components/sperates/filters';
import { updateVisibleCertificates } from '../components/sperates/cert_utilits';

export const useCertificateSearch = (
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
  maxResults = 50
) => {
  // Local state for search inputs
  const [courseNameFilter, setCourseNameFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Function to handle course name search
  const handleCourseNameSearch = useCallback(async () => {
    if (!courseNameFilter.trim()) {
      setError('Please enter a course name');
      return;
    }
    
    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);
    
    try {
      console.log(`Searching for certificates by course name: ${courseNameFilter}`);
      const results = await searchCertificatesByCourseName(contract, courseNameFilter.trim(), maxResults);
      
      if (!results || results.length === 0) {
        console.log(`No certificates found for course name: ${courseNameFilter}`);
        setCertificates([]);
        setVisibleCertificates([]);
        setError(`No certificates found for course name: ${courseNameFilter}`);
      } else {
        console.log(`Found ${results.length} certificates for course name: ${courseNameFilter}`);
        setCertificates(results);
        updateVisibleCertificates(results, '', statusFilter, setVisibleCertificates);
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error searching by course name:', error);
      setError(`Failed to search by course name: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    courseNameFilter, 
    maxResults, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    statusFilter, 
    setHasMore, 
    setLastUpdated
  ]);

  // Function to search by student address
  const handleStudentSearch = useCallback(async (studentAddress) => {
    if (!studentAddress) {
      setError('Please enter a student address');
      return;
    }

    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);
    setNoResultsAddress({ type: null, address: null });

    try {
      console.log(`Searching for certificates by student: ${studentAddress}`);
      
      // Basic format validation for student address
      const normalizedStudent = normalizeAddress(studentAddress);
      if (!normalizedStudent) {
        setError('Invalid student address format. Please enter a valid Ethereum address.');
        setSearchLoading(false);
        return;
      }
      
      const results = await fetchCertificatesByStudent(contract, studentAddress, 0, maxResults);
      
      console.log(`Student search results:`, results);
      if (!results || results.length === 0) {
        console.log(`No certificates found for student: ${studentAddress}`);
        setCertificates([]);
        setVisibleCertificates([]);
        setNoResultsAddress({ 
          type: 'student', 
          address: normalizedStudent 
        });
      } else {
        console.log(`Found ${results.length} certificates for student`);
        setCertificates(results);
        setVisibleCertificates(results); // Direct update to ensure visibility
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error during student search:', error);
      setError(`Failed to search by student address: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    maxResults, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    setHasMore, 
    setLastUpdated,
    setNoResultsAddress
  ]);

  // Function to search by institution address
  const handleInstitutionSearch = useCallback(async (institutionAddress) => {
    if (!institutionAddress) {
      setError('Please enter an institution address');
      return;
    }

    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);
    setNoResultsAddress({ type: null, address: null });

    try {
      console.log(`Searching for certificates by institution: ${institutionAddress}`);
      
      // Basic format validation for institution address
      const normalizedInstitution = normalizeAddress(institutionAddress);
      if (!normalizedInstitution) {
        setError('Invalid institution address format. Please enter a valid Ethereum address.');
        setSearchLoading(false);
        return;
      }
      
      const results = await fetchCertificatesByInstitution(contract, institutionAddress, 0, maxResults);
      
      console.log(`Institution search results:`, results);
      if (!results || results.length === 0) {
        console.log(`No certificates found for institution: ${institutionAddress}`);
        setCertificates([]);
        setVisibleCertificates([]);
        setNoResultsAddress({ 
          type: 'institution', 
          address: normalizedInstitution 
        });
      } else {
        console.log(`Found ${results.length} certificates for institution`);
        setCertificates(results);
        setVisibleCertificates(results); // Direct update to ensure visibility
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error during institution search:', error);
      setError(`Failed to search by institution address: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    maxResults, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    setHasMore, 
    setLastUpdated,
    setNoResultsAddress
  ]);

  // Function to search by date range
  const handleDateRangeSearch = useCallback(async (startDate, endDate) => {
    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);
    setNoResultsAddress({ type: null, address: null });

    try {
      console.log(`Searching for certificates from ${startDate} to ${endDate}`);
      
      const results = await fetchCertificatesByDateRange(contract, startDate, endDate, 0, maxResults);
      
      if (!results || results.length === 0) {
        console.log(`No certificates found in date range`);
        setCertificates([]);
        setVisibleCertificates([]);
        setError(`No certificates found in the specified date range`);
      } else {
        console.log(`Found ${results.length} certificates in date range`);
        setCertificates(results);
        updateVisibleCertificates(results, '', statusFilter, setVisibleCertificates);
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error during date range search:', error);
      setError(`Failed to search by date range: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    maxResults, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    statusFilter, 
    setHasMore, 
    setLastUpdated,
    setNoResultsAddress
  ]);

  // Function to search by certificate status
  const handleStatusSearch = useCallback(async (status) => {
    if (!status || status === 'all') {
      return;
    }

    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);

    try {
      console.log(`Searching for certificates with status: ${status}`);
      
      let results = [];
      
      if (status === 'verified') {
        results = await fetchVerifiedCertificates(contract, 0, maxResults);
      } else if (status === 'pending') {
        results = await fetchPendingCertificates(contract, 0, maxResults);
      } else if (status === 'revoked') {
        results = await fetchRevokedCertificates(contract, 0, maxResults);
      }
      
      if (!results || results.length === 0) {
        console.log(`No certificates found with status: ${status}`);
        setCertificates([]);
        setVisibleCertificates([]);
        setError(`No certificates found with status: ${status}`);
      } else {
        console.log(`Found ${results.length} certificates with status: ${status}`);
        setCertificates(results);
        updateVisibleCertificates(results, '', statusFilter, setVisibleCertificates);
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error during status search:', error);
      setError(`Failed to search by status: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    maxResults, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    statusFilter, 
    setHasMore, 
    setLastUpdated
  ]);

  // Function to directly fetch a certificate by token ID
  const handleTokenIdSearch = useCallback(async (tokenId) => {
    if (!tokenId) {
      return;
    }

    // Clear previous results and errors
    setError('');
    setSearchLoading(true);
    setCurrentPage(1);

    try {
      console.log(`Searching for certificate with token ID: ${tokenId}`);
      
      const result = await fetchCertificateByTokenId(contract, tokenId);
      
      if (!result || result.length === 0) {
        console.log(`Certificate with token ID ${tokenId} not found`);
        setCertificates([]);
        setVisibleCertificates([]);
        setError(`Certificate with ID ${tokenId} not found`);
      } else {
        console.log(`Found certificate with token ID: ${tokenId}`);
        setCertificates(result);
        setVisibleCertificates(result);
        setHasMore(false);
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error fetching certificate by token ID:', error);
      setError(`Failed to fetch certificate: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  }, [
    contract, 
    setCertificates, 
    setVisibleCertificates, 
    setError, 
    setSearchLoading, 
    setCurrentPage, 
    setHasMore, 
    setLastUpdated
  ]);

  // Function to clear search and show all certificates
  const handleClearSearchAndShowAll = useCallback(async () => {
    // Clear all search filters
    setError('');
    setCourseNameFilter('');
    setNoResultsAddress({ type: null, address: null });
    
    // Show loading state
    setLoading(true);
    
    try {
      if (!contract) {
        console.error("Contract not initialized");
        setError("Contract not initialized. Please connect your wallet.");
        setLoading(false);
        return;
      }
      
      // Get total supply directly from contract
      const totalSupply = await contract.totalSupply().catch(err => {
        console.error("Error getting total supply:", err);
        throw new Error("Failed to get total certificates count");
      });
      
      console.log("Total certificates available:", totalSupply.toString());
      
      if (Number(totalSupply) === 0) {
        console.warn("No certificates exist in the contract yet");
        setLoading(false);
        return;
      }
      
      // For admin users, directly fetch latest certificates for immediate display
      // Get the latest certificates (most recent ones)
      const batchSize = Math.min(20, Number(totalSupply));
      const certificateIds = [];
      
      console.log(`Directly fetching ${batchSize} most recent certificates`);
      
      for (let i = 0; i < batchSize; i++) {
        try {
          const tokenId = await contract.tokenByIndex(Number(totalSupply) - 1 - i);
          certificateIds.push(Number(tokenId));
        } catch (err) {
          console.error(`Error fetching token at index ${i}:`, err);
        }
      }
      
      if (certificateIds.length > 0) {
        // Process the certificates
        const fetchCertificates = (await import('../components/sperates/cert_utilits')).processCertificatesBatch;
        const processedCerts = await fetchCertificates(contract, certificateIds);
        
        // Update state
        setCertificates(processedCerts);
        updateVisibleCertificates(processedCerts, '', statusFilter, setVisibleCertificates);
        setHasMore(true);
        setLastUpdated(Date.now());
        console.log(`Successfully loaded ${processedCerts.length} certificates`);
      } else {
        throw new Error("Failed to retrieve certificate data");
      }
    } catch (error) {
      console.error("Error reloading certificates:", error);
      setError("Failed to load certificates: " + error.message);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [
    contract,
    statusFilter,
    setCertificates,
    setVisibleCertificates,
    setError,
    setLoading,
    setSearchLoading,
    setHasMore,
    setLastUpdated,
    setNoResultsAddress
  ]);

  // Main search function that orchestrates the different search types
  const handleSearch = useCallback(async ({
    studentAddress,
    institutionAddress,
    courseName,
    searchTerm,
    statusFilter,
    startDate,
    endDate
  }) => {
    setIsSearching(true);
    
    try {
      // Clear previous results
      setError('');
      
      // Reset the current page for new search
      setCurrentPage(1);
      
      // Check for specific certificate ID search
      if (searchTerm && /^\d+$/.test(searchTerm.trim())) {
        await handleTokenIdSearch(Number(searchTerm.trim()));
        return;
      }
      
      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        await handleStatusSearch(statusFilter);
        return;
      }
      
      // Student address filter
      if (studentAddress) {
        await handleStudentSearch(studentAddress);
        return;
      }
      
      // Institution address filter
      if (institutionAddress) {
        await handleInstitutionSearch(institutionAddress);
        return;
      }
      
      // Course name search
      if (searchTerm && !(/^\d+$/.test(searchTerm.trim()))) {
        await handleCourseNameSearch();
        return;
      }
      
      // Date range search
      if (startDate || endDate) {
        await handleDateRangeSearch(startDate, endDate);
        return;
      }
      
      // If no specific search criteria, fetch recent certificates
      // This handles retrieving certificates appropriately for both admin and regular users
      console.log('No specific search criteria, fetching recent certificates');
      await fetchAllCertificates(contract, {
        reset: true,
        isAdmin,
        maxResults,
        currentPage: 1,
        certificates: [],
        loadingMore: false,
        isSearching: false,
        searchTerm: '',
        statusFilter: 'all',
        studentAddressFilter: '',
        institutionFilter: '',
        startDate: null,
        endDate: null,
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
    } catch (error) {
      console.error('Error during search:', error);
      setError(`Search failed: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  }, [
    contract,
    handleCourseNameSearch,
    handleDateRangeSearch,
    handleStudentSearch,
    handleInstitutionSearch,
    handleStatusSearch,
    handleTokenIdSearch,
    setError,
    setSearchLoading,
    setCurrentPage,
    setNoResultsAddress,
    setIsSearching
  ]);

  return {
    // State
    courseNameFilter,
    setCourseNameFilter,
    isSearching,
    setIsSearching,
    
    // Search functions
    handleCourseNameSearch,
    handleStudentSearch,
    handleInstitutionSearch,
    handleDateRangeSearch,
    handleStatusSearch,
    handleTokenIdSearch,
    handleClearSearchAndShowAll,
    handleSearch
  };
};

export default useCertificateSearch; 