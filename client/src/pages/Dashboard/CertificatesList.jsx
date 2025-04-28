import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { ContractFactory } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { FaEye, FaFileAlt, FaSpinner, FaCheck, FaBan, FaExchangeAlt, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import PINATA_CONFIG from '../../config/pinata';
import debounce from 'lodash/debounce';
import { ethers } from 'ethers';

const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkM2Q0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YzcyN2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

const BATCH_SIZE = 20;
const MAX_CERTIFICATES = 10000;
const DISPLAY_LIMIT = 100;
const PAGE_SIZE = 10;
const CACHE_TTL = 5 * 60 * 1000;
const CERTIFICATES_CACHE_KEY = 'certificates_cache';
const PAGINATION_KEY = 'certificates_pagination';
const IMAGE_CACHE_KEY = 'images_cache';
const METADATA_CACHE_KEY = 'metadata_cache';
const IPFS_GATEWAYS = [
  PINATA_CONFIG.gateway,
  'ipfs.io',
  'dweb.link',
  'cloudflare-ipfs.com'
];

const serializeBigInt = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
};

const deserializeBigInt = (str) => {
  return JSON.parse(str, (key, value) => {
    // Check if the value matches a BigInt pattern (numeric string)
    if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
      return BigInt(value);
    }
    return value;
  });
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = deserializeBigInt(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, serializeBigInt(cacheData));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

const fetchMetadataFromIPFS = async (cid) => {
  try {
    // Check cache first
    const cachedMetadata = getCachedData(`${METADATA_CACHE_KEY}_${cid}`);
    if (cachedMetadata) {
      console.log('Using cached metadata for:', cid);
      return cachedMetadata;
    }

    for (const gateway of IPFS_GATEWAYS) {
      try {
        const ipfsUrl = `https://${gateway}/ipfs/${cid}`;
        const response = await fetch(ipfsUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const metadata = await response.json();
          const result = { ...metadata, gateway, url: ipfsUrl };
          setCachedData(`${METADATA_CACHE_KEY}_${cid}`, result);
          return result;
        }
      } catch (err) {
        continue;
      }
    }
    throw new Error('Failed to fetch metadata from all gateways');
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
};

const getImageUrlFromMetadata = (metadata, imageCID) => {
  if (!metadata || !imageCID) return null;
  
  // Check image cache
  const cachedImageUrl = getCachedData(`${IMAGE_CACHE_KEY}_${imageCID}`);
  if (cachedImageUrl) return cachedImageUrl;
  
  const gateway = metadata.gateway || IPFS_GATEWAYS[0];
  const imageUrl = `https://${gateway}/ipfs/${imageCID}`;
  setCachedData(`${IMAGE_CACHE_KEY}_${imageCID}`, imageUrl);
  return imageUrl;
};

// Function to normalize an Ethereum address without checksum validation
const normalizeAddress = (address) => {
  if (!address) return '';
  
  // Just clean up the address without checksum validation
  let cleaned = address.trim();
  
  // Check basic format
  if (!cleaned.match(/^0x[0-9a-fA-F]{40}$/)) {
    return null;
  }
  
  // Return the lowercase version which works for comparisons
  return cleaned.toLowerCase();
};

// Utility to remove duplicate certificates based on ID
const deduplicateCertificates = (certificates) => {
  const uniqueCertificates = [];
  const ids = new Set();
  
  for (const cert of certificates) {
    if (cert && cert.id && !ids.has(cert.id)) {
      ids.add(cert.id);
      uniqueCertificates.push(cert);
    }
  }
  
  return uniqueCertificates;
};

const CertificatesList = () => {
  const [certificates, setCertificates] = useState([]);
  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState({});  // Track loading by certificate ID
  const [revokeLoading, setRevokeLoading] = useState({});  // Track loading by certificate ID
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [allCertificatesLoading, setAllCertificatesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCertificates, setVisibleCertificates] = useState([]);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [studentAddressFilter, setStudentAddressFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState(null);
  const [maxResults, setMaxResults] = useState(50);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Add a state variable to track when an address is valid but has no certificates
  const [noResultsAddress, setNoResultsAddress] = useState({
    type: null, // 'student' or 'institution'
    address: null
  });

  // Define updateVisibleCertificates function for filtering
  const updateVisibleCertificates = useCallback((allCerts) => {
    // First deduplicate the input certificates
    const uniqueCerts = deduplicateCertificates(allCerts);
    
    const filtered = uniqueCerts.filter(cert => {
      const matchesSearch = !searchTerm || 
        cert.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.id?.includes(searchTerm) ||
        cert.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.student?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'verified' && cert.isVerified && !cert.isRevoked) ||
        (statusFilter === 'pending' && !cert.isVerified && !cert.isRevoked) ||
        (statusFilter === 'revoked' && cert.isRevoked);

      return matchesSearch && matchesStatus;
    });
    
    setVisibleCertificates(filtered.slice(0, DISPLAY_LIMIT));
  }, [searchTerm, statusFilter]);

  // Process certificates in batches - improved for scaling
  const processCertificatesBatch = useCallback(async (contractInstance, tokenIds) => {
    try {
      const batchPromises = tokenIds.map(async (tokenId) => {
        try {
          // Use tokenExists method from contract instead of non-existent exists
          const exists = await contractInstance.tokenExists(tokenId).catch(() => false);
          if (!exists) {
            console.log(`Certificate ${tokenId} does not exist, skipping...`);
            return null;
          }

          // Get certificate data
          const cert = await contractInstance.getCertificate(tokenId).catch(err => {
            console.log(`Error getting certificate ${tokenId}:`, err.message);
            return null;
          });
          
          if (!cert || cert.length === 0) {
            console.log(`No data found for certificate ${tokenId}, skipping...`);
            return null;
          }

          // Get token URI and certificate data in parallel
          const [tokenURI, certData] = await Promise.all([
            contractInstance.tokenURI(tokenId).catch(() => ''),
            contractInstance.academicCertificates(tokenId).catch(() => null)
          ]);

          const finalTokenURI = tokenURI || (certData?.certificateHash || '');
          
          // For better performance, fetch just the name metadata immediately
          let metadata = null;
          let imageCID = null;
          let imageUrl = null;
          let courseName = `Certificate ${tokenId}`;
          
          // Check cache first for metadata
          if (finalTokenURI) {
            const metadataCID = finalTokenURI.startsWith('ipfs://') ? finalTokenURI.slice(7) : finalTokenURI;
            const cachedMetadata = getCachedData(`${METADATA_CACHE_KEY}_${metadataCID}`);
            
            if (cachedMetadata) {
              // Use cached metadata
              metadata = cachedMetadata;
              courseName = metadata.name || `Certificate ${tokenId}`;
              
              if (metadata.image) {
                imageCID = metadata.image.startsWith('ipfs://') ? metadata.image.slice(7) : metadata.image;
                imageUrl = getImageUrlFromMetadata(metadata, imageCID);
              }
            } else {
              // Fetch minimal metadata (just for the name) - quick request
              try {
                // Try first gateway with timeout
                const ipfsUrl = `https://${IPFS_GATEWAYS[0]}/ipfs/${metadataCID}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const response = await fetch(ipfsUrl, { 
                  signal: controller.signal,
                  headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  const minimalMetadata = await response.json();
                  courseName = minimalMetadata.name || `Certificate ${tokenId}`;
                  // Store minimal data but mark as not fully loaded
                  metadata = { name: courseName, _partialLoad: true };
                }
              } catch (err) {
                // If quick load fails, keep default name and load fully later
                console.log(`Quick metadata fetch failed for ${tokenId}, will load later`);
              }
            }
          }

          // Extract completion timestamp and create a proper date
          const completionTimestamp = Number(cert[3]);
          const completionDate = new Date(completionTimestamp * 1000);
          
          // Format date consistently using the user's locale but keep UTC for filtering
          const localDateString = completionDate.toLocaleDateString();
          const utcDateString = completionDate.toUTCString();
          
          console.log(`Certificate ${tokenId} completion timestamp: ${completionTimestamp}, date: ${completionDate.toISOString()}, local: ${localDateString}, UTC: ${utcDateString}`);

          // Create basic certificate data - name is now loaded if possible
          return {
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            tokenURI,
            metadataCID: finalTokenURI ? (finalTokenURI.startsWith('ipfs://') ? finalTokenURI.slice(7) : finalTokenURI) : null,
            imageCID,
            imageUrl,
            metadata,
            student: cert[0],
            institution: cert[1],
            courseId: cert[2].toString(),
            courseName: courseName, // Now using actual name when available
            completionDate: localDateString,
            completionTimestamp: completionTimestamp, // Store the raw timestamp for filtering
            completionDateUTC: utcDateString, // Store UTC date string for clarity
            grade: Number(cert[4]),
            isVerified: cert[5],
            isRevoked: cert[6],
            revocationReason: cert[7],
            version: cert[8].toString(),
            lastUpdateDate: cert[9],
            updateReason: cert[10],
            metadataLoaded: metadata && !metadata._partialLoad // Track if full metadata is loaded
          };
        } catch (error) {
          console.error(`Error processing certificate ${tokenId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      const validCertificates = results.filter(cert => cert !== null);
      console.log(`Successfully processed ${validCertificates.length} of ${tokenIds.length} certificates in batch`);
      return validCertificates;
    } catch (error) {
      console.error('Error processing certificate batch:', error);
      return [];
    }
  }, []);

  // NEW: Enhanced filtering functions that use smart contract functions
  // Function to fetch certificates by course
  const fetchCertificatesByCourse = useCallback(async (courseId, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      
      // Call the contract method to get certificates by course
      const certificateIds = await contract.getCertificatesByCourse(courseId, startIndex, limit)
        .catch(error => {
          // Handle specific error types
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching by course:', error);
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
      
      // Update state with the fetched certificates
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by course:', error);
      setError('Failed to fetch certificates by course: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
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
        updateVisibleCertificates([]);
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
      updateVisibleCertificates(processedCerts);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by date range:', error);
      setError('Failed to fetch certificates by date range: ' + error.message);
      // Clear certificates on error
      setCertificates([]);
      updateVisibleCertificates([]);
      return [];
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
  // Function to fetch certificates by institution
  const fetchCertificatesByInstitution = useCallback(async (institutionAddress, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      // Reset no results state
      setNoResultsAddress({ type: null, address: null });
      
      // Use the normalize function to validate and format the address
      const cleanAddress = normalizeAddress(institutionAddress);
      
      // Check if address is valid
      if (!cleanAddress) {
        setError('Invalid institution address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
        setLoading(false);
        setSearchLoading(false); // Clear search loading state for invalid address
        return [];
      }
      
      console.log(`Fetching certificates for institution: ${cleanAddress}`);
      
      // Call the contract method
      const certificateIds = await contract.getCertificatesByInstitution(
        cleanAddress, 
        startIndex, 
        limit
      ).catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by institution:', error);
          return [];
        }
        throw error;
      });
      
      if (!certificateIds || certificateIds.length === 0) {
        // This is not an error, just no results (valid address but no certificates)
        console.log(`No certificates found for institution: ${cleanAddress}`);
        // Set special state for valid address with no certificates
        setNoResultsAddress({ 
          type: 'institution', 
          address: cleanAddress 
        });
        setCertificates([]);
        updateVisibleCertificates([]);
        setLoading(false);
        setSearchLoading(false); // Clear search loading state when no results
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by institution:', error);
      
      // Show user-friendly error message for common errors
      if (error.message.includes('bad address checksum')) {
        setError(`Failed to fetch certificates: The address format is valid but has an incorrect checksum. Please make sure you copied the address correctly.`);
      } else {
        setError('Failed to fetch certificates by institution: ' + error.message);
      }
      
      return [];
    } finally {
      setLoading(false);
      setSearchLoading(false); // Ensure search loading state is cleared in all cases
    }
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
  // Function to fetch certificates by student
  const fetchCertificatesByStudent = useCallback(async (studentAddress, startIndex = 0, limit = PAGE_SIZE) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      // Reset no results state
      setNoResultsAddress({ type: null, address: null });
      
      // Use the normalize function to validate and format the address
      const cleanAddress = normalizeAddress(studentAddress);
      
      // Check if address is valid
      if (!cleanAddress) {
        setError('Invalid student address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
        setLoading(false);
        setSearchLoading(false); // Clear search loading state for invalid address
        return [];
      }
      
      console.log(`Fetching certificates for student: ${cleanAddress}`);
      
      // Call the contract method
      const certificateIds = await contract.getCertificatesByStudent(
        cleanAddress, 
        startIndex, 
        limit
      ).catch(error => {
        if (error.message.includes('ERC721OutOfBoundsIndex')) {
          console.error('Index out of bounds when fetching by student:', error);
          return [];
        }
        throw error;
      });
      
      if (!certificateIds || certificateIds.length === 0) {
        // This is not an error, just no results (valid address but no certificates)
        console.log(`No certificates found for student: ${cleanAddress}`);
        // Set special state for valid address with no certificates
        setNoResultsAddress({ 
          type: 'student', 
          address: cleanAddress 
        });
        setCertificates([]);
        updateVisibleCertificates([]);
        setLoading(false);
        setSearchLoading(false); // Clear search loading state when no results
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // Update state
      setCertificates(processedCerts);
      updateVisibleCertificates(processedCerts);
      setHasMore(certificateIds.length >= limit);
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching certificates by student:', error);
      
      // Show user-friendly error message for common errors
      if (error.message.includes('bad address checksum')) {
        setError(`Failed to fetch certificates: The address format is valid but has an incorrect checksum. Please make sure you copied the address correctly.`);
      } else {
        setError('Failed to fetch certificates by student: ' + error.message);
      }
      
      return [];
    } finally {
      setLoading(false);
      setSearchLoading(false); // Ensure search loading state is cleared in all cases
    }
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);

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
      updateVisibleCertificates(processedCerts);
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
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
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
      updateVisibleCertificates(processedCerts);
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
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
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
      updateVisibleCertificates(processedCerts);
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
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);
  
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

  // Fetch all certificates with pagination
  const fetchAllCertificates = useCallback(async (contractInstance, reset = false) => {
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
          }
          
          // Update state
          const uniqueCerts = deduplicateCertificates(processedCerts);
          setCertificates(uniqueCerts);
          updateVisibleCertificates(uniqueCerts);
          setHasMore(true);
          setLastUpdated(Date.now());
        } else {
          console.error("No certificate IDs found, even though supply is positive");
          setError("Failed to retrieve certificates. Please try again.");
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
                updateVisibleCertificates(certificates);
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
              updateVisibleCertificates(uniqueCertificates);
              
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
        updateVisibleCertificates(newCertificates);
      }
      
      // Update page state
      setCurrentPage(startPage + 1);
      setHasMore(processedTokens.length >= remainingToProcess);
      setLastUpdated(Date.now());
      
      console.log(`Completed loading page ${startPage}, loaded ${processedTokens.length} certificates`);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates: ' + error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, certificates, loadingMore, processCertificatesBatch, updateVisibleCertificates, searchTerm, statusFilter, studentAddressFilter, institutionFilter, isAdmin, maxResults]);

  // Update visible certificates when filters change
  useEffect(() => {
    updateVisibleCertificates(certificates);
  }, [certificates, searchTerm, statusFilter, updateVisibleCertificates]);

  // Initialize wallet and contract
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting initialization...');
        setLoading(true);
        setError('');

        // Check if MetaMask is installed
        if (!window.ethereum) {
          setError('Please install MetaMask to use this application');
          setLoading(false);
          return;
        }

        // Connect wallet first
        console.log('Connecting wallet...');
        const connectedAccount = await connectWallet();
        if (!connectedAccount) {
          console.log('Failed to connect wallet');
          setError('Please connect your wallet to view certificates');
          setLoading(false);
          return;
        }

        // Check network
        console.log('Checking network...');
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111n) { // Sepolia
          setError('Please connect to Sepolia network');
          setLoading(false);
          return;
        }

        // Initialize contract
        console.log('Initializing contract...');
        const contractInstance = new Contract(
          contractAddress.SoulboundCertificateNFT,
          contractABI.SoulboundCertificateNFT,
          provider
        );
        setContract(contractInstance);

        // Check admin status
        console.log('Checking admin status...');
        const adminStatus = await checkAdminStatus(contractInstance, connectedAccount);

        // Fetch appropriate certificates based on admin status
        console.log('Contract initialized, fetching certificates...');
        if (adminStatus) {
          // Admin users see all certificates
          await fetchAllCertificates(contractInstance, true);
        } else {
          // Regular users see only their certificates
          await fetchCertificates(contractInstance, connectedAccount);
        }

      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []); 

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
          await fetchAllCertificates(contract);
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
  }, [contract]);

  // Improved event handlers for real-time updates
  const handleCertificateEvent = useCallback(async (event) => {
    if (!contract) return;
    
    try {
      // Extract the token ID from the event
      const tokenId = event?.args?.tokenId;
      
      console.log(`Certificate event detected for token ${tokenId}, updating data...`);
      
      if (tokenId) {
        // Only update the specific certificate that changed
        const cert = await contract.getCertificate(tokenId).catch(() => null);
        
        if (cert) {
          // Create an updated certificate object
          const updatedCert = {
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            student: cert[0],
            institution: cert[1],
            courseId: cert[2].toString(),
            completionDate: new Date(Number(cert[3]) * 1000).toLocaleDateString(),
            grade: Number(cert[4]),
            isVerified: cert[5],
            isRevoked: cert[6],
            revocationReason: cert[7],
            version: cert[8].toString(),
            lastUpdateDate: cert[9],
            updateReason: cert[10]
          };
          
          // Find and update the specific certificate in our list
          setCertificates(prevCerts => {
            const index = prevCerts.findIndex(c => c.id === tokenId.toString());
            
            if (index >= 0) {
              // Update existing certificate
              const newCerts = [...prevCerts];
              newCerts[index] = {
                ...newCerts[index],
                ...updatedCert
              };
              return newCerts;
            } else if (prevCerts.length < MAX_CERTIFICATES) {
              // This is a new certificate, fetch more details
              const fetchFullDetails = async () => {
                const fullCert = await processCertificatesBatch(contract, [Number(tokenId)]);
                if (fullCert && fullCert.length > 0) {
                  setCertificates(prev => [...prev, fullCert[0]]);
                }
              };
              fetchFullDetails();
              return prevCerts;
            }
            return prevCerts;
          });
          
          // Update last updated timestamp
          setLastUpdated(Date.now());
        }
      } else {
        // If we can't determine which certificate changed, refresh token count
        const totalSupply = await contract.totalSupply().catch(() => 0);
        if (totalSupply > totalCertificates) {
          // Only do a full refresh if we have new certificates
          console.log('New certificates detected, updating count and fetching new data');
          setTotalCertificates(Number(totalSupply));
          
          // Fetch just the new certificates rather than refreshing everything
          const newTokenCount = Number(totalSupply) - totalCertificates;
          if (newTokenCount > 0) {
            // Fetch the latest tokens that were added
            const latestTokenIds = [];
            for (let i = totalCertificates; i < totalSupply; i++) {
              try {
                const tokenId = await contract.tokenByIndex(i);
                latestTokenIds.push(Number(tokenId));
              } catch (error) {
                continue;
              }
            }
            
            // Process the new tokens and add to our list
            if (latestTokenIds.length > 0) {
              const newCerts = await processCertificatesBatch(contract, latestTokenIds);
              const allCerts = deduplicateCertificates([...certificates, ...newCerts]);
              setCertificates(allCerts);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling certificate event:', error);
    }
  }, [contract, totalCertificates, processCertificatesBatch]);

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
                fetchAllCertificates(contract, true);
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

  // NEW: Handler for CertificateStatusChanged events
  const handleCertificateStatusEvent = useCallback(async (event) => {
    if (!contract) return;
    
    try {
      // Extract data from the event
      const tokenId = event?.args?.tokenId;
      const isVerified = event?.args?.isVerified;
      const isRevoked = event?.args?.isRevoked;
      const updatedBy = event?.args?.updatedBy;
      const timestamp = event?.args?.timestamp;
      
      console.log(`Certificate status changed for token ${tokenId}:`, {
        isVerified,
        isRevoked,
        updatedBy,
        timestamp: new Date(Number(timestamp) * 1000)
      });
      
      if (tokenId) {
        // Find and update the specific certificate in our list
        setCertificates(prevCerts => {
          const index = prevCerts.findIndex(c => c.id === tokenId.toString());
          
          if (index >= 0) {
            // Update existing certificate with new status
            const newCerts = [...prevCerts];
            newCerts[index] = {
              ...newCerts[index],
              isVerified,
              isRevoked
            };
            return newCerts;
          }
          return prevCerts;
        });
        
        // Also update visible certificates to reflect changes
        updateVisibleCertificates(certificates);
        
        // Update last updated timestamp
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error handling certificate status event:', error);
    }
  }, [contract, certificates, updateVisibleCertificates]);

  // Add infinite scroll support for large certificate lists
  const loadMoreCertificates = useCallback(() => {
    if (!loading && !loadingMore && hasMore && contract) {
      fetchAllCertificates(contract);
    }
  }, [loading, loadingMore, hasMore, contract, fetchAllCertificates]);

  // Disabled scroll handler (no-op)
  const handleScroll = useCallback(() => {
    // Automatic loading on scroll disabled
    return;
  }, []);

  // NEW: Function to fetch recent certificates
  const fetchRecentCertificates = useCallback(async (limit = 10) => {
    try {
      if (!contract) return [];
      
      setLoading(true);
      setError('');
      
      // Call the contract method to get recent certificates
      const certificateIds = await contract.getRecentCertificates(limit)
        .catch(error => {
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.error('Index out of bounds when fetching recent certificates:', error);
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
      updateVisibleCertificates(processedCerts);
      setHasMore(false); // No pagination for recent certificates
      setLastUpdated(Date.now());
      
      return processedCerts;
    } catch (error) {
      console.error('Error fetching recent certificates:', error);
      setError('Failed to fetch recent certificates: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, updateVisibleCertificates]);

  // Function to load metadata on demand for certificates that need it
  const loadMetadataForCertificate = useCallback(async (certificate) => {
    try {
      if (!certificate || !contract) return certificate;
      
      // If metadata is already fully loaded, return as is
      if (certificate.metadataLoaded) return certificate;
      
      // If no metadata CID available, can't load metadata
      if (!certificate.metadataCID) return certificate;
      
      console.log(`Loading full metadata for certificate ${certificate.id}`);
      
      // Clone the certificate to avoid mutating the original
      const updatedCert = { ...certificate };
      
      // Try to load metadata from IPFS
      const metadata = await fetchMetadataFromIPFS(certificate.metadataCID);
      
      if (metadata) {
        updatedCert.metadata = metadata;
        updatedCert.metadataLoaded = true;
        
        // Update name from metadata if available
        if (metadata.name) {
          updatedCert.courseName = metadata.name;
        }
        
        // Update image if available
        if (metadata.image) {
          const imageCID = metadata.image.startsWith('ipfs://') ? metadata.image.slice(7) : metadata.image;
          updatedCert.imageCID = imageCID;
          updatedCert.imageUrl = getImageUrlFromMetadata(metadata, imageCID);
        }
        
        // Cache the updated metadata
        setCachedData(`${METADATA_CACHE_KEY}_${certificate.metadataCID}`, metadata);
      }
      
      // Load additional certificate details using batch details function
      try {
        if (certificate.id) {
          const additionalDetails = await fetchCertificatesBatchDetails([certificate.id]);
          if (additionalDetails && additionalDetails[certificate.id]) {
            const details = additionalDetails[certificate.id];
            // Update with additional details
            updatedCert.revocationReason = details.revocationReason || updatedCert.revocationReason;
            updatedCert.version = details.version || updatedCert.version;
            updatedCert.lastUpdateDate = details.lastUpdateDate || updatedCert.lastUpdateDate;
            updatedCert.updateReason = details.updateReason || updatedCert.updateReason;
            
            console.log(`Loaded additional details for certificate ${certificate.id}:`, details);
          }
        }
      } catch (error) {
        console.error(`Error loading additional details for certificate ${certificate.id}:`, error);
      }
      
      return updatedCert;
    } catch (error) {
      console.error(`Error loading metadata for certificate ${certificate?.id}:`, error);
      return certificate;
    }
  }, [contract]);

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

  // Optimized verify function with enhanced error handling
  const handleVerifyCertificate = useCallback(async (certificate) => {
    try {
      // Set loading only for this specific certificate
      setVerifyLoading(prev => ({ ...prev, [certificate.id]: true }));
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.verifyCertificate(certificate.tokenId);
      await tx.wait();

      // Update cache and state
      const updatedCert = { ...certificate, isVerified: true };
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
      
      setCertificates(prevCerts => 
        prevCerts.map(cert => cert.id === certificate.id ? updatedCert : cert)
      );

      if (selectedCertificate?.id === certificate.id) {
        setSelectedCertificate(updatedCert);
      }

      alert(`Certificate ${certificate.id} verified successfully`);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      
      // Enhanced error handling for specific error types
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        alert('You do not have permission to verify certificates');
      } else if (error.message.includes('ERC721NonexistentToken')) {
        alert('This certificate no longer exists');
      } else if (error.message.includes('AccessControlBadConfirmation')) {
        alert('Role verification failed');
      } else if (error.message.includes('OwnableUnauthorizedAccount')) {
        alert('Admin access required for this operation');
      } else {
        alert(`Failed to verify certificate: ${error.message}`);
      }
    } finally {
      // Clear loading only for this specific certificate
      setVerifyLoading(prev => ({ ...prev, [certificate.id]: false }));
    }
  }, [contract, selectedCertificate]);

  // Optimized revoke function with enhanced error handling
  const handleRevokeCertificate = useCallback(async (certificate, reason) => {
    try {
      // Set loading only for this specific certificate
      setRevokeLoading(prev => ({ ...prev, [certificate.id]: true }));
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.revokeCertificate(certificate.tokenId, reason);
      await tx.wait();

      // Update cache and state
      const updatedCert = { ...certificate, isRevoked: true, revocationReason: reason };
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
      
      setCertificates(prevCerts => 
        prevCerts.map(cert => cert.id === certificate.id ? updatedCert : cert)
      );

      if (selectedCertificate?.id === certificate.id) {
        setSelectedCertificate(updatedCert);
      }

      setShowRevokeModal(false);
      setRevocationReason('');
      alert(`Certificate ${certificate.id} revoked successfully`);
    } catch (error) {
      console.error('Error revoking certificate:', error);
      
      // Enhanced error handling for specific error types
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        alert('You do not have permission to revoke certificates');
      } else if (error.message.includes('ERC721NonexistentToken')) {
        alert('This certificate no longer exists');
      } else if (error.message.includes('AccessControlBadConfirmation')) {
        alert('Role verification failed');
      } else if (error.message.includes('OwnableUnauthorizedAccount')) {
        alert('Admin access required for this operation');
      } else {
        alert(`Failed to revoke certificate: ${error.message}`);
      }
    } finally {
      // Clear loading only for this specific certificate
      setRevokeLoading(prev => ({ ...prev, [certificate.id]: false }));
    }
  }, [contract, selectedCertificate]);

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
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
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
      // Check cache first
      const cachedCert = getCachedData(`${CERTIFICATES_CACHE_KEY}_${tokenId}`);
      if (cachedCert) {
        console.log(`Using cached certificate data for token ${tokenId}`);
        return cachedCert;
      }

      const cert = await contractInstance.getCertificate(tokenId);
      if (!cert || cert.length === 0) return null;

      let tokenURI = await contractInstance.tokenURI(tokenId);
      if (!tokenURI) {
        const certData = await contractInstance.academicCertificates(tokenId);
        tokenURI = certData?.certificateHash || '';
      }

      let metadata = null;
      let imageCID = null;
      let imageUrl = null;

      if (tokenURI) {
        const metadataCID = tokenURI.startsWith('ipfs://') ? tokenURI.slice(7) : tokenURI;
        metadata = await fetchMetadataFromIPFS(metadataCID);
        
        if (metadata?.image) {
          imageCID = metadata.image.startsWith('ipfs://') ? metadata.image.slice(7) : metadata.image;
          imageUrl = getImageUrlFromMetadata(metadata, imageCID);
        }
      }

      // Generate a guaranteed unique ID that matches the format in CertificateForm.jsx
      const generateFallbackUniqueId = (cert, tokenId) => {
        try {
          const courseId = cert[2]?.toString() || '0000';
          const studentAddress = cert[0] || '0x0000000000000000000000000000000000000000';
          
          const timestamp = Date.now();
          const randomPart = Math.random().toString(36).substring(2, 8);
          const courseIdShort = courseId.substring(0, Math.min(courseId.length, 4));
          const studentShort = studentAddress.substring(2, 6);
          
          return `${courseIdShort}-${studentShort}-${timestamp.toString(36)}-${randomPart}`;
        } catch (error) {
          return `CERT-${tokenId}-${Date.now().toString(36)}`;
        }
      };

      const certificateData = {
        id: tokenId.toString(),
        tokenId,
        tokenURI,
        metadataCID: tokenURI ? (tokenURI.startsWith('ipfs://') ? tokenURI.slice(7) : tokenURI) : null,
        imageCID,
        imageUrl,
        metadata,
        // Enhanced fallback mechanism that matches the CertificateForm format
        uniqueId: metadata?.uniqueId || 
                 metadata?.uniqueCertificateId || 
                 (metadata?.attributes?.find(attr => attr?.trait_type === 'Certificate ID' || attr?.trait_type === 'Unique ID')?.value) ||
                 generateFallbackUniqueId(cert, tokenId),
                 
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

      // Cache the certificate data
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${tokenId}`, certificateData);
      return certificateData;
    } catch (error) {
      console.error(`Error fetching certificate ${tokenId}:`, error);
      return null;
    }
  };

  // Determine which certificates to display based on admin status
  // Non-admins see their own certificates, admins see all certificates
  // This replaces the previous conditional based on viewAllCertificates toggle
  const certificatesToDisplay = certificates;

  const formatGrade = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  // Update getStatusColor to handle undefined certificates
  const getStatusColor = useCallback((certificate) => {
    if (!certificate) return 'bg-gray-500 text-white';
    if (certificate.isRevoked) return 'bg-red-500 text-white';
    if (certificate.isVerified) return 'bg-green-500 text-white';
    return 'bg-yellow-500 text-white';
  }, []);

  // Update getStatusText to handle undefined certificates
  const getStatusText = useCallback((certificate) => {
    if (!certificate) return 'Unknown';
    if (certificate.isRevoked) return 'Revoked';
    if (certificate.isVerified) return 'Verified';
    return 'Pending';
  }, []);

  // Show certificate metadata in modal
  const handleViewMetadata = useCallback(async (certificate) => {
    try {
      setImageLoading(true);
      setError('');
      
      // Load full certificate data including additional details
      const certWithMetadata = await loadMetadataForCertificate(certificate);
      
      // Log the complete certificate data to check if additional details are present
      console.log('Certificate with metadata and details:', certWithMetadata);
      
      setSelectedCertificate(certWithMetadata);
      setShowMetadata(true);
      setShowImage(false);
    } catch (error) {
      console.error('Error viewing metadata:', error);
      setError('Failed to load certificate details: ' + error.message);
    } finally {
      setImageLoading(false);
    }
  }, [loadMetadataForCertificate]);

  const handleViewImage = async (certificate) => {
    setImageLoading(true);
    // Lazily load metadata and image if it hasn't been loaded yet
    const certWithMetadata = await loadMetadataForCertificate(certificate);
    setSelectedCertificate(certWithMetadata);
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
      updateVisibleCertificates(updatedCertificates);
      setSelectedCertificates([]);
      setLastUpdated(Date.now());
      
    } catch (error) {
      console.error('Error during bulk verification:', error);
      setError(`Bulk verification failed: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  }, [contract, selectedCertificates, certificates, updateVisibleCertificates]);

  // Create a function to handle resetting the search and loading all certificates
  const handleClearSearchAndShowAll = useCallback(async () => {
    // Clear all search filters
    setError('');
    setStudentAddressFilter('');
    setInstitutionFilter('');
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate(null);
    setEndDate(null);
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
      
      // Get current account
      const currentAccount = await getCurrentAccount();
      
      // Check admin status
      const adminStatus = await checkAdminStatus(contract, currentAccount);
      
      console.log("Clearing search and reloading all certificates, admin status:", adminStatus);
      
      // For admin users, directly fetch latest certificates for immediate display
      if (adminStatus) {
        // Get the latest certificates (most recent ones)
        const batchSize = Math.min(20, Number(totalSupply));
        const certificateIds = [];
        
        console.log(`Admin user: Directly fetching ${batchSize} most recent certificates`);
        
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
          const processedCerts = await processCertificatesBatch(contract, certificateIds);
          
          // Update state
          const uniqueCerts = deduplicateCertificates(processedCerts);
          setCertificates(uniqueCerts);
          updateVisibleCertificates(uniqueCerts);
          setHasMore(true);
          setLastUpdated(Date.now());
          console.log(`Successfully loaded ${processedCerts.length} certificates`);
        } else {
          throw new Error("Failed to retrieve certificate data");
        }
      } else {
        // Regular users see only their certificates
        await fetchCertificates(contract, currentAccount);
      }
    } catch (error) {
      console.error("Error reloading certificates:", error);
      setError("Failed to load certificates: " + error.message);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [contract, getCurrentAccount, checkAdminStatus, processCertificatesBatch, updateVisibleCertificates, fetchCertificates]);

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

        {/* Status cards - show for all users */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Total Certificates</p>
              <p className="text-2xl font-bold text-violet-400">{totalCertificates}</p>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Loaded</p>
              <p className="text-2xl font-bold text-violet-400">{certificates.length}</p>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">Visible</p>
              <p className="text-2xl font-bold text-violet-400">{visibleCertificates.length}</p>
            </div>
            <div className="text-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-600/50 transition-colors"
                onClick={() => fetchRecentCertificates(10)}>
              <p className="text-sm text-gray-400">View Recent</p>
              <p className="text-lg font-bold text-green-400">Show Latest 10</p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-white">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">Error</h3>
                <p>{error}</p>
                {error.includes('address') && (
                  <div className="mt-2 text-sm bg-gray-800/50 p-2 rounded border border-gray-700">
                    <p className="font-medium text-violet-400 mb-1">Valid Address Format:</p>
                    <p className="font-mono">0x + 40 hexadecimal characters (0-9, a-f)</p>
                    <p className="mt-1">Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin search bar - only show for admins */}
        {isAdmin && (
          <div className="mb-6 p-6 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Certificate ID / Course Name</label>
                <input
                  type="text"
                  placeholder="Enter certificate ID or course name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Student Address</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0x... (Student Ethereum Address)"
                    className={`w-full px-4 py-2 bg-gray-800 border ${studentAddressFilter && !studentAddressFilter.match(/^0x[0-9a-fA-F]{40}$/) ? 'border-red-500' : 'border-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    value={studentAddressFilter}
                    onChange={(e) => setStudentAddressFilter(e.target.value)}
                  />
                  {studentAddressFilter && !studentAddressFilter.match(/^0x[0-9a-fA-F]{40}$/) && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                      Invalid format
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Institution Address</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0x... (Institution Ethereum Address)"
                    className={`w-full px-4 py-2 bg-gray-800 border ${institutionFilter && !institutionFilter.match(/^0x[0-9a-fA-F]{40}$/) ? 'border-red-500' : 'border-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    value={institutionFilter}
                    onChange={(e) => setInstitutionFilter(e.target.value)}
                  />
                  {institutionFilter && !institutionFilter.match(/^0x[0-9a-fA-F]{40}$/) && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                      Invalid format
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
            
            {/* Date range filter */}
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <svg className={`w-4 h-4 mr-2 transform ${showDateFilter ? 'rotate-180' : ''} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                {showDateFilter ? 'Hide Date Filter' : 'Show Date Filter'}
              </button>
            </div>

            {showDateFilter && (
              <div className="p-4 bg-gray-700/40 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm">Start Date</label>
                    <input
                      type="date"
                      value={startDate ? new Date(startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).getTime() / 1000 : null)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm">End Date</label>
                    <input
                      type="date"
                      value={endDate ? new Date(endDate * 1000).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).getTime() / 1000 : null)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    Clear Dates
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  // Validate addresses before searching
                  let hasError = false;
                  
                  // Clear any previous errors and reset no results state
                  setError('');
                  setNoResultsAddress({ type: null, address: null });
                  
                  // Basic format validation for student address
                  if (studentAddressFilter) {
                    const normalizedStudent = normalizeAddress(studentAddressFilter);
                    if (!normalizedStudent) {
                      setError('Invalid student address format. Please enter a valid Ethereum address.');
                      hasError = true;
                    }
                  }
                  
                  // Basic format validation for institution address
                  if (!hasError && institutionFilter) {
                    const normalizedInstitution = normalizeAddress(institutionFilter);
                    if (!normalizedInstitution) {
                      setError('Invalid institution address format. Please enter a valid Ethereum address.');
                      hasError = true;
                    }
                  }
                  
                  // Don't proceed with search if there are validation errors
                  if (hasError) {
                    return;
                  }
                  
                  setSearchLoading(true);
                  
                  // Use optimized contract filtering functions based on selected filters
                  if (startDate && endDate && showDateFilter) {
                    // If date range is set, use that for filtering
                    fetchCertificatesByDateRange(startDate, endDate, 0, maxResults);
                  } else if (statusFilter !== 'all' && !searchTerm && !studentAddressFilter && !institutionFilter) {
                    // If only status filter is set, use dedicated functions
                    if (statusFilter === 'verified') {
                      fetchVerifiedCertificates(0, maxResults);
                    } else if (statusFilter === 'pending') {
                      fetchPendingCertificates(0, maxResults);
                    } else if (statusFilter === 'revoked') {
                      fetchRevokedCertificates(0, maxResults);
                    }
                  } else if (studentAddressFilter && !searchTerm && !institutionFilter) {
                    // If only student filter is set
                    fetchCertificatesByStudent(studentAddressFilter, 0, maxResults);
                  } else if (institutionFilter && !searchTerm && !studentAddressFilter) {
                    // If only institution filter is set
                    fetchCertificatesByInstitution(institutionFilter, 0, maxResults);
                  } else if (searchTerm && /^\d+$/.test(searchTerm.trim()) && !studentAddressFilter && !institutionFilter) {
                    // If searching for a specific course ID
                    fetchCertificatesByCourse(searchTerm.trim(), 0, maxResults);
                  } else {
                    // For complex combinations, fall back to the regular search
                    fetchAllCertificates(contract, true);
                  }
                }}
                disabled={searchLoading || loading}
                className="flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 shadow-lg"
              >
                {searchLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-3 h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Search Certificates
                  </>
                )}
              </button>
              
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
        )}

        {/* Regular user search bar - only show for non-admins */}
        {!isAdmin && (
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by course name, ID, student, or institution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
        )}

        <div className="bg-gray-800/50 rounded-lg overflow-hidden">
          {loading && certificates.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-violet-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
              </div>
              <span className="text-xl text-gray-300">Loading certificates...</span>
              <p className="text-gray-500 mt-2">Please wait while we retrieve your certificates</p>
            </div>
          ) : visibleCertificates.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                {error ? (
                  <>
                    <div className="mx-auto w-14 h-14 flex items-center justify-center bg-red-500/20 rounded-full mb-4">
                      <FaExclamationTriangle className="text-3xl text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-red-400">Error</h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                  </>
                ) : noResultsAddress.type ? (
                  <>
                    <div className="mx-auto w-20 h-20 flex items-center justify-center bg-blue-500/10 rounded-full mb-6">
                      <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-white">No Certificates Found</h3>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-5">
                      <p className="text-lg text-gray-300 mb-2">
                        {noResultsAddress.type === 'student' 
                          ? "This student doesn't have any certificates issued yet." 
                          : "This institution hasn't issued any certificates yet."}
                      </p>
                      <div className="flex items-center justify-center p-2 bg-gray-900/50 rounded mt-3 overflow-hidden">
                        <span className="text-gray-400 mr-2">Address:</span>
                        <code className="text-violet-400 text-sm font-mono truncate">{noResultsAddress.address}</code>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                      The address is valid but no {noResultsAddress.type === 'student' ? 'certificates have been issued to this student' : 'certificates have been issued by this institution'}.
                    </p>
                  </>
                ) : studentAddressFilter || institutionFilter ? (
                  <>
                    <div className="mx-auto w-14 h-14 flex items-center justify-center bg-blue-500/20 rounded-full mb-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Certificates Found</h3>
                    <p className="text-gray-400 mb-2">
                      No certificates match your search criteria.
                    </p>
                  </>
                ) : (
                  <>
                    <FaFileAlt className="mx-auto text-4xl text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Certificates Found</h3>
                    <p className="text-gray-400 mb-2">
                      {certificates.length === 0 ? "No certificates available." : "No certificates match your search criteria."}
                    </p>
                  </>
                )}
                
                <button 
                  onClick={handleClearSearchAndShowAll}
                  className="mt-6 px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Clear Search & Show All Certificates
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className="overflow-auto"
              style={{ maxHeight: "70vh" }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {visibleCertificates.map((certificate) => (
                    <div
                      key={certificate.id}
                      className={`bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden hover:border-violet-500 transition-all duration-300 shadow-lg ${selectedCertificates.some(c => c.id === certificate.id) ? 'ring-2 ring-violet-500' : ''}`}
                    >
                      {isAdmin && (
                        <div className="absolute top-2 left-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCertificates.some(c => c.id === certificate.id)}
                            onChange={() => toggleCertificateSelection(certificate)}
                            className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
                          />
                        </div>
                      )}
                      <div className={`h-2 ${getStatusColor(certificate)}`}></div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-violet-400 truncate">
                            {certificate.courseName || `Certificate ${certificate.id}`}
                          </h3>
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
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 w-32">Completion:</span>
                            <span>{certificate.completionDate}</span>
                          </div>
                          {/* Add UTC date display with proper formatting */}
                          <div className="flex justify-between items-center mb-2 text-xs">
                            <span className="text-gray-500 w-32">UTC Time:</span>
                            <span className="text-gray-500">
                              {certificate.completionTimestamp 
                                ? new Date(certificate.completionTimestamp * 1000).toUTCString().split(' ').slice(0, 4).join(' ')
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-400 w-32">Grade:</span>
                            <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {formatGrade(certificate.grade)} ({certificate.grade}%)
                            </span>
                          </div>
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
                              onClick={() => handleVerifyCertificate(certificate)}
                              disabled={verifyLoading[certificate.id]}
                              className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                            >
                              {verifyLoading[certificate.id] ? (
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
                              disabled={revokeLoading[certificate.id]}
                              className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                            >
                              {revokeLoading[certificate.id] ? (
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
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      {isAdmin && (
                        <th className="px-4 py-3 text-left">
                          <input 
                            type="checkbox" 
                            checked={visibleCertificates.length > 0 && selectedCertificates.length === visibleCertificates.length}
                            onChange={() => {
                              if (selectedCertificates.length === visibleCertificates.length) {
                                clearSelection();
                              } else {
                                selectAllVisible();
                              }
                            }}
                            className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Institution</th>
                      <th className="px-4 py-3 text-left">Completion Date</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">UTC Time</th>
                      <th className="px-4 py-3 text-left">Grade</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCertificates.map((certificate) => (
                      <tr key={certificate.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedCertificates.some(c => c.id === certificate.id)}
                              onChange={() => toggleCertificateSelection(certificate)}
                              className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">{certificate.id}</td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          {certificate.courseName || `Certificate ${certificate.id}`}
                        </td>
                        <td className="px-4 py-3">{certificate.student.substring(0, 6)}...{certificate.student.substring(certificate.student.length - 4)}</td>
                        <td className="px-4 py-3">{certificate.institution.substring(0, 6)}...{certificate.institution.substring(certificate.institution.length - 4)}</td>
                        <td className="px-4 py-3">{certificate.completionDate}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-xs text-gray-500">
                            UTC: {certificate.completionDateUTC?.split(' ').slice(0, 4).join(' ')}
                          </div>
                        </td>
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
                                onClick={() => handleVerifyCertificate(certificate)}
                                disabled={verifyLoading[certificate.id]}
                                className="p-1 text-green-400 hover:text-green-300"
                                title="Verify Certificate"
                              >
                                {verifyLoading[certificate.id] ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                              </button>
                            )}

                            {isAdmin && !certificate.isRevoked && (
                              <button
                                onClick={() => openRevokeModal(certificate)}
                                disabled={revokeLoading[certificate.id]}
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Revoke Certificate"
                              >
                                {revokeLoading[certificate.id] ? <FaSpinner className="animate-spin" /> : <FaBan />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex justify-center items-center py-4">
                  <FaSpinner className="animate-spin text-xl text-violet-500 mr-2" />
                  <span>Loading more certificates...</span>
                </div>
              )}
              
              {/* Load more button */}
              {hasMore && !loadingMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={loadMoreCertificates}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <FaSpinner className="animate-spin inline mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More Certificates"
                    )}
                  </button>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMore && certificates.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  End of certificates list
                </div>
              )}
            </div>
          )}
        </div>
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
                  {selectedCertificate.version && parseInt(selectedCertificate.version) > 1 && (
                    <>
                      <p><span className="text-gray-400">Version:</span> {selectedCertificate.version}</p>
                      {selectedCertificate.lastUpdateDateFormatted && (
                        <p><span className="text-gray-400">Last Update:</span> {selectedCertificate.lastUpdateDateFormatted}</p>
                      )}
                      {selectedCertificate.updateReason && selectedCertificate.updateReason !== "Initial issuance" && (
                        <p><span className="text-gray-400">Update Reason:</span> {selectedCertificate.updateReason}</p>
                      )}
                    </>
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
                    onClick={() => handleVerifyCertificate(selectedCertificate)}
                    disabled={verifyLoading[selectedCertificate.id]}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    {verifyLoading[selectedCertificate.id] ? <FaSpinner className="animate-spin mr-2" /> : <FaCheck className="mr-2" />}
                    Verify Certificate
                  </button>
                )}

                {isAdmin && !selectedCertificate.isRevoked && (
                  <button
                    onClick={() => openRevokeModal(selectedCertificate)}
                    disabled={revokeLoading[selectedCertificate.id]}
                    className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    {revokeLoading[selectedCertificate.id] ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
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
                  disabled={revokeLoading[selectedCertificate.id]}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {revokeLoading[selectedCertificate.id] ? <FaSpinner className="animate-spin mr-2" /> : <FaBan className="mr-2" />}
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add batch action controls */}
      {isAdmin && selectedCertificates.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-700 p-3 flex justify-between items-center z-10">
          <div className="flex items-center">
            <span className="mr-2">{selectedCertificates.length} certificate{selectedCertificates.length !== 1 ? 's' : ''} selected</span>
            <button 
              onClick={clearSelection}
              className="text-sm text-gray-400 hover:text-white mx-2"
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={bulkVerifyCertificates}
              disabled={bulkActionLoading || !selectedCertificates.some(c => !c.isVerified && !c.isRevoked)}
              className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {bulkActionLoading ? <FaSpinner className="animate-spin mr-1" /> : <FaCheck className="mr-1" />}
              Verify Selected
            </button>
            {/* Add more batch actions as needed */}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificatesList;
