import { useCallback } from 'react';
import { fetchMetadataFromIPFS, getImageUrlFromMetadata, setCachedData, getCachedData, METADATA_CACHE_KEY, IMAGE_CACHE_KEY } from '../components/sperates/f1.js';
import { fetchCertificatesBatchDetails } from '../components/sperates/filters.js';

/**
 * Custom hook for loading and enhancing certificate metadata
 * 
 * @param {Object} contract - The contract instance
 * @returns {Object} - The loadMetadataForCertificate function
 */
export const useCertificateMetadata = (contract) => {
  
  const loadMetadataForCertificate = useCallback(async (certificate) => {
    try {
      if (!certificate || !contract) return certificate;
      
      // Clone the certificate to avoid mutating the original
      const updatedCert = { ...certificate };
      
      // Check if we already have the image URL directly - fastest path
      if (updatedCert.imageUrl && updatedCert.metadataLoaded) {
        console.log(`Certificate ${certificate.id} already has image URL and metadata loaded`);
        return updatedCert;
      }
      
      // If no metadata CID available, can't load metadata
      if (!updatedCert.metadataCID) {
        console.log(`Certificate ${certificate.id} has no metadata CID`);
        return updatedCert;
      }
      
      // If we have an imageCID but no imageUrl, try to get it from cache
      if (updatedCert.imageCID && !updatedCert.imageUrl) {
        const cachedImageUrl = getCachedData(`${IMAGE_CACHE_KEY}_${updatedCert.imageCID}`);
        if (cachedImageUrl) {
          console.log(`Found cached image URL for certificate ${certificate.id}`);
          updatedCert.imageUrl = cachedImageUrl;
        }
      }
      
      // If metadata is already fully loaded, return as is
      if (updatedCert.metadataLoaded) {
        console.log(`Certificate ${certificate.id} metadata already loaded`);
        return updatedCert;
      }
      
      console.log(`Loading full metadata for certificate ${certificate.id}`);
      
      // Try to load metadata from IPFS
      const metadata = await fetchMetadataFromIPFS(updatedCert.metadataCID);
      
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
        setCachedData(`${METADATA_CACHE_KEY}_${updatedCert.metadataCID}`, metadata);
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
      console.error(`Error loading metadata for certificate:`, error);
      return certificate; // Return original on error
    }
  }, [contract]);

  return { loadMetadataForCertificate };
}; 