import { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { setCachedData } from '../components/sperates/f1.js';
import TransactionErrorModal from '../components/ui/TransactionErrorModal';

/**
 * Custom hook for certificate verification
 * 
 * @param {Object} contract - The contract instance
 * @param {Object} selectedCertificate - Currently selected certificate
 * @param {Function} setVerifyLoading - State setter for verification loading
 * @param {Function} setCertificates - State setter for certificates
 * @param {Function} setSelectedCertificate - State setter for selected certificate
 * @param {String} CERTIFICATES_CACHE_KEY - Cache key for certificates
 * @returns {Object} - The handleVerifyCertificate function
 */
export const useCertificateVerification = (
  contract,
  selectedCertificate,
  setVerifyLoading,
  setCertificates,
  setSelectedCertificate,
  CERTIFICATES_CACHE_KEY
) => {
  // Add state for error handling
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const handleVerifyCertificate = useCallback(async (certificate) => {
    try {
      // Set loading only for this specific certificate
      setVerifyLoading(prev => ({ ...prev, [certificate.id]: true }));
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.verifyCertificate(certificate.tokenId);
      await tx.wait();

      // Update cache and state
      const updatedCert = { ...certificate, isVerified: true };
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
      
      setCertificates(prevCerts => 
        prevCerts.map(cert => cert.id === certificate.id ? updatedCert : cert)
      );

      if (selectedCertificate?.id === certificate.id) {
        setSelectedCertificate(updatedCert);
      }

      // Show success message or toast here instead of alert
      console.log(`Certificate ${certificate.id} verified successfully`);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      
      // Set error and show error modal
      setError(error);
      setShowErrorModal(true);
    } finally {
      // Clear loading only for this specific certificate
      setVerifyLoading(prev => ({ ...prev, [certificate.id]: false }));
    }
  }, [contract, selectedCertificate, setVerifyLoading, setCertificates, setSelectedCertificate, CERTIFICATES_CACHE_KEY]);

  // Function to close error modal
  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
  }, []);

  return { 
    handleVerifyCertificate,
    error,
    showErrorModal,
    closeErrorModal
  };
}; 