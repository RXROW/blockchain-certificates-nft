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
  }, []);

  const fetchCertificates = useCallback(async (contractInstance, currentAccount) => {
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
  }, [fetchCertificateData, setCertificates, setError, setLoading]);

  return {
    fetchCertificates,
    fetchCertificateData
  };
}; 