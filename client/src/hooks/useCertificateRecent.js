import { useCallback } from 'react';
import { processCertificatesBatch } from '../components/sperates/cert_utilits';

/**
 * Custom hook for fetching recent certificates
 * 
 * @param {Object} contract - The contract instance
 * @param {Function} setLoading - State setter for loading
 * @param {Function} setError - State setter for error
 * @param {Function} setCertificates - State setter for certificates
 * @param {Function} updateVisibleCertificates - Function to update visible certificates
 * @param {Function} setVisibleCertificates - State setter for visible certificates
 * @param {Function} setHasMore - State setter for hasMore flag
 * @param {Function} setLastUpdated - State setter for lastUpdated timestamp
 * @param {String} searchTerm - Current search term
 * @param {String} statusFilter - Current status filter
 * @param {Boolean} isInstitute - Whether the user is an institute
 * @param {String} instituteAddress - The address of the institute
 * @param {Boolean} isAdmin - Whether the user is an admin
 * @returns {Function} - The fetchRecentCertificates function
 */
export const useCertificateRecent = (
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
  isInstitute = false,
  instituteAddress = null,
  isAdmin = false
) => {
  
  const fetchRecentCertificates = useCallback(async (limit = 10) => {
    try {
      if (!contract) {
        setError("Contract not initialized. Please connect your wallet.");
        return [];
      }
      
      setLoading(true);
      setError('');
      
      let certificateIds = [];
      
      // Admin users should ALWAYS see all certificates, even if they're also institutes
      if (isAdmin) {
        console.log('Admin user fetching recent certificates');
        try {
          certificateIds = await contract.getRecentCertificates(limit);
          console.log(`Admin: Fetched ${certificateIds.length} recent certificates`);
        } catch (error) {
          console.error('Error fetching recent certificates for admin:', error);
          if (error.message.includes('ERC721OutOfBoundsIndex')) {
            console.log('Index out of bounds, likely no certificates yet');
            certificateIds = [];
          } else {
            throw new Error(`Failed to fetch recent certificates: ${error.message}`);
          }
        }
      }
      // For institute users (who aren't also admins), use a different approach
      else if (isInstitute && instituteAddress) {
        console.log(`Fetching recent certificates for institute: ${instituteAddress}`);
        try {
          // Try to use the specialized method for institute certificates
          if (typeof contract.getCertificatesByInstitution === 'function') {
            certificateIds = await contract.getCertificatesByInstitution(
              instituteAddress,
              0, // Start from the beginning
              limit // Only get the requested limit
            );
            console.log(`Institute: Fetched ${certificateIds.length} certificates`);
          } else {
            throw new Error('getCertificatesByInstitution method not available');
          }
        } catch (error) {
          console.error('Failed to fetch institute certificates directly:', error);
          
          // Fallback: Get recent certificates and filter them
          try {
            const allCertIds = await contract.getRecentCertificates(Math.min(100, limit * 5));
            console.log(`Fallback: Fetched ${allCertIds.length} certificates to filter for institute`);
            
            // If we got some certificates, process and filter them
            if (allCertIds && allCertIds.length > 0) {
              const allTokenIds = allCertIds.map(id => Number(id));
              const allCerts = await processCertificatesBatch(contract, allTokenIds);
              
              // Filter to only include certificates from this institute
              const instituteCerts = allCerts.filter(cert => 
                cert && cert.institution && 
                cert.institution.toLowerCase() === instituteAddress.toLowerCase()
              );
              
              console.log(`Filtered to ${instituteCerts.length} certificates from this institute`);
              
              // Take only up to the limit
              instituteCerts.splice(limit);
              
              // If we found matching certificates, update the UI
              if (instituteCerts.length > 0) {
                setCertificates(instituteCerts);
                updateVisibleCertificates(instituteCerts, searchTerm, statusFilter, setVisibleCertificates);
                setHasMore(false);
                setLastUpdated(Date.now());
                setLoading(false);
                return instituteCerts;
              }
            }
            
            // If no institute certs found, continue with empty array
            certificateIds = [];
          } catch (fallbackError) {
            console.error('Fallback approach also failed:', fallbackError);
            throw new Error('All attempts to fetch institute certificates failed');
          }
        }
      } else {
        // For regular users, fetch certificates owned by the current account
        console.log('Regular user: Fetching certificates owned by the user');
        try {
          // Get user's address
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (!accounts || accounts.length === 0) {
            throw new Error('No connected wallet found');
          }
          
          const userAddress = accounts[0];
          console.log(`User address: ${userAddress}`);
          
          // Get the total number of certificates owned by the user
          const balance = await contract.balanceOf(userAddress);
          console.log(`User has ${balance.toString()} certificates`);
          
          if (balance.toString() === '0') {
            // User has no certificates
            console.log('User has no certificates');
            setCertificates([]);
            updateVisibleCertificates([], searchTerm, statusFilter, setVisibleCertificates);
            setHasMore(false);
            setLastUpdated(Date.now());
            setLoading(false);
            return [];
          }
          
          // Limit the number of certificates to fetch
          const fetchLimit = Math.min(Number(balance), limit);
          
          // Get the user's certificates, starting from the most recent
          for (let i = 0; i < fetchLimit; i++) {
            try {
              // Get from the end to prioritize most recent
              const index = Math.max(0, Number(balance) - 1 - i);
              const tokenId = await contract.tokenOfOwnerByIndex(userAddress, index);
              certificateIds.push(Number(tokenId));
            } catch (certError) {
              console.error(`Error fetching certificate ${i}:`, certError);
              // Continue with next certificate
            }
          }
          
          console.log(`Fetched ${certificateIds.length} certificates for user`);
        } catch (error) {
          console.error('Error fetching user certificates:', error);
          throw new Error(`Failed to fetch your certificates: ${error.message}`);
        }
      }
      
      // If we have no certificates to process, return empty array
      if (!certificateIds || certificateIds.length === 0) {
        console.log('No certificates to process');
        setLoading(false);
        setCertificates([]);
        updateVisibleCertificates([], searchTerm, statusFilter, setVisibleCertificates);
        setLastUpdated(Date.now());
        return [];
      }
      
      // Process the returned certificate IDs
      const tokenIds = certificateIds.map(id => Number(id));
      console.log(`Processing ${tokenIds.length} certificates`);
      const processedCerts = await processCertificatesBatch(contract, tokenIds);
      
      // If this is an institute, filter the certificates to only show this institute's
      let finalCerts = processedCerts;
      if (isInstitute && instituteAddress) {
        finalCerts = processedCerts.filter(cert => 
          cert && cert.institution && 
          cert.institution.toLowerCase() === instituteAddress.toLowerCase()
        );
        console.log(`Filtered to ${finalCerts.length} certificates from this institute`);
      }
      
      // Update state
      setCertificates(finalCerts);
      updateVisibleCertificates(finalCerts, searchTerm, statusFilter, setVisibleCertificates);
      setHasMore(false); // No pagination for recent certificates
      setLastUpdated(Date.now());
      
      return finalCerts;
    } catch (error) {
      console.error('Error fetching recent certificates:', error);
      setError('Failed to fetch recent certificates: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, updateVisibleCertificates, setVisibleCertificates, setHasMore, setLastUpdated, isInstitute, instituteAddress, isAdmin]);

  return { fetchRecentCertificates };
}; 