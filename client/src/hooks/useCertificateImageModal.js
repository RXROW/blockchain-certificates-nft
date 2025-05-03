import { useState, useCallback } from 'react';
import { placeholderImage, getCachedData, IMAGE_CACHE_KEY } from '../components/sperates/f1.js';

export const useCertificateImageModal = (loadMetadataForCertificate, closeMetadataModal, showMetadata) => {
  const [showImage, setShowImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [error, setError] = useState('');

  const handleViewImage = useCallback(async (certificate) => {
    try {
      setError('');
      
      // Close metadata modal if it's open
      if (showMetadata) {
        closeMetadataModal();
      }
      
      // Check if certificate already has image URL (optimistic loading)
      if (certificate.imageUrl) {
        console.log('Certificate already has image URL, loading immediately');
        setSelectedCertificate(certificate);
        setShowImage(true);
        // Still check if we need to update metadata in the background
        if (!certificate.metadataLoaded && certificate.imageCID) {
          // Check if image is in cache
          const cachedImageUrl = getCachedData(`${IMAGE_CACHE_KEY}_${certificate.imageCID}`);
          if (cachedImageUrl) {
            // Image is in cache, no need to show loading indicator
            loadMetadataForCertificate(certificate).then(updatedCert => {
              setSelectedCertificate(updatedCert);
            }).catch(err => {
              console.error('Background metadata refresh error:', err);
            });
            return;
          }
        }
      }
      
      // If we get here, we need to show loading state
      setImageLoading(true);
      
      // Lazily load metadata and image if it hasn't been loaded yet
      const certWithMetadata = await loadMetadataForCertificate(certificate);
      setSelectedCertificate(certWithMetadata);
      setShowImage(true);
      
      // If image URL is still not available after loading metadata, keep loading state
      if (!certWithMetadata.imageUrl) {
        console.warn('No image URL available after loading metadata');
      }
    } catch (err) {
      console.error('Error viewing image:', err);
      setError('Failed to load certificate image: ' + err.message);
      setImageLoading(false);
    }
  }, [loadMetadataForCertificate, closeMetadataModal, showMetadata]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback((e) => {
    console.error('Image failed to load');
    setImageLoading(false);
    e.target.onerror = null;
    e.target.src = placeholderImage;
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImage(false);
    setSelectedCertificate(null);
    setImageLoading(false);
    setError('');
  }, []);

  return {
    showImage,
    setShowImage,
    imageLoading,
    selectedCertificate,
    setSelectedCertificate,
    error,
    handleViewImage,
    handleImageLoad,
    handleImageError,
    closeImageModal
  };
}; 