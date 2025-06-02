import { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { setCachedData } from '../components/sperates/f1.js';
import TransactionErrorModal from '../components/ui/TransactionErrorModal';

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
  // Add state for error handling
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
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
      
      // Show success message or toast here instead of alert
      console.log(`Certificate ${certificate.id} revoked successfully`);
    } catch (error) {
      console.error('Error revoking certificate:', error);
      
      // Set error and show error modal instead of alerts
      setError(error);
      setShowErrorModal(true);
    } finally {
      // Clear loading only for this specific certificate
      setRevokeLoading(prev => ({ ...prev, [certificate.id]: false }));
    }
  }, [contract, selectedCertificate, setRevokeLoading, setCertificates, setSelectedCertificate, setShowRevokeModal, setRevocationReason, CERTIFICATES_CACHE_KEY]);

  // Function to close error modal
  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  return { 
    handleRevokeCertificate,
    error,
    showErrorModal,
    closeErrorModal
  };
}; 