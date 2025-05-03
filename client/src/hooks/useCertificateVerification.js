import { useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { setCachedData } from '../components/sperates/f1.js';

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

      alert(`Certificate ${certificate.id} verified successfully`);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      
      // Enhanced error handling for specific error types
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        alert('You do not have permission to verify certificates');
      } else if (error.message.includes('ERC721NonexistentToken')) {
        alert('This certificate no longer exists');
      } else if (error.message.includes('AccessControlBadConfirmation')) {
        alert('Role verification failed');
      } else if (error.message.includes('OwnableUnauthorizedAccount')) {
        alert('Admin access required for this operation');
      } else {
        alert(`Failed to verify certificate: ${error.message}`);
      }
    } finally {
      // Clear loading only for this specific certificate
      setVerifyLoading(prev => ({ ...prev, [certificate.id]: false }));
    }
  }, [contract, selectedCertificate, setVerifyLoading, setCertificates, setSelectedCertificate, CERTIFICATES_CACHE_KEY]);

  return { handleVerifyCertificate };
}; 