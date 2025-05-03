import React from 'react';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import { formatGrade } from '../../../components/sperates/cert_utilits.js';

const MetadataModal = ({
  showMetadata,
  metadataCertificate,
  metadataImageLoading,
  closeMetadataModal
}) => {
  if (!showMetadata || !metadataCertificate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
        {metadataImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg backdrop-blur-sm z-10">
            <FuturisticSpinner size="lg" color="violet" />
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-violet-400">Certificate Metadata</h3>
          <button
            onClick={closeMetadataModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-violet-300 mb-2">Certificate Details</h4>
            <div className="space-y-2">
              <p><span className="text-gray-400">Token ID:</span> {metadataCertificate.id}</p>
              <p><span className="text-gray-400">Course Name:</span> {metadataCertificate.courseName}</p>
              <p><span className="text-gray-400">Course ID:</span> {metadataCertificate.courseId}</p>
              <p><span className="text-gray-400">Completion Date:</span> {metadataCertificate.completionDate}</p>
              <p><span className="text-gray-400">Grade:</span> {formatGrade(metadataCertificate.grade)} ({metadataCertificate.grade}%)</p>
              <p><span className="text-gray-400">Status:</span> {metadataCertificate.isRevoked ? 'Revoked' : metadataCertificate.isVerified ? 'Verified' : 'Pending'}</p>
            </div>
          </div>

          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-violet-300 mb-2">Blockchain Data</h4>
            <div className="space-y-2">
              <p><span className="text-gray-400">Student:</span> <span className="break-all text-xs">{metadataCertificate.student}</span></p>
              <p><span className="text-gray-400">Institution:</span> <span className="break-all text-xs">{metadataCertificate.institution}</span></p>
              {metadataCertificate.revocationReason && (
                <p><span className="text-gray-400">Revocation:</span> <span className="text-red-400">{metadataCertificate.revocationReason}</span></p>
              )}
              {metadataCertificate.version && parseInt(metadataCertificate.version) > 1 && (
                <>
                  <p><span className="text-gray-400">Version:</span> {metadataCertificate.version}</p>
                  {metadataCertificate.lastUpdateDateFormatted && (
                    <p><span className="text-gray-400">Last Update:</span> {metadataCertificate.lastUpdateDateFormatted}</p>
                  )}
                  {metadataCertificate.updateReason && metadataCertificate.updateReason !== "Initial issuance" && (
                    <p><span className="text-gray-400">Update Reason:</span> {metadataCertificate.updateReason}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {metadataCertificate.imageCID && (
          <div className="bg-gray-700/50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-violet-300 mb-2">IPFS Data</h4>
            <p><span className="text-gray-400">Image CID:</span> <span className="break-all text-xs">{metadataCertificate.imageCID}</span></p>
            <p><span className="text-gray-400">Metadata CID:</span> <span className="break-all text-xs">{metadataCertificate.metadataCID}</span></p>
          </div>
        )}

        {metadataCertificate.metadata && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-violet-300 mb-2">Metadata Content</h4>
            <div className="space-y-2">
              <p><span className="text-gray-400">Name:</span> {metadataCertificate.metadata.name}</p>
              <p><span className="text-gray-400">Description:</span> {metadataCertificate.metadata.description}</p>
              {metadataCertificate.metadata.attributes && (
                <div>
                  <p className="text-gray-400 mb-1">Attributes:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {metadataCertificate.metadata.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-800 p-2 rounded border border-gray-700">
                        <span className="text-violet-300 text-sm">{attr.trait_type}: </span>
                        <span>{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeMetadataModal}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataModal; 