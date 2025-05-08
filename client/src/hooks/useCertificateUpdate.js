import { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { fetchCertificateByTokenId } from '../components/sperates/filters';
import { processCertificatesBatch } from '../components/sperates/cert_utilits';
import { normalizeAddress } from '../components/sperates/f1';

/**
 * Hook for certificate update operations
 * @param {Object} contract - The smart contract instance
 */
export const useCertificateUpdate = (contract) => {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  /**
   * Search for a certificate by different criteria
   * @param {string} searchType - 'id', 'name', 'student', or 'institution'
   * @param {string} searchQuery - The search value
   */
  const searchCertificate = useCallback(async (searchType, searchQuery) => {
    if (!contract || !searchType || !searchQuery) {
      setError('Missing required information for search');
      setSearchResults([]);
      setSelectedCertificate(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setIsSuccess(false);
    setTxHash('');

    try {
      let results = [];

      // Search by certificate ID
      if (searchType === 'id' || searchType === 'idcertificate') {
        const tokenId = parseInt(searchQuery.trim());
        if (isNaN(tokenId)) {
          throw new Error('Invalid certificate ID. Please enter a valid number.');
        }

        const exists = await contract.tokenExists(tokenId).catch(() => false);
        if (!exists) {
          throw new Error(`Certificate with ID ${tokenId} does not exist.`);
        }

        results = await fetchCertificateByTokenId(contract, tokenId);
      }
      // Search by student address
      else if (searchType === 'student') {
        const normalized = normalizeAddress(searchQuery.trim());
        if (!normalized) {
          throw new Error('Invalid Ethereum address format.');
        }

        const studentTokens = await contract.getCertificatesByStudent(normalized, 0, 20);
        if (!studentTokens || studentTokens.length === 0) {
          throw new Error(`No certificates found for student address ${normalized}.`);
        }

        const tokenIds = studentTokens.map(id => Number(id));
        results = await processCertificatesBatch(contract, tokenIds);
      }
      // Search by institution address
      else if (searchType === 'institution') {
        const normalized = normalizeAddress(searchQuery.trim());
        if (!normalized) {
          throw new Error('Invalid Ethereum address format.');
        }

        const institutionTokens = await contract.getCertificatesByInstitution(normalized, 0, 20);
        if (!institutionTokens || institutionTokens.length === 0) {
          throw new Error(`No certificates found for institution address ${normalized}.`);
        }

        const tokenIds = institutionTokens.map(id => Number(id));
        results = await processCertificatesBatch(contract, tokenIds);
      }
      // Search by course name (more approximate)
      else if (searchType === 'name') {
        // This will need a more complex approach, using the certificate data
        // and matching against course names, since there's no direct contract method
        // We could iterate through recent certificates and check their course names
        const totalSupply = await contract.totalSupply().catch(() => 0);
        if (totalSupply === 0) {
          throw new Error('No certificates found in the system.');
        }

        // Get the most recent 50 certificates as a sampling
        const sampleSize = Math.min(Number(totalSupply), 50);
        const tokenIds = [];
        
        for (let i = 0; i < sampleSize; i++) {
          try {
            const tokenId = await contract.tokenByIndex(Number(totalSupply) - 1 - i);
            tokenIds.push(Number(tokenId));
          } catch (err) {
            continue;
          }
        }

        if (tokenIds.length === 0) {
          throw new Error('Failed to retrieve certificate IDs.');
        }

        // Process these certificates and filter by course name
        const allCerts = await processCertificatesBatch(contract, tokenIds);
        results = allCerts.filter(cert => 
          cert.courseName && cert.courseName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (results.length === 0) {
          throw new Error(`No certificates found with course name containing "${searchQuery}".`);
        }
      }

      if (results.length === 0) {
        throw new Error('No certificates found matching your search criteria.');
      }

      setSearchResults(results);
      // If only one result, automatically select it
      if (results.length === 1) {
        setSelectedCertificate(results[0]);
      }
    } catch (error) {
      console.error('Error searching for certificate:', error);
      setError(error.message || 'Failed to search for certificate.');
      setSearchResults([]);
      setSelectedCertificate(null);
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  /**
   * Select a specific certificate from search results
   * @param {Object} certificate - The certificate to select
   */
  const selectCertificate = useCallback((certificate) => {
    setSelectedCertificate(certificate);
    setError('');
    setIsSuccess(false);
    setTxHash('');
  }, []);

  /**
   * Update a certificate's grade with a reason
   * @param {number} tokenId - The token ID of the certificate
   * @param {number} newGrade - The new grade value
   * @param {string} updateReason - The reason for the update
   */
  const updateCertificateGrade = useCallback(async (tokenId, newGrade, updateReason) => {
    if (!contract || !tokenId) {
      setError('Missing contract or certificate ID');
      return false;
    }

    if (newGrade === undefined || newGrade === '' || isNaN(parseInt(newGrade))) {
      setError('Please enter a valid new grade');
      return false;
    }

    if (!updateReason || updateReason.trim() === '') {
      setError('Please provide a reason for the update');
      return false;
    }

    setIsLoading(true);
    setError('');
    setIsSuccess(false);
    setTxHash('');

    try {
      // Convert parameters to correct format
      const certificateId = Number(tokenId);
      const grade = Number(newGrade);
      
      // Validate the grade range (assuming 0-100)
      if (grade < 0 || grade > 100) {
        throw new Error('Grade must be between 0 and 100');
      }

      // Connect with signer
      if (!window.ethereum) {
        throw new Error('MetaMask or similar wallet not detected');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const connectedContract = contract.connect(signer);

      console.log(`Updating certificate ${certificateId} with new grade ${grade} and reason: ${updateReason}`);
      
      // Call the update function
      const tx = await connectedContract.updateCertificate(certificateId, grade, updateReason);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Certificate updated successfully:', receipt);
      
      setTxHash(receipt.hash);
      setIsSuccess(true);
      
      // Refresh the certificate data
      const updatedCert = await fetchCertificateByTokenId(contract, certificateId);
      if (updatedCert && updatedCert.length > 0) {
        setSelectedCertificate(updatedCert[0]);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating certificate:', error);
      setError(error.message || 'Failed to update certificate');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Function to retrieve certificate details
  const fetchCertificateDetails = async (id) => {
    setIsLoading(true);
    setError('');
    try {
      const certData = await fetchCertificateByTokenId(contract, id);
      
      // Check if certData is an array (from the fetchCertificateByTokenId function)
      // and get the first item if it is
      const certificate = Array.isArray(certData) ? certData[0] : certData;
      
      if (!certificate) {
        throw new Error(`Certificate with ID ${id} not found`);
      }
      
      console.log("Raw certificate data:", certificate);
      
      // Try to fetch course name if it's undefined or has a placeholder value
      if (!certificate.courseName || certificate.courseName === `Certificate ${id}` || certificate.courseName === `Course ${certificate.courseId}`) {
        try {
          const courseNames = await contract.getCourseName(certificate.courseId);
          if (courseNames) {
            certificate.courseName = courseNames;
            console.log(`Got course name '${courseNames}' for course ID ${certificate.courseId}`);
          }
        } catch (err) {
          console.warn(`Could not fetch course name for ID ${certificate.courseId}:`, err);
        }
      }
      
      // Try to parse metadata if it exists
      if (certificate.metadataURI || certificate.tokenURI) {
        try {
          const metadataURI = certificate.metadataURI || certificate.tokenURI;
          
          // If URI is IPFS, try to fetch from gateway
          if (metadataURI && metadataURI.startsWith('ipfs://')) {
            const hash = metadataURI.replace('ipfs://', '');
            // Import IPFS_GATEWAYS
            const { IPFS_GATEWAYS } = await import('../components/sperates/f1.js');
            const gatewayUrl = `${IPFS_GATEWAYS[0]}${hash}`;
            
            console.log(`Fetching metadata from IPFS gateway: ${gatewayUrl}`);
            
            try {
              const response = await fetch(gatewayUrl);
              if (response.ok) {
                const metadata = await response.json();
                certificate.metadata = metadata;
                
                // If name is from metadata, use it for the certificate
                if (metadata.name) {
                  certificate.certificateName = metadata.name;
                }
                
                // If image is an IPFS URL, convert it for display
                if (metadata.image && metadata.image.startsWith('ipfs://')) {
                  const imageHash = metadata.image.replace('ipfs://', '');
                  const gateway = IPFS_GATEWAYS[0];
                  // Check if the gateway already includes the /ipfs/ path
                  metadata.imageUrl = gateway.includes('/ipfs/')
                    ? `${gateway}${imageHash}` 
                    : `${gateway}/ipfs/${imageHash}`;
                  console.log(`Image URL created: ${metadata.imageUrl}`);
                }
                
                console.log("Parsed metadata:", metadata);
              }
            } catch (err) {
              console.warn('Failed to fetch metadata from IPFS:', err);
            }
          }
        } catch (err) {
          console.warn('Failed to parse certificate metadata:', err);
        }
      }
      
      // Make sure there's at least a default certificate name
      if (!certificate.certificateName) {
        certificate.certificateName = certificate.courseName 
          ? `Certificate for ${certificate.courseName}`
          : `Certificate ${certificate.id}`;
      }
      
      setSelectedCertificate(certificate);
      return certificate;
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      setError(`Failed to fetch certificate: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchResults,
    selectedCertificate,
    isLoading,
    error,
    isSuccess,
    txHash,
    searchCertificate,
    selectCertificate,
    updateCertificateGrade,
    fetchCertificateDetails
  };
}; 