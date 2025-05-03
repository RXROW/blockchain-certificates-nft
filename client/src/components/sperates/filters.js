import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {PAGE_SIZE, normalizeAddress} from './f1.js'; 
import { initCertificateStates } from './f2.js'; 
import { updateVisibleCertificates, processCertificatesBatch } from './cert_utilits.js';

// Create a custom hook for filters
export const useCertificateFilters = () => {
  const states = initCertificateStates();
  const {
    certificates, setCertificates,
    loading, setLoading,
    searchLoading, setSearchLoading,
    error, setError,
    selectedCertificate, setSelectedCertificate,
    showMetadata, setShowMetadata,
    showImage, setShowImage,
    imageLoading, setImageLoading,
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
    noResultsAddress, setNoResultsAddress
  } = states;
  
  // NEW: Enhanced filtering functions that use smart contract functions
  // Function to fetch certificates by course
  const fetchCertificatesByCourse = useCallback(async (courseId, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) {
        console.error('Contract is not initialized');
        return [];
      }
      
      // Check if this might be a token ID lookup rather than course ID
      // First try to look it up directly as a token ID
      try {
        const tokenId = Number(courseId);
        if (tokenId > 0) {
          const exists = await contract.tokenExists(tokenId).catch(() => false);
          if (exists) {
            console.log(`Input appears to be a valid token ID: ${tokenId}`);
            return await fetchCertificateByTokenId(contract, tokenId);
          }
        }
      } catch (error) {
        console.log(`Input ${courseId} is not a valid token ID, continuing with course search`);
      }
      
      // Check if the function exists on the contract
      if (typeof contract.getCertificatesByCourse !== 'function') {
        console.error('Contract method getCertificatesByCourse is not available.', {
          availableMethods: Object.keys(contract.interface?.functions || {}),
          contractAddress: contract.target
        });
        return [];
      }
      
      // Convert parameters to proper format expected by contract
      const courseIdNumber = Number(courseId);
      
      console.log(`Calling getCertificatesByCourse with parameters:`, {
        courseId: courseIdNumber,
        startIndex,
        limit
      });
      
      // Call the contract method to get certificates by course
      const certificateIds = await contract.getCertificatesByCourse(courseIdNumber, startIndex, limit)
        .catch(error => {
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching by course:', error);
            return [];
          }
          throw error;
        });
      
      if (!certificateIds || certificateIds.length === 0) {
        console.log(`No certificates found for course ID: ${courseIdNumber}`);
        return [];
      }
      
      console.log(`Found ${certificateIds.length} certificates for course ID: ${courseIdNumber}`);
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state with the fetched certificates
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by course:', error);
      setError('Failed to fetch certificates by course: ' + error.message);
      return [];
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);
  
  // Function to fetch certificates by date range
  const fetchCertificatesByDateRange = useCallback(async (startDate, endDate, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) {
        setError('Contract not initialized');
        setSearchLoading(false);
        return [];
      }
      
      setLoading(true);
      setError('');
      
      // Convert dates to UNIX timestamps if they're Date objects
      // Ensure we're using UTC midnight to avoid timezone issues
      let startTimestamp, endTimestamp;
      
      if (startDate instanceof Date) {
        // Set to beginning of day (UTC)
        const startUTC = new Date(startDate);
        startUTC.setUTCHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startUTC.getTime() / 1000);
      } else if (typeof startDate === 'string') {
        // Handle string dates
        const startUTC = new Date(startDate);
        startUTC.setUTCHours(0, 0, 0, 0);
        startTimestamp = Math.floor(startUTC.getTime() / 1000);
      } else {
        startTimestamp = startDate;
      }
      
      if (endDate instanceof Date) {
        // Set to end of day (UTC) to include all certificates from that day
        const endUTC = new Date(endDate);
        endUTC.setUTCHours(23, 59, 59, 999);
        endTimestamp = Math.floor(endUTC.getTime() / 1000);
      } else if (typeof endDate === 'string') {
        // Handle string dates
        const endUTC = new Date(endDate);
        endUTC.setUTCHours(23, 59, 59, 999);
        endTimestamp = Math.floor(endUTC.getTime() / 1000);
      } else {
        endTimestamp = endDate;
      }
      
      console.log(`Fetching certificates from ${new Date(startTimestamp * 1000).toISOString()} to ${new Date(endTimestamp * 1000).toISOString()}`);
      console.log(`Unix timestamps: start=${startTimestamp}, end=${endTimestamp}`);
      
      // Call the contract method
      const certificateIds = await contract.getCertificatesByDateRange(
        startTimestamp, 
        endTimestamp, 
        startIndex, 
        limit
      ).catch(error => {
        console.error('Contract error:', error);
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by date range:', error);
          return [];
        }
        throw error;
      });
      
      console.log(`Found ${certificateIds?.length || 0} certificates in date range`);
      
      if (!certificateIds || certificateIds.length === 0) {
        // Clear certificates when no results are found
        setCertificates([]);
        updateVisibleCertificates([], searchTerm, statusFilter, setVisibleCertificates);
        setHasMore(false);
        setLastUpdated(Date.now());
        setLoading(false);
        setSearchLoading(false);
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      console.log(`Certificate IDs found: ${tokenIds.join(', ')}`);
      
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Log certificate dates for debugging
      console.log(`Date range filter details:
- Start timestamp: ${startTimestamp} (${new Date(startTimestamp * 1000).toISOString()})
- End timestamp: ${endTimestamp} (${new Date(endTimestamp * 1000).toISOString()})
      `);
      
      processedCerts.forEach(cert => {
        if (cert) {
          const completionTimestamp = cert.completionTimestamp;
          const dateFormatted = new Date(completionTimestamp * 1000).toISOString();
          const isInRange = completionTimestamp >= startTimestamp && completionTimestamp <= endTimestamp;
          console.log(`Certificate ${cert.id}: 
- Completion timestamp: ${completionTimestamp} 
- Formatted date: ${dateFormatted}
- In range: ${isInRange} 
- Comparison: ${completionTimestamp} >= ${startTimestamp} && ${completionTimestamp} <= ${endTimestamp}`);
        }
      });
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by date range:', error);
      setError('Failed to fetch certificates by date range: ' + error.message);
      // Clear certificates on error
      setCertificates([]);
      updateVisibleCertificates([], searchTerm, statusFilter, setVisibleCertificates);
      return [];
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setSearchLoading, setVisibleCertificates]);
  
  // Function to fetch certificates by institution
  const fetchCertificatesByInstitution = useCallback(async (institutionAddress, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) {
        console.error('Contract is not initialized in fetchCertificatesByInstitution');
        return [];
      }
      
      console.log('Contract type in fetchCertificatesByInstitution:', typeof contract);
      console.log('Contract methods available:', Object.keys(contract).filter(k => typeof contract[k] === 'function'));
      console.log('Has getCertificatesByInstitution?', typeof contract.getCertificatesByInstitution === 'function');
      
      const cleanAddress = normalizeAddress(institutionAddress);
      if (!cleanAddress) {
        console.error('Invalid institution address format:', institutionAddress);
        return [];
      }
      
      try {
        console.log(`Calling getCertificatesByInstitution(${cleanAddress}, ${startIndex}, ${limit})`);
        
        // Check if the method exists via the interface
        if (contract.interface && typeof contract.interface.hasFunction === 'function' && 
            contract.interface.hasFunction('getCertificatesByInstitution(address,uint256,uint256)')) {
          console.log('Found getCertificatesByInstitution in interface');
        }
        
        let certificateIds;
        
        // Try to call the method if it exists
        if (typeof contract.getCertificatesByInstitution === 'function') {
          // Call with proper error handling
          console.log('Calling contract.getCertificatesByInstitution...');
          certificateIds = await contract.getCertificatesByInstitution(
            cleanAddress, 
            startIndex, 
            limit
          );
        } else {
          // Emergency fallback: try to call directly via low-level method
          console.warn('Method getCertificatesByInstitution not found, trying emergency fallback...');
          try {
            const provider = contract.runner?.provider || contract.provider;
            if (!provider) throw new Error('No provider available for fallback call');
            
            const functionSignature = 'getCertificatesByInstitution(address,uint256,uint256)';
            const data = contract.interface.encodeFunctionData(
              functionSignature, 
              [cleanAddress, startIndex, limit]
            );
            
            const result = await provider.call({
              to: contract.target,
              data
            });
            
            certificateIds = contract.interface.decodeFunctionResult(functionSignature, result)[0];
            console.log('Emergency fallback successful!');
          } catch (fallbackError) {
            console.error('Emergency fallback failed:', fallbackError);
            throw new Error('All attempts to call getCertificatesByInstitution failed');
          }
        }
        
        console.log('Received certificate IDs:', certificateIds);
        
        if (!certificateIds || certificateIds.length === 0) {
          console.log(`No certificates found for institution: ${cleanAddress}`);
          return [];
        }
        
        const tokenIds = certificateIds.map(id => Number(id));
        return await processCertificatesBatch(contract, tokenIds);
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          error: error
        });
        
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by institution:', error);
          return [];
        }
        console.error('Contract call error in getCertificatesByInstitution:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching certificates by institution:', error);
      return [];
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);
  
  // Function to fetch certificates by student
  const fetchCertificatesByStudent = useCallback(async (contract, studentAddress, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) {
        console.error('Contract is not initialized in fetchCertificatesByStudent');
        return [];
      }
      
      console.log('Contract type in fetchCertificatesByStudent:', typeof contract);
      console.log('Contract methods available:', Object.keys(contract).filter(k => typeof contract[k] === 'function'));
      console.log('Has getCertificatesByStudent?', typeof contract.getCertificatesByStudent === 'function');
      
      const cleanAddress = normalizeAddress(studentAddress);
      if (!cleanAddress) {
        console.error('Invalid student address format:', studentAddress);
        return [];
      }
      
      try {
        console.log(`Calling getCertificatesByStudent(${cleanAddress}, ${startIndex}, ${limit})`);
        
        // Check if the method exists via the interface
        if (contract.interface && typeof contract.interface.hasFunction === 'function' && 
            contract.interface.hasFunction('getCertificatesByStudent(address,uint256,uint256)')) {
          console.log('Found getCertificatesByStudent in interface');
        }
        
        let certificateIds;
        
        // Try to call the method if it exists
        if (typeof contract.getCertificatesByStudent === 'function') {
          // Call with proper error handling
          console.log('Calling contract.getCertificatesByStudent...');
          certificateIds = await contract.getCertificatesByStudent(
            cleanAddress, 
            startIndex, 
            limit
          );
        } else {
          // Emergency fallback: try to call directly via low-level method
          console.warn('Method getCertificatesByStudent not found, trying emergency fallback...');
          try {
            const provider = contract.runner?.provider || contract.provider;
            if (!provider) throw new Error('No provider available for fallback call');
            
            const functionSignature = 'getCertificatesByStudent(address,uint256,uint256)';
            const data = contract.interface.encodeFunctionData(
              functionSignature, 
              [cleanAddress, startIndex, limit]
            );
            
            const result = await provider.call({
              to: contract.target,
              data
            });
            
            certificateIds = contract.interface.decodeFunctionResult(functionSignature, result)[0];
            console.log('Emergency fallback successful!');
          } catch (fallbackError) {
            console.error('Emergency fallback failed:', fallbackError);
            throw new Error('All attempts to call getCertificatesByStudent failed');
          }
        }
        
        console.log('Received certificate IDs:', certificateIds);
        
        if (!certificateIds || certificateIds.length === 0) {
          console.log(`No certificates found for student: ${cleanAddress}`);
          return [];
        }
        
        const tokenIds = certificateIds.map(id => Number(id));
        return await processCertificatesBatch(contract, tokenIds);
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          error: error
        });
        
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by student:', error);
          return [];
        }
        console.error('Contract call error in getCertificatesByStudent:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching certificates by student:', error);
      return [];
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);

  // Add functions after fetchCertificatesByStudent and before processCertificatesBatch

  // Function to fetch pending certificates
  const fetchPendingCertificates = useCallback(async (startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      
      // Call the contract method
      const certificateIds = await contract.getPendingCertificateIds(startIndex, limit)
        .catch(error => {
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching pending certificates:', error);
            return [];
          }
          throw error;
        });
      
      if (!certificateIds || certificateIds.length === 0) {
        setLoading(false);
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching pending certificates:', error);
      setError('Failed to fetch pending certificates: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);
  
  // Function to fetch revoked certificates
  const fetchRevokedCertificates = useCallback(async (startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      
      // Call the contract method
      const certificateIds = await contract.getRevokedCertificateIds(startIndex, limit)
        .catch(error => {
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching revoked certificates:', error);
            return [];
          }
          throw error;
        });
      
      if (!certificateIds || certificateIds.length === 0) {
        setLoading(false);
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching revoked certificates:', error);
      setError('Failed to fetch revoked certificates: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);
  
  // Function to fetch verified certificates
  const fetchVerifiedCertificates = useCallback(async (startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      
      // Call the contract method
      const certificateIds = await contract.getVerifiedCertificateIds(startIndex, limit)
        .catch(error => {
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching verified certificates:', error);
            return [];
          }
          throw error;
        });
      
      if (!certificateIds || certificateIds.length === 0) {
        setLoading(false);
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching verified certificates:', error);
      setError('Failed to fetch verified certificates: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setHasMore, setLastUpdated, setVisibleCertificates]);
  
  // Function to get detailed batch data for certificates
  const fetchCertificatesBatchDetails = useCallback(async (tokenIds) => {
    try {
      if (!contract || !tokenIds || tokenIds.length === 0) return null;
      
      // Call the contract method to get additional details in batch
      const details = await contract.getCertificatesBatchDetails(tokenIds)
        .catch(error => {
          if (error.message.includes('ERC721NonexistentToken')) {
            console.error('One or more certificates do not exist:', error);
            return null;
          }
          throw error;
        });
      
      if (!details) return null;
      
      // Format the data into a more usable structure
      const [revocationReasons, versions, lastUpdateDates, updateReasons] = details;
      
      // Create a mapping of tokenId -> details
      const detailsMap = {};
      tokenIds.forEach((tokenId, index) => {
        detailsMap[tokenId.toString()] = {
          revocationReason: revocationReasons[index],
          version: versions[index].toString(),
          lastUpdateDate: Number(lastUpdateDates[index]),
          lastUpdateDateFormatted: new Date(Number(lastUpdateDates[index]) * 1000).toLocaleString(),
          updateReason: updateReasons[index]
        };
      });

      console.log('Formatted certificate details:', detailsMap);
      
      return detailsMap;
    } catch (error) {
      console.error('Error fetching certificate batch details:', error);
      return null;
    }
  }, [contract]);
  
  // Function to fetch a certificate by its token ID
  const fetchCertificateByTokenId = useCallback(async (tokenId) => {
    try {
      if (!contract) {
        console.error('Contract is not initialized');
        return [];
      }
      
      setLoading(true);
      setError('');
      
      const tokenIdNumber = Number(tokenId);
      
      // Check if token exists
      const exists = await contract.tokenExists(tokenIdNumber).catch(() => false);
      if (!exists) {
        console.log(`Token ID ${tokenIdNumber} does not exist`);
        setError(`Certificate with ID ${tokenIdNumber} does not exist`);
        setLoading(false);
        return [];
      }
      
      console.log(`Fetching certificate with token ID: ${tokenIdNumber}`);
      const certificateData = await processCertificatesBatch(contract, [tokenIdNumber]);
      
      // Update state with the fetched certificate
      setCertificates(certificateData);
      updateVisibleCertificates(certificateData, searchTerm, statusFilter, setVisibleCertificates);
      setLastUpdated(Date.now());
      
      return certificateData;
    } catch (error) {
      console.error('Error fetching certificate by token ID:', error);
      setError('Failed to fetch certificate: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, setLastUpdated, setVisibleCertificates]);

  return {
    // Return all the state values
    ...states,
    
    // Return all the filter functions
    fetchCertificatesByCourse,
    fetchCertificatesByDateRange,
    fetchCertificatesByInstitution,
    fetchCertificatesByStudent,
    fetchPendingCertificates,
    fetchRevokedCertificates,
    fetchVerifiedCertificates,
    fetchCertificatesBatchDetails,
    fetchCertificateByTokenId
  };
};

// Export all filter functions directly
export const fetchCertificatesByCourse = async (contract, courseId, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) {
      console.error('Contract is not initialized');
      return [];
    }
    
    // Check if this might be a token ID lookup rather than course ID
    // First try to look it up directly as a token ID
    try {
      const tokenId = Number(courseId);
      if (tokenId > 0) {
        const exists = await contract.tokenExists(tokenId).catch(() => false);
        if (exists) {
          console.log(`Input appears to be a valid token ID: ${tokenId}`);
          return await fetchCertificateByTokenId(contract, tokenId);
        }
      }
    } catch (error) {
      console.log(`Input ${courseId} is not a valid token ID, continuing with course search`);
    }
    
    // Check if the function exists on the contract
    if (typeof contract.getCertificatesByCourse !== 'function') {
      console.error('Contract method getCertificatesByCourse is not available.', {
        availableMethods: Object.keys(contract.interface?.functions || {}),
        contractAddress: contract.target
      });
      return [];
    }
    
    // Convert parameters to proper format expected by contract
    const courseIdNumber = Number(courseId);
    
    console.log(`Calling getCertificatesByCourse with parameters:`, {
      courseId: courseIdNumber,
      startIndex,
      limit
    });
    
    // Call the contract method to get certificates by course
    const certificateIds = await contract.getCertificatesByCourse(courseIdNumber, startIndex, limit)
      .catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by course:', error);
          return [];
        }
        throw error;
      });
    
    if (!certificateIds || certificateIds.length === 0) {
      console.log(`No certificates found for course ID: ${courseIdNumber}`);
      return [];
    }
    
    console.log(`Found ${certificateIds.length} certificates for course ID: ${courseIdNumber}`);
    
    // Process the returned certificate IDs
    const tokenIds = certificateIds.map(id => Number(id));
    return await processCertificatesBatch(contract, tokenIds);
  } catch (error) {
    console.error('Error fetching certificates by course:', error);
    return [];
  }
};

export const fetchCertificatesByDateRange = async (contract, startDate, endDate, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) return [];
    
    // Convert dates to UNIX timestamps
    let startTimestamp, endTimestamp;
    
    if (startDate instanceof Date) {
      const startUTC = new Date(startDate);
      startUTC.setUTCHours(0, 0, 0, 0);
      startTimestamp = Math.floor(startUTC.getTime() / 1000);
    } else if (typeof startDate === 'string') {
      const startUTC = new Date(startDate);
      startUTC.setUTCHours(0, 0, 0, 0);
      startTimestamp = Math.floor(startUTC.getTime() / 1000);
    } else {
      startTimestamp = startDate;
    }
    
    if (endDate instanceof Date) {
      const endUTC = new Date(endDate);
      endUTC.setUTCHours(23, 59, 59, 999);
      endTimestamp = Math.floor(endUTC.getTime() / 1000);
    } else if (typeof endDate === 'string') {
      const endUTC = new Date(endDate);
      endUTC.setUTCHours(23, 59, 59, 999);
      endTimestamp = Math.floor(endUTC.getTime() / 1000);
    } else {
      endTimestamp = endDate;
    }
    
    const certificateIds = await contract.getCertificatesByDateRange(
      startTimestamp, 
      endTimestamp, 
      startIndex, 
      limit
    ).catch(error => {
      if (error.message.includes('ERC721OutOfBoundsIndex')) {
        console.error('Index out of bounds when fetching by date range:', error);
        return [];
      }
      throw error;
    });
    
    if (!certificateIds || certificateIds.length === 0) {
      return [];
    }
    
    const tokenIds = certificateIds.map(id => Number(id));
    return await processCertificatesBatch(contract, tokenIds);
  } catch (error) {
    console.error('Error fetching certificates by date range:', error);
    return [];
  }
};

export const fetchCertificatesByInstitution = async (contract, institutionAddress, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) {
      console.error('Contract is not initialized in fetchCertificatesByInstitution');
      return [];
    }
    
    console.log('Contract type in fetchCertificatesByInstitution:', typeof contract);
    console.log('Contract methods available:', Object.keys(contract).filter(k => typeof contract[k] === 'function'));
    console.log('Has getCertificatesByInstitution?', typeof contract.getCertificatesByInstitution === 'function');
    
    const cleanAddress = normalizeAddress(institutionAddress);
    if (!cleanAddress) {
      console.error('Invalid institution address format:', institutionAddress);
      return [];
    }
    
    try {
      console.log(`Calling getCertificatesByInstitution(${cleanAddress}, ${startIndex}, ${limit})`);
      
      // Check if the method exists via the interface
      if (contract.interface && typeof contract.interface.hasFunction === 'function' && 
          contract.interface.hasFunction('getCertificatesByInstitution(address,uint256,uint256)')) {
        console.log('Found getCertificatesByInstitution in interface');
      }
      
      let certificateIds;
      
      // Try to call the method if it exists
      if (typeof contract.getCertificatesByInstitution === 'function') {
        // Call with proper error handling
        console.log('Calling contract.getCertificatesByInstitution...');
        certificateIds = await contract.getCertificatesByInstitution(
          cleanAddress, 
          startIndex, 
          limit
        );
      } else {
        // Emergency fallback: try to call directly via low-level method
        console.warn('Method getCertificatesByInstitution not found, trying emergency fallback...');
        try {
          const provider = contract.runner?.provider || contract.provider;
          if (!provider) throw new Error('No provider available for fallback call');
          
          const functionSignature = 'getCertificatesByInstitution(address,uint256,uint256)';
          const data = contract.interface.encodeFunctionData(
            functionSignature, 
            [cleanAddress, startIndex, limit]
          );
          
          const result = await provider.call({
            to: contract.target,
            data
          });
          
          certificateIds = contract.interface.decodeFunctionResult(functionSignature, result)[0];
          console.log('Emergency fallback successful!');
        } catch (fallbackError) {
          console.error('Emergency fallback failed:', fallbackError);
          throw new Error('All attempts to call getCertificatesByInstitution failed');
        }
      }
      
      console.log('Received certificate IDs:', certificateIds);
      
      if (!certificateIds || certificateIds.length === 0) {
        console.log(`No certificates found for institution: ${cleanAddress}`);
        return [];
      }
      
      const tokenIds = certificateIds.map(id => Number(id));
      return await processCertificatesBatch(contract, tokenIds);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        error: error
      });
      
      if (error.message.includes('ERC721OutOfBoundsIndex')) {
        console.error('Index out of bounds when fetching by institution:', error);
        return [];
      }
      console.error('Contract call error in getCertificatesByInstitution:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching certificates by institution:', error);
    return [];
  }
};

export const fetchCertificatesByStudent = async (contract, studentAddress, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) {
      console.error('Contract is not initialized in fetchCertificatesByStudent');
      return [];
    }
    
    console.log('Contract type in fetchCertificatesByStudent:', typeof contract);
    console.log('Contract methods available:', Object.keys(contract).filter(k => typeof contract[k] === 'function'));
    console.log('Has getCertificatesByStudent?', typeof contract.getCertificatesByStudent === 'function');
    
    const cleanAddress = normalizeAddress(studentAddress);
    if (!cleanAddress) {
      console.error('Invalid student address format:', studentAddress);
      return [];
    }
    
    try {
      console.log(`Calling getCertificatesByStudent(${cleanAddress}, ${startIndex}, ${limit})`);
      
      // Check if the method exists via the interface
      if (contract.interface && typeof contract.interface.hasFunction === 'function' && 
          contract.interface.hasFunction('getCertificatesByStudent(address,uint256,uint256)')) {
        console.log('Found getCertificatesByStudent in interface');
      }
      
      let certificateIds;
      
      // Try to call the method if it exists
      if (typeof contract.getCertificatesByStudent === 'function') {
        // Call with proper error handling
        console.log('Calling contract.getCertificatesByStudent...');
        certificateIds = await contract.getCertificatesByStudent(
          cleanAddress, 
          startIndex, 
          limit
        );
      } else {
        // Emergency fallback: try to call directly via low-level method
        console.warn('Method getCertificatesByStudent not found, trying emergency fallback...');
        try {
          const provider = contract.runner?.provider || contract.provider;
          if (!provider) throw new Error('No provider available for fallback call');
          
          const functionSignature = 'getCertificatesByStudent(address,uint256,uint256)';
          const data = contract.interface.encodeFunctionData(
            functionSignature, 
            [cleanAddress, startIndex, limit]
          );
          
          const result = await provider.call({
            to: contract.target,
            data
          });
          
          certificateIds = contract.interface.decodeFunctionResult(functionSignature, result)[0];
          console.log('Emergency fallback successful!');
        } catch (fallbackError) {
          console.error('Emergency fallback failed:', fallbackError);
          throw new Error('All attempts to call getCertificatesByStudent failed');
        }
      }
      
      console.log('Received certificate IDs:', certificateIds);
      
      if (!certificateIds || certificateIds.length === 0) {
        console.log(`No certificates found for student: ${cleanAddress}`);
        return [];
      }
      
      const tokenIds = certificateIds.map(id => Number(id));
      return await processCertificatesBatch(contract, tokenIds);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        error: error
      });
      
      if (error.message.includes('ERC721OutOfBoundsIndex')) {
        console.error('Index out of bounds when fetching by student:', error);
        return [];
      }
      console.error('Contract call error in getCertificatesByStudent:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching certificates by student:', error);
    return [];
  }
};

export const fetchPendingCertificates = async (contract, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) return [];
    
    const certificateIds = await contract.getPendingCertificateIds(startIndex, limit)
      .catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching pending certificates:', error);
          return [];
        }
        throw error;
      });
    
    if (!certificateIds || certificateIds.length === 0) {
      return [];
    }
    
    const tokenIds = certificateIds.map(id => Number(id));
    return await processCertificatesBatch(contract, tokenIds);
  } catch (error) {
    console.error('Error fetching pending certificates:', error);
    return [];
  }
};

export const fetchRevokedCertificates = async (contract, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) return [];
    
    const certificateIds = await contract.getRevokedCertificateIds(startIndex, limit)
      .catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching revoked certificates:', error);
          return [];
        }
        throw error;
      });
    
    if (!certificateIds || certificateIds.length === 0) {
      return [];
    }
    
    const tokenIds = certificateIds.map(id => Number(id));
    return await processCertificatesBatch(contract, tokenIds);
  } catch (error) {
    console.error('Error fetching revoked certificates:', error);
    return [];
  }
};

export const fetchVerifiedCertificates = async (contract, startIndex = 0, limit = PAGE_SIZE) => {
  try {
    if (!contract) return [];
    
    const certificateIds = await contract.getVerifiedCertificateIds(startIndex, limit)
      .catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching verified certificates:', error);
          return [];
        }
        throw error;
      });
    
    if (!certificateIds || certificateIds.length === 0) {
      return [];
    }
    
    const tokenIds = certificateIds.map(id => Number(id));
    return await processCertificatesBatch(contract, tokenIds);
  } catch (error) {
    console.error('Error fetching verified certificates:', error);
    return [];
  }
};

export const fetchCertificatesBatchDetails = async (contract, tokenIds) => {
  try {
    if (!contract || !tokenIds || tokenIds.length === 0) return null;
    
    const details = await contract.getCertificatesBatchDetails(tokenIds)
      .catch(error => {
        if (error.message.includes('ERC721NonexistentToken')) {
          console.error('One or more certificates do not exist:', error);
          return null;
        }
        throw error;
      });
    
    if (!details) return null;
    
    const [revocationReasons, versions, lastUpdateDates, updateReasons] = details;
    
    const detailsMap = {};
    tokenIds.forEach((tokenId, index) => {
      detailsMap[tokenId.toString()] = {
        revocationReason: revocationReasons[index],
        version: versions[index].toString(),
        lastUpdateDate: Number(lastUpdateDates[index]),
        lastUpdateDateFormatted: new Date(Number(lastUpdateDates[index]) * 1000).toLocaleString(),
        updateReason: updateReasons[index]
      };
    });
    
    return detailsMap;
  } catch (error) {
    console.error('Error fetching certificate batch details:', error);
    return null;
  }
};

// Add new function to fetch a certificate by token ID
export const fetchCertificateByTokenId = async (contract, tokenId) => {
  try {
    if (!contract) return null;
    
    // Check if token exists
    const exists = await contract.tokenExists(tokenId).catch(() => false);
    if (!exists) {
      console.log(`Token ID ${tokenId} does not exist`);
      return [];
    }
    
    console.log(`Fetching certificate with token ID: ${tokenId}`);
    const certificateData = await processCertificatesBatch(contract, [Number(tokenId)]);
    return certificateData;
  } catch (error) {
    console.error('Error fetching certificate by token ID:', error);
    return [];
  }
};

// Function to get course names
export const fetchCourseNames = async (contract, courseIds) => {
  try {
    if (!contract || !courseIds || courseIds.length === 0) return {};

    // Check if the function exists on the contract
    if (typeof contract.getCourseNamesBatch !== 'function') {
      console.error('Contract method getCourseNamesBatch is not available');
      if (typeof contract.getCourseName === 'function') {
        // Fall back to fetching one by one
        const courseNames = {};
        for (const courseId of courseIds) {
          try {
            const name = await contract.getCourseName(courseId);
            courseNames[courseId] = name;
          } catch (error) {
            console.error(`Error fetching course name for ID ${courseId}:`, error);
            courseNames[courseId] = `Course ${courseId}`;
          }
        }
        return courseNames;
      }
      return {};
    }
    
    // Use batch function
    const names = await contract.getCourseNamesBatch(courseIds);
    
    // Create mapping of courseId -> courseName
    const courseNames = {};
    courseIds.forEach((id, index) => {
      courseNames[id] = names[index];
    });
    
    return courseNames;
  } catch (error) {
    console.error('Error fetching course names:', error);
    return {};
  }
};

// Function to search certificates by course name (approximate match)
export const searchCertificatesByCourseName = async (contract, courseName, limit = PAGE_SIZE) => {
  try {
    if (!contract || !courseName) return [];
    
    // Since there's no direct method to search by name, we need to:
    // 1. Get all available certificates (limited to a reasonable amount)
    // 2. Fetch their course IDs
    // 3. Get course names for those IDs
    // 4. Filter by name match
    
    // Get total supply
    const totalSupply = await contract.totalSupply().catch(() => 0);
    if (totalSupply === 0) return [];
    
    // Limit to avoid processing too many certificates
    const maxToCheck = Math.min(Number(totalSupply), 100);
    const certificateIds = [];
    
    // Get most recent certificates first as they're more likely relevant
    for (let i = 0; i < maxToCheck; i++) {
      try {
        const tokenId = await contract.tokenByIndex(Number(totalSupply) - 1 - i);
        certificateIds.push(Number(tokenId));
      } catch (err) {
        continue;
      }
    }
    
    if (certificateIds.length === 0) return [];
    
    // Process certificates to get their data including course IDs
    const processedCerts = await processCertificatesBatch(contract, certificateIds);
    
    // Extract unique course IDs
    const uniqueCourseIds = [...new Set(processedCerts.map(cert => cert.courseId))];
    
    // Get course names for these IDs
    const courseNames = await fetchCourseNames(contract, uniqueCourseIds);
    
    // Filter certificates by course name (case-insensitive partial match)
    const namePattern = new RegExp(courseName.trim(), 'i');
    const matchingCerts = processedCerts.filter(cert => {
      const courseName = courseNames[cert.courseId] || `Course ${cert.courseId}`;
      return namePattern.test(courseName);
    });
    
    // Sort results by relevance (exact match first, then partial match)
    matchingCerts.sort((a, b) => {
      const nameA = courseNames[a.courseId] || '';
      const nameB = courseNames[b.courseId] || '';
      
      // Exact matches first
      const exactMatchA = nameA.toLowerCase() === courseName.toLowerCase();
      const exactMatchB = nameB.toLowerCase() === courseName.toLowerCase();
      
      if (exactMatchA && !exactMatchB) return -1;
      if (!exactMatchA && exactMatchB) return 1;
      
      // Then starts with
      const startsWithA = nameA.toLowerCase().startsWith(courseName.toLowerCase());
      const startsWithB = nameB.toLowerCase().startsWith(courseName.toLowerCase());
      
      if (startsWithA && !startsWithB) return -1;
      if (!startsWithA && startsWithB) return 1;
      
      // Then by course ID (newer courses first)
      return Number(b.courseId) - Number(a.courseId);
    });
    
    // Limit results
    return matchingCerts.slice(0, limit);
  } catch (error) {
    console.error('Error searching certificates by course name:', error);
    return [];
  }
};