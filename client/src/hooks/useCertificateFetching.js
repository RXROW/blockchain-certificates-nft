import { useCallback } from 'react';
import { 
  CERTIFICATES_CACHE_KEY, 
  getCachedData, 
  setCachedData, 
  fetchMetadataFromIPFS, 
  getImageUrlFromMetadata 
} from '../components/sperates/f1.js';

export const useCertificateFetching = (setCertificates, setError, setLoading) => {
  const fetchCertificateData = useCallback(async (contractInstance, tokenId) => {
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

      // Get certificate information
      const [
        courseId,
        student,
        institution,
        grade,
        timestamp,
        isVerified,
        isRevoked
      ] = cert;

      // Create a standardized certificate data object
      const certificateData = {
        id: tokenId,
        courseId: Number(courseId),
        courseName: metadata?.courseName || metadata?.name || `Course ${courseId}`,
        student,
        institution,
        grade: Number(grade),
        completionTimestamp: Number(timestamp),
        completionDate: new Date(Number(timestamp) * 1000).toLocaleDateString(),
        isVerified,
        isRevoked,
        // Metadata fields
        tokenURI,
        metadataCID,
        metadata,
        imageCID,
        imageUrl,
        metadataLoaded: !!metadata,
        status: isRevoked ? 'revoked' : (isVerified ? 'verified' : 'pending'),
        // Extra details that might be populated later
        revocationReason: '',
        burnRequested: false,
        burnApproved: false,
        lastUpdateDate: '',
        updateReason: '',
        version: 0
      };

      // Check burn status if that function exists
      try {
        if (typeof contractInstance.burnRequestExists === 'function') {
          const burnStatus = await contractInstance.burnRequestExists(tokenId);
          if (burnStatus) {
            certificateData.burnRequested = true;
            // Try to get if it's approved
            try {
              const burnApproved = await contractInstance.burnRequestApproved(tokenId);
              certificateData.burnApproved = burnApproved;
            } catch (approvalErr) {
              console.error(`Could not check burn approval status for token ${tokenId}:`, approvalErr);
            }
          }
        }
      } catch (burnErr) {
        console.error(`Error checking burn status for token ${tokenId}:`, burnErr);
      }

      // Cache the certificate data
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${tokenId}`, certificateData);
      return certificateData;
    } catch (error) {
      console.error(`Error fetching certificate ${tokenId}:`, error);
      return null;
    }
  }, []);

  const fetchCertificates = useCallback(async (contractInstance, currentAccount) => {
    try {
      if (!currentAccount) {
        throw new Error('No account connected');
      }
      
      if (!contractInstance) {
        throw new Error('Contract not initialized');
      }

      console.log('Fetching certificates for account:', currentAccount);
      setLoading(true);

      // First check the balance to know how many certificates the user has
      let balance;
      try {
        balance = await contractInstance.balanceOf(currentAccount);
        console.log('Certificate balance:', balance.toString());
      } catch (error) {
        console.error('Error fetching certificate balance:', error);
        throw new Error(`Could not get your certificate balance: ${error.message}`);
      }

      // If user has no certificates, return empty array
      if (balance.toString() === '0') {
        console.log('User has no certificates');
        setCertificates([]);
        return [];
      }

      // Fetch all certificates for the user
      const certs = [];
      const errors = [];

      for (let i = 0; i < balance; i++) {
        try {
          // Get token ID from owner's index
          const tokenId = await contractInstance.tokenOfOwnerByIndex(currentAccount, i);
          console.log(`Fetching certificate ${i + 1}/${balance}, TokenID: ${tokenId}`);

          // Get full certificate data
          const certificateData = await fetchCertificateData(contractInstance, tokenId);
          if (certificateData) {
            certs.push(certificateData);
          }
        } catch (err) {
          console.error(`Error fetching certificate ${i}:`, err);
          errors.push(`Certificate #${i+1}: ${err.message}`);
          continue;
        }
      }

      console.log(`Fetched ${certs.length} certificates for user`);
      setCertificates(certs);
      
      // If we had errors but still got some certificates, show a warning
      if (errors.length > 0 && certs.length > 0) {
        setError(`Loaded ${certs.length} certificates, but failed to load ${errors.length} certificates.`);
      }
      // If we got no certificates at all but had errors, show full error
      else if (errors.length > 0 && certs.length === 0) {
        setError(`Failed to load certificates: ${errors.join('; ')}`);
      }
      
      return certs;
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(`Failed to fetch certificates: ${err.message}`);
      setCertificates([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchCertificateData, setCertificates, setError, setLoading]);

  return {
    fetchCertificates,
    fetchCertificateData
  };
}; 