import { useState, useCallback } from 'react';

export const useCertificateQRModal = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const openQRModal = useCallback((certificate) => {
    setSelectedCertificate(certificate);
    setShowQRModal(true);
  }, []);

  const closeQRModal = useCallback(() => {
    setShowQRModal(false);
    setTimeout(() => {
      setSelectedCertificate(null);
    }, 300); // Clear after animation completes
  }, []);

  return {
    showQRModal,
    selectedCertificate,
    openQRModal,
    closeQRModal
  };
};

export default useCertificateQRModal; 