import React from 'react';
import { FaCheck, FaBan } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import ButtonSpinner from '../../../components/ui/ButtonSpinner';

const ImageModal = ({
  showImage,
  imageCertificate,
  imageLoading,
  closeImageModal,
  handleImageLoad,
  handleImageError,
  placeholderImage,
  isAdmin,
  isInstitute,
  handleVerifyCertificate,
  verifyLoading,
  openRevokeModal,
  revokeLoading
}) => {
  if (!showImage || !imageCertificate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-violet-400">Certificate Image</h3>
          <button
            onClick={closeImageModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <div className="relative flex justify-center bg-gray-900/50 p-4 rounded-lg mb-4">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg backdrop-blur-sm">
              <FuturisticSpinner size="lg" color="violet" />
            </div>
          )}
          <img
            src={imageCertificate.imageUrl || placeholderImage}
            alt={`Certificate ${imageCertificate.id}`}
            className="max-w-full h-auto rounded-lg shadow-xl"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ maxHeight: '70vh' }}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="text-sm text-gray-400">
            <p>Certificate ID: {imageCertificate.id}</p>
            {imageCertificate.imageCID && (
              <p className="truncate">CID: {imageCertificate.imageCID}</p>
            )}
          </div>

          <div className="flex space-x-3">
            {(isAdmin || isInstitute) && !imageCertificate.isVerified && !imageCertificate.isRevoked && (
              <button
                onClick={() => handleVerifyCertificate(imageCertificate)}
                disabled={verifyLoading[imageCertificate.id]}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                {verifyLoading[imageCertificate.id] ? (
                  <div className="mr-2">
                    <ButtonSpinner color="green" size="md" />
                  </div>
                ) : <FaCheck className="mr-2" />}
                Verify Certificate
              </button>
            )}

            {(isAdmin || isInstitute) && !imageCertificate.isRevoked && (
              <button
                onClick={() => openRevokeModal(imageCertificate)}
                disabled={revokeLoading[imageCertificate.id]}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {revokeLoading[imageCertificate.id] ? (
                  <div className="mr-2">
                    <ButtonSpinner color="red" size="md" />
                  </div>
                ) : <FaBan className="mr-2" />}
                Revoke Certificate
              </button>
            )}

            <button
              onClick={closeImageModal}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal; 