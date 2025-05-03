import { useCallback } from 'react';
import { processCertificatesBatch } from '../components/sperates/cert_utilits';
import { deduplicateCertificates } from '../components/sperates/f1';

/**
 * Custom hook to handle certificate blockchain events
 * 
 * @param {Object} contract - The contract instance
 * @param {Array} certificates - Current certificates array
 * @param {Number} totalCertificates - Total count of certificates
 * @param {Function} setCertificates - State setter for certificates
 * @param {Function} setTotalCertificates - State setter for total certificates
 * @param {Function} setLastUpdated - State setter for last updated timestamp
 * @param {Function} updateVisibleCertificates - Function to update visible certificates
 * @param {Function} setVisibleCertificates - State setter for visible certificates
 * @param {String} searchTerm - Current search term
 * @param {String} statusFilter - Current status filter
 * @param {Number} MAX_CERTIFICATES - Maximum number of certificates to store
 * @returns {Object} - The event handler functions
 */
export const useCertificateEvents = (
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
  MAX_CERTIFICATES = 100
) => {
  
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
  }, [contract, totalCertificates, certificates, setCertificates, setTotalCertificates, setLastUpdated, MAX_CERTIFICATES]);

  // Handler for CertificateStatusChanged events
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
        updateVisibleCertificates(certificates, searchTerm, statusFilter, setVisibleCertificates);
        
        // Update last updated timestamp
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error('Error handling certificate status event:', error);
    }
  }, [contract, certificates, searchTerm, statusFilter, updateVisibleCertificates, setVisibleCertificates, setLastUpdated]);

  return { handleCertificateEvent, handleCertificateStatusEvent };
}; 