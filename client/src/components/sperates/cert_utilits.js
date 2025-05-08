import { DISPLAY_LIMIT, METADATA_CACHE_KEY, IPFS_GATEWAYS, deduplicateCertificates, getCachedData, getImageUrlFromMetadata } from '../../components/sperates/f1.js';

/**
 * Filters and limits the certificates list.
 * Must be used from a React component where `searchTerm`, `statusFilter`, and `setVisibleCertificates` are available.
 */
const updateVisibleCertificates = (allCerts, searchTerm, statusFilter, setVisibleCertificates ) => {
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

  setVisibleCertificates (filtered.slice(0, DISPLAY_LIMIT));
};

/**
 * Asynchronously processes a batch of certificate tokenIds.
 */
const processCertificatesBatch = async (contractInstance, tokenIds) => {
  try {
    const batchPromises = tokenIds.map(async (tokenId) => {
      try {
        const exists = await contractInstance.tokenExists(tokenId).catch(() => false);
        if (!exists) {
          console.log(`Certificate ${tokenId} does not exist, skipping...`);
          return null;
        }

        const cert = await contractInstance.getCertificate(tokenId).catch(err => {
          console.log(`Error getting certificate ${tokenId}:`, err.message);
          return null;
        });

        if (!cert || cert.length === 0) {
          console.log(`No data found for certificate ${tokenId}, skipping...`);
          return null;
        }

        const [tokenURI, certData] = await Promise.all([
          contractInstance.tokenURI(tokenId).catch(() => ''),
          contractInstance.academicCertificates(tokenId).catch(() => null)
        ]);
        
        // Add burn status checks
        let burnRequested = false;
        let burnRequestTime = 0;
        let burnApproved = false;
        
        try {
          if (typeof contractInstance.burnRequestTimestamps === 'function') {
            const timestamp = await contractInstance.burnRequestTimestamps(tokenId).catch(() => 0);
            burnRequested = Number(timestamp) > 0;
            burnRequestTime = Number(timestamp) * 1000; // Convert to JS timestamp
          }
          
          if (typeof contractInstance.burnApproved === 'function') {
            burnApproved = await contractInstance.burnApproved(tokenId).catch(() => false);
          }
        } catch (err) {
          console.log(`Error checking burn status for certificate ${tokenId}:`, err.message);
        }

        const finalTokenURI = tokenURI || (certData?.certificateHash || '');
        let metadata = null;
        let imageCID = null;
        let imageUrl = null;
        let courseName = `Certificate ${tokenId}`;

        if (finalTokenURI) {
          const metadataCID = finalTokenURI.startsWith('ipfs://') ? finalTokenURI.slice(7) : finalTokenURI;
          const cachedMetadata = getCachedData(`${METADATA_CACHE_KEY}_${metadataCID}`);

          if (cachedMetadata) {
            metadata = cachedMetadata;
            courseName = metadata.name || courseName;

            if (metadata.image) {
              imageCID = metadata.image.startsWith('ipfs://') ? metadata.image.slice(7) : metadata.image;
              imageUrl = getImageUrlFromMetadata(metadata, imageCID);
            }
          } else {
            try {
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
                courseName = minimalMetadata.name || courseName;
                metadata = { name: courseName, _partialLoad: true };
              }
            } catch (err) {
              console.log(`Quick metadata fetch failed for ${tokenId}, will load later`);
            }
          }
        }

        const completionTimestamp = Number(cert[3]);
        const completionDate = new Date(completionTimestamp * 1000);
        const localDateString = completionDate.toLocaleDateString();
        const utcDateString = completionDate.toUTCString();

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
          courseName,
          completionDate: localDateString,
          completionTimestamp,
          completionDateUTC: utcDateString,
          grade: Number(cert[4]),
          isVerified: cert[5],
          isRevoked: cert[6],
          revocationReason: cert[7],
          version: cert[8].toString(),
          lastUpdateDate: cert[9],
          updateReason: cert[10],
          metadataLoaded: metadata && !metadata._partialLoad,
          // Add burn status
          burnRequested,
          burnRequestTime,
          burnApproved
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
};

export const formatGrade = (grade) => {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
};

export const getStatusColor = (certificate) => {
  if (!certificate) return 'bg-gray-500 text-white';
  if (certificate.isRevoked) return 'bg-red-500 text-white';
  if (certificate.isVerified) return 'bg-green-500 text-white';
  return 'bg-yellow-500 text-white';
};

export const getStatusText = (certificate) => {
  if (!certificate) return 'Unknown';
  if (certificate.isRevoked) return 'Revoked';
  if (certificate.isVerified) return 'Verified';
  return 'Pending';
};
export {
  updateVisibleCertificates,
  processCertificatesBatch
};
