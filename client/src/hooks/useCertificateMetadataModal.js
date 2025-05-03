import { useState, useCallback } from 'react';

export const useCertificateMetadataModal = (loadMetadataForCertificate) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [error, setError] = useState('');

  const handleViewMetadata = useCallback(async (certificate) => {
    try {
      setImageLoading(true);
      setError('');
      
      const certWithMetadata = await loadMetadataForCertificate(certificate);
      console.log('Certificate with metadata and details:', certWithMetadata);
      
      setSelectedCertificate(certWithMetadata);
      setShowMetadata(true);
    } catch (error) {
      console.error('Error viewing metadata:', error);
      setError('Failed to load certificate details: ' + error.message);
    } finally {
      setImageLoading(false);
    }
  }, [loadMetadataForCertificate]);

  const closeModal = useCallback(() => {
    setShowMetadata(false);
    setSelectedCertificate(null);
    setImageLoading(false);
    setError('');
  }, []);

  return {
    showMetadata,
    setShowMetadata,
    imageLoading,
    selectedCertificate,
    setSelectedCertificate,
    error,
    handleViewMetadata,
    closeModal
  };
}; 