import { useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { setCachedData } from '../components/sperates/f1.js';

/**
 * Custom hook for certificate revocation
 * 
 * @param {Object} contract - The contract instance
 * @param {Object} selectedCertificate - Currently selected certificate
 * @param {Function} setRevokeLoading - State setter for revocation loading
 * @param {Function} setCertificates - State setter for certificates
 * @param {Function} setSelectedCertificate - State setter for selected certificate
 * @param {Function} setShowRevokeModal - State setter to control modal visibility
 * @param {Function} setRevocationReason - State setter for revocation reason
 * @param {String} CERTIFICATES_CACHE_KEY - Cache key for certificates
 * @returns {Object} - The handleRevokeCertificate function
 */
export const useCertificateRevocation = (
  contract,
  selectedCertificate,
  setRevokeLoading,
  setCertificates,
  setSelectedCertificate,
  setShowRevokeModal,
  setRevocationReason,
  CERTIFICATES_CACHE_KEY
) => {
  
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
  }, [contract, selectedCertificate, setRevokeLoading, setCertificates, setSelectedCertificate, setShowRevokeModal, setRevocationReason, CERTIFICATES_CACHE_KEY]);

  return { handleRevokeCertificate };
}; 