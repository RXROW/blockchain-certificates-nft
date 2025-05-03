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
  statusFilter
) => {
  
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
      updateVisibleCertificates(processedCerts, searchTerm, statusFilter, setVisibleCertificates);
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
  }, [contract, processCertificatesBatch, searchTerm, statusFilter, setLoading, setError, setCertificates, updateVisibleCertificates, setVisibleCertificates, setHasMore, setLastUpdated]);

  return { fetchRecentCertificates };
}; 