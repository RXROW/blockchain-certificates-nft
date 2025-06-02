import { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { CERTIFICATES_CACHE_KEY } from '../components/sperates/f1.js';
import TransactionErrorModal from '../components/ui/TransactionErrorModal';

export const useCertificateBurn = (
  contract,
  setCertificates,
  setSelectedCertificate
) => {
  const [burnLoading, setBurnLoading] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [burnReason, setBurnReason] = useState('');
  const [burnTimelock, setBurnTimelock] = useState(0);
  const [internalSelectedCertificate, setInternalSelectedCertificate] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Get burn timelock from contract
  const getBurnTimelock = useCallback(async () => {
    if (!contract) return;
    try {
      const timelock = await contract.burnTimelock();
      setBurnTimelock(Number(timelock));
    } catch (error) {
      console.error("Error getting burn timelock:", error);
    }
  }, [contract]);
  
  // Close error modal
  const closeErrorModal = useCallback(() => {
    setShowErrorModal(false);
    setError(null);
  }, []);
  
  // Request to burn a certificate
  const requestBurnCertificate = useCallback(async () => {
    if (!contract || !internalSelectedCertificate) {
      console.error("Cannot request burn: contract or certificate is missing");
      return;
    }
    
    try {
      setBurnLoading(true);
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to request burn
      const tx = await contract.connect(signer).requestBurnCertificate(
        internalSelectedCertificate.id, 
        burnReason
      );
      
      await tx.wait();
      console.log(`Burn request submitted for certificate ${internalSelectedCertificate.id}`);
      
      // Update the certificate in the list
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === internalSelectedCertificate.id 
            ? { 
                ...cert, 
                burnRequested: true, 
                burnRequestTime: Date.now(),
                burnReason: burnReason
              } 
            : cert
        )
      );
      
      // Clear the form
      setInternalSelectedCertificate(null);
      setBurnReason('');
      setShowBurnModal(false);
      
      // Clear cache
      localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      
    } catch (error) {
      console.error("Error requesting certificate burn:", error);
      setError(error);
      setShowErrorModal(true);
    } finally {
      setBurnLoading(false);
    }
  }, [contract, internalSelectedCertificate, burnReason, setCertificates, setInternalSelectedCertificate]);
  
  // Request to burn multiple certificates
  const requestBurnMultipleCertificates = useCallback(async (certificateIds, reason) => {
    if (!contract || !certificateIds || certificateIds.length === 0) {
      console.error("Cannot request burn: contract or certificates are missing");
      return;
    }
    
    try {
      setBurnLoading(true);
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to request bulk burn
      const tx = await contract.connect(signer).requestBurnMultipleCertificates(
        certificateIds, 
        reason
      );
      
      await tx.wait();
      console.log(`Burn requests submitted for ${certificateIds.length} certificates`);
      
      // Update the certificates in the list
      setCertificates(prev => 
        prev.map(cert => 
          certificateIds.includes(cert.id)
            ? { 
                ...cert, 
                burnRequested: true, 
                burnRequestTime: Date.now(),
                burnReason: reason
              } 
            : cert
        )
      );
      
      // Clear cache
      localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      
    } catch (error) {
      console.error("Error requesting certificate burn:", error);
      setError(error);
      setShowErrorModal(true);
    } finally {
      setBurnLoading(false);
    }
  }, [contract, setCertificates]);
  
  // Approve a burn request (admin only)
  const approveBurnCertificate = useCallback(async (certificate) => {
    if (!contract) return;
    
    try {
      setBurnLoading(true);
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to approve burn
      const tx = await contract.connect(signer).approveBurnCertificate(certificate.id);
      await tx.wait();
      
      console.log(`Burn approved for certificate ${certificate.id}`);
      
      // Update the certificate in the list
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificate.id 
            ? { ...cert, burnApproved: true } 
            : cert
        )
      );
      
      // Clear cache
      localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      
    } catch (error) {
      console.error("Error approving certificate burn:", error);
      setError(error);
      setShowErrorModal(true);
    } finally {
      setBurnLoading(false);
    }
  }, [contract, setCertificates]);
  
  // Cancel a burn request
  const cancelBurnRequest = useCallback(async (certificate) => {
    if (!contract) return;
    
    try {
      setBurnLoading(true);
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to cancel burn request
      const tx = await contract.connect(signer).cancelBurnRequest(certificate.id);
      await tx.wait();
      
      console.log(`Burn request canceled for certificate ${certificate.id}`);
      
      // Update the certificate in the list
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificate.id 
            ? { 
                ...cert, 
                burnRequested: false,
                burnRequestTime: null,
                burnReason: '',
                burnApproved: false
              } 
            : cert
        )
      );
      
      // Clear cache
      localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      
    } catch (error) {
      console.error("Error canceling certificate burn request:", error);
      setError(error);
      setShowErrorModal(true);
    } finally {
      setBurnLoading(false);
    }
  }, [contract, setCertificates]);
  
  // Cancel multiple burn requests
  const cancelBurnMultipleRequests = useCallback(async (certificateIds) => {
    if (!contract || !certificateIds || certificateIds.length === 0) return;
    
    try {
      setBurnLoading(true);
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to cancel multiple burn requests
      const tx = await contract.connect(signer).cancelBurnMultipleRequests(certificateIds);
      await tx.wait();
      
      console.log(`Burn requests canceled for ${certificateIds.length} certificates`);
      
      // Update the certificates in the list
      setCertificates(prev => 
        prev.map(cert => 
          certificateIds.includes(cert.id)
            ? { 
                ...cert, 
                burnRequested: false,
                burnRequestTime: null,
                burnReason: '',
                burnApproved: false
              } 
            : cert
        )
      );
      
      // Clear cache
      localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      
    } catch (error) {
      console.error("Error canceling certificate burn requests:", error);
      setError(error);
      setShowErrorModal(true);
    } finally {
      setBurnLoading(false);
    }
  }, [contract, setCertificates]);
  
  // Direct burn (if permissions allow)
  const burnCertificate = useCallback(async () => {
    if (!contract || !internalSelectedCertificate) {
      console.error("Cannot burn: contract or certificate is missing");
      return;
    }
    
    try {
      setBurnLoading(true);
      
      // First update the certificate state to show it's being burned (but don't remove yet)
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === internalSelectedCertificate.id 
            ? { ...cert, isBurning: true } 
            : cert
        )
      );
      
      // Get the signer for transaction
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Send transaction to burn
      const tx = await contract.connect(signer).burnCertificate(
        internalSelectedCertificate.id, 
        burnReason
      );
      
      await tx.wait();
      console.log(`Certificate ${internalSelectedCertificate.id} burned`);
      
      // IMPORTANT: Delay removing the certificate from the list to allow the burning animation to complete
      setTimeout(() => {
        // Remove the certificate from the list
        setCertificates(prev => 
          prev.filter(cert => cert.id !== internalSelectedCertificate.id)
        );
        
        // Clear cache
        localStorage.removeItem(CERTIFICATES_CACHE_KEY);
      }, 4000); // This should be slightly longer than the animation duration
      
      // Clear the form immediately
      setInternalSelectedCertificate(null);
      setBurnReason('');
      setShowBurnModal(false);
      
    } catch (error) {
      console.error("Error burning certificate:", error);
      
      // Set error for modal display
      setError(error);
      setShowErrorModal(true);
      
      // Reset the burning state regardless of error type
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === internalSelectedCertificate?.id 
            ? { ...cert, isBurning: false } 
            : cert
        )
      );
      
    } finally {
      setBurnLoading(false);
    }
  }, [contract, internalSelectedCertificate, burnReason, setCertificates, setInternalSelectedCertificate]);
  
  // Open burn modal
  const openBurnModal = useCallback((certificate) => {
    // Update both the internal state and the parent component's state
    setInternalSelectedCertificate(certificate);
    setSelectedCertificate(certificate);
    setBurnReason('');
    setShowBurnModal(true);
    getBurnTimelock();
  }, [setSelectedCertificate, getBurnTimelock]);
  
  // Close burn modal
  const closeBurnModal = useCallback(() => {
    setShowBurnModal(false);
    setBurnReason('');
    // Clear both states
    setInternalSelectedCertificate(null);
    setSelectedCertificate(null);
  }, [setSelectedCertificate]);
  
  return {
    burnLoading,
    showBurnModal,
    burnReason,
    burnTimelock,
    setBurnReason,
    requestBurnCertificate,
    requestBurnMultipleCertificates,
    approveBurnCertificate,
    cancelBurnRequest,
    cancelBurnMultipleRequests,
    burnCertificate,
    openBurnModal,
    closeBurnModal,
    error,
    showErrorModal,
    closeErrorModal
  };
}; 