import { BATCH_SIZE, PAGE_SIZE, deduplicateCertificates } from './f1.js';
import { processCertificatesBatch } from './cert_utilits.js';

export const fetchAllCertificates = async (
  contractInstance,
  {
    reset = false,
    isAdmin = false,
    maxResults = 100,
    currentPage = 1,
    certificates = [],
    loadingMore = false,
    isSearching = false,
    searchTerm = '',
    statusFilter = 'all',
    studentAddressFilter = '',
    institutionFilter = '',
    startDate = null,
    endDate = null,
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
  }
) => {
  if (!contractInstance) return;

  try {
    if (reset) {
      setCurrentPage(1);
      setHasMore(true);
      // Use the appropriate loading state
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      setCertificates([]);
      setVisibleCertificates([]);
      setIsSearching(true);
      // Reset no results state for new search
      setNoResultsAddress({ type: null, address: null });
    } else if (loadingMore) {
      return; // Prevent multiple concurrent loading operations
    } else {
      setLoadingMore(true);
    }
    
    setError('');

    // Get total supply with error handling
    const totalSupply = await contractInstance.totalSupply().catch(err => {
      console.error("Error getting total supply:", err);
      return 0;
    });
    
    setTotalCertificates(Number(totalSupply));
    console.log("Total supply:", totalSupply.toString());
    
    if (Number(totalSupply) === 0) {
      console.log("No certificates found - supply is zero");
      setLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      setIsSearching(false);
      return;
    }
    
    // If all search/filter parameters are clear, show all certificates
    const isShowingAll = !searchTerm && !studentAddressFilter && !institutionFilter && statusFilter === 'all' && !startDate && !endDate;
    
    // When showing all certificates after a reset (from clear button)
    if (isShowingAll && reset) {
      console.log("Showing all certificates after reset");
      
      // Use a faster approach when displaying all certificates
      let startIndex = 0;
      const batchSize = Math.min(20, Number(totalSupply));
      const certificateIds = [];
      
      // Get the first batch of certificates (most recent ones)
      console.log(`Fetching ${batchSize} out of ${totalSupply} total certificates`);
      
      for (let i = 0; i < batchSize; i++) {
        try {
          const tokenId = await contractInstance.tokenByIndex(Number(totalSupply) - 1 - i);
          certificateIds.push(Number(tokenId));
        } catch (err) {
          console.error(`Error fetching token at index ${i}:`, err);
        }
      }
      
      if (certificateIds.length > 0) {
        console.log(`Successfully fetched ${certificateIds.length} certificate IDs: ${certificateIds.join(', ')}`);
        
        // Process the returned certificate IDs
        const processedCerts = await processCertificatesBatch(contractInstance, certificateIds);
        console.log(`Processed ${processedCerts.length} certificates`);
        
        if (processedCerts.length === 0) {
          console.error("No certificates processed, even though IDs were found");
          setError("Failed to process certificate data. Please try again.");
          setHasMore(false);
        }
        
        // Update state
        const uniqueCerts = deduplicateCertificates(processedCerts);
        setCertificates(uniqueCerts);
        updateVisibleCertificates(uniqueCerts, searchTerm, statusFilter, setVisibleCertificates);
        setHasMore(uniqueCerts.length === batchSize && Number(totalSupply) > batchSize);
        setLastUpdated(Date.now());
      } else {
        console.error("No certificate IDs found, even though supply is positive");
        setError("Failed to retrieve certificates. Please try again.");
        setHasMore(false);
      }
      
      setLoading(false);
      setSearchLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
      return;
    }
    
    // Admin search-first approach - store search parameters
    const isAdminSearch = isAdmin && reset;
    // Check if we have a cached starting point
    const startPage = reset ? 1 : currentPage;
    const startIndex = (startPage - 1) * PAGE_SIZE;
    
    // If we're loading a new page, append to existing certs
    const existingCerts = reset ? [] : [...certificates];
    
    // Calculate how many tokens to process in this batch
    const remainingToProcess = Math.min(
      Number(totalSupply) - startIndex,
      isAdminSearch ? Math.min(maxResults, PAGE_SIZE) : PAGE_SIZE
    );
    
    // If no more to process, we're done
    if (remainingToProcess <= 0) {
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
      console.log("No more certificates to process, setting hasMore to false");
      return;
    }
    
    console.log(`Fetching page ${startPage}, processing ${remainingToProcess} certificates from index ${startIndex}`);
    
    // For admin search, we approach differently - start by gathering potential matches
    if (isAdminSearch && (searchTerm || studentAddressFilter || institutionFilter || statusFilter !== 'all')) {
      // If searching by specific ID, try to fetch it directly first
      if (searchTerm && /^\d+$/.test(searchTerm.trim())) {
        try {
          const tokenId = Number(searchTerm.trim());
          const exists = await contractInstance.tokenExists(tokenId).catch(() => false);
          
          if (exists) {
            console.log(`Found certificate with ID ${tokenId}`);
            const certificates = await processCertificatesBatch(contractInstance, [tokenId]);
            if (certificates && certificates.length > 0) {
              setCertificates(certificates);
              updateVisibleCertificates(certificates, searchTerm, statusFilter, setVisibleCertificates);
              setHasMore(false);
              setLastUpdated(Date.now());
              setLoading(false);
              setLoadingMore(false);
              setIsSearching(false);
              return;
            }
          }
        } catch (error) {
          console.error(`Error searching for specific certificate ID ${searchTerm}:`, error);
        }
      }
      
      // For other searches, we need to scan the blockchain
      // But we'll limit our search to the most recent certificates for performance
      const MAX_SCAN_COUNT = 1000; // Maximum number of certificates to scan
      const tokenIds = [];
      let fetchCount = 0;
      
      // We'll scan backwards from the most recent certificates
      for (let i = Number(totalSupply) - 1; i >= Math.max(0, Number(totalSupply) - MAX_SCAN_COUNT); i--) {
        try {
          const tokenId = await contractInstance.tokenByIndex(i);
          tokenIds.push(Number(tokenId));
          
          // Process in batches to avoid overloading
          if (tokenIds.length >= 20 || i === 0 || i === Number(totalSupply) - MAX_SCAN_COUNT) {
            // Process the batch and filter based on search criteria
            const batchCerts = await processCertificatesBatch(contractInstance, tokenIds);
            
            // Filter the certificates based on search criteria
            const filteredCerts = batchCerts.filter(cert => {
              if (!cert) return false;
              
              // Match student address
              const studentMatches = !studentAddressFilter || 
                cert.student.toLowerCase().includes(studentAddressFilter.toLowerCase());
              
              // Match institution
              const institutionMatches = !institutionFilter || 
                cert.institution.toLowerCase().includes(institutionFilter.toLowerCase());
              
              // Match certificate ID or course name
              const searchTermMatches = !searchTerm || 
                cert.id.includes(searchTerm) || 
                cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
              
              // Match status filter
              const statusMatches = 
                statusFilter === 'all' ||
                (statusFilter === 'verified' && cert.isVerified && !cert.isRevoked) ||
                (statusFilter === 'pending' && !cert.isVerified && !cert.isRevoked) ||
                (statusFilter === 'revoked' && cert.isRevoked);
              
              return studentMatches && institutionMatches && searchTermMatches && statusMatches;
            });
            
            // Add to existing results
            const newCertificates = [...existingCerts, ...filteredCerts];
            
            // Remove duplicates based on certificate ID
            const uniqueCertificates = deduplicateCertificates(newCertificates);
            
            setCertificates(uniqueCertificates);
            updateVisibleCertificates(uniqueCertificates, searchTerm, statusFilter, setVisibleCertificates);
            
            // Check if we've reached the max results
            if (uniqueCertificates.length >= maxResults) {
              setHasMore(false);
              setLastUpdated(Date.now());
              setLoading(false);
              setLoadingMore(false);
              setIsSearching(false);
              return;
            }
            
            // Clear the tokenIds for the next batch
            tokenIds.length = 0;
          }
          
          fetchCount++;
        } catch (error) {
          console.error(`Error scanning token at index ${i}:`, error);
          continue;
        }
      }
      
      // If we've scanned all tokens and found some matches
      if (certificates.length > 0) {
        setHasMore(false);
        setLastUpdated(Date.now());
        setLoading(false);
        setLoadingMore(false);
        setIsSearching(false);
        return;
      }
      
      // If no matches found through scanning, fall back to standard pagination
      console.log("No matches found through quick scan, falling back to standard pagination");
    }
    
    // Standard pagination approach (for non-admin or when quick scan found no matches)
    // Get token IDs for this page
    const tokenIds = [];
    let fetchCount = 0;
    let processedCount = 0;
    
    // Use a more efficient approach to fetch valid token IDs
    while (tokenIds.length < remainingToProcess && processedCount < remainingToProcess * 3) {
      try {
        const index = startIndex + fetchCount;
        const tokenId = await contractInstance.tokenByIndex(index);
        
        // Check if token exists to avoid unnecessary processing later
        const exists = await contractInstance.tokenExists(tokenId).catch(() => false);
        if (exists) {
          tokenIds.push(Number(tokenId));
        }
        
        fetchCount++;
        processedCount++;
        
        // Safety check to prevent infinite loops
        if (fetchCount >= remainingToProcess * 3) {
          break;
        }
      } catch (error) {
        processedCount++;
        if (processedCount >= totalSupply || processedCount >= remainingToProcess * 3) {
          break;
        }
      }
    }

    if (tokenIds.length === 0) {
      console.log("No valid token IDs found for this page, setting hasMore to false");
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      setIsSearching(false);
      return;
    }
    
    console.log(`Found ${tokenIds.length} valid tokenIds for processing`);
    
    // Process tokens in batches of BATCH_SIZE
    const tokensToProcess = [...tokenIds];
    const processedTokens = [];
    
    while (tokensToProcess.length > 0) {
      const batch = tokensToProcess.splice(0, BATCH_SIZE);
      const batchCertificates = await processCertificatesBatch(contractInstance, batch);
      
      // Filter certificates based on search criteria for standard pagination too
      const filteredBatch = isAdmin && reset ? 
        batchCertificates.filter(cert => {
          if (!cert) return false;
          
          // Match student address
          const studentMatches = !studentAddressFilter || 
            cert.student.toLowerCase().includes(studentAddressFilter.toLowerCase());
          
          // Match institution
          const institutionMatches = !institutionFilter || 
            cert.institution.toLowerCase().includes(institutionFilter.toLowerCase());
          
          // Match certificate ID or course name
          const searchTermMatches = !searchTerm || 
            cert.id.includes(searchTerm) || 
            cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Match status filter
          const statusMatches = 
            statusFilter === 'all' ||
            (statusFilter === 'verified' && cert.isVerified && !cert.isRevoked) ||
            (statusFilter === 'pending' && !cert.isVerified && !cert.isRevoked) ||
            (statusFilter === 'revoked' && cert.isRevoked);
          
          return studentMatches && institutionMatches && searchTermMatches && statusMatches;
        }) : batchCertificates;
        
      processedTokens.push(...filteredBatch);
      
      // Update certificates as we process batches for better UX
      const newCertificates = [...existingCerts, ...processedTokens];
      setCertificates(newCertificates);
      
      // Update visible certificates considering the current filter
      updateVisibleCertificates(newCertificates, searchTerm, statusFilter, setVisibleCertificates);
    }
    
    // Update page state
    setCurrentPage(startPage + 1);
    
    // Fix: Better hasMore logic based on how many certificates were actually processed
    // If we processed fewer than expected, there are no more certificates
    const hasMoreCertificates = processedTokens.length >= remainingToProcess;
    console.log(`Processed ${processedTokens.length} certificates, expected ${remainingToProcess}, hasMore=${hasMoreCertificates}`);
    setHasMore(hasMoreCertificates);
    
    setLastUpdated(Date.now());
    
    console.log(`Completed loading page ${startPage}, loaded ${processedTokens.length} certificates`);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    setError('Failed to fetch certificates: ' + error.message);
    
    // Fix: Set hasMore to false on error to prevent stuck "Load More" button
    setHasMore(false);
  } finally {
    setLoading(false);
    setLoadingMore(false);
    setSearchLoading(false);
    setIsSearching(false);
  }
};

export const fetchCertificates = fetchAllCertificates;
