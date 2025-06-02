import React, { useState } from 'react';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import { formatGrade } from '../../../components/sperates/cert_utilits.js';

// Copy icon component
const CopyIcon = ({ isCopied }) => (
  isCopied ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-400 hover:text-violet-300" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
    </svg>
  )
);

// External link icon component
const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
  </svg>
);

const MetadataModal = ({
  showMetadata,
  metadataCertificate,
  metadataImageLoading,
  closeMetadataModal
}) => {
  const [copiedText, setCopiedText] = useState('');
  
  if (!showMetadata || !metadataCertificate) return null;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl h-[80vh] overflow-y-auto border border-gray-700 shadow-xl relative">
        {metadataImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg backdrop-blur-sm z-10">
            <FuturisticSpinner size="lg" color="violet" />
          </div>
        )}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 py-2 z-10">
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
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">Student:</span> 
                <div className="flex flex-1 items-center">
                  <span className="break-all text-xs mr-2">{metadataCertificate.student}</span>
                  <button 
                    onClick={() => copyToClipboard(metadataCertificate.student, 'Student Address')}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                    title="Copy student address"
                  >
                    <CopyIcon isCopied={copiedText === 'Student Address'} />
                  </button>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">Institution:</span>
                <div className="flex flex-1 items-center">
                  <span className="break-all text-xs mr-2">{metadataCertificate.institution}</span>
                  <button 
                    onClick={() => copyToClipboard(metadataCertificate.institution, 'Institution Address')}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                    title="Copy institution address"
                  >
                    <CopyIcon isCopied={copiedText === 'Institution Address'} />
                  </button>
                </div>
              </div>
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
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">Image CID:</span>
                <div className="flex flex-1 items-center">
                  <span className="break-all text-xs mr-2">{metadataCertificate.imageCID}</span>
                  <button 
                    onClick={() => copyToClipboard(metadataCertificate.imageCID, 'Image CID')}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                    title="Copy Image CID"
                  >
                    <CopyIcon isCopied={copiedText === 'Image CID'} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-gray-400 mr-2">Metadata CID:</span>
                <div className="flex flex-1 items-center">
                  <span className="break-all text-xs mr-2">{metadataCertificate.metadataCID}</span>
                  <button 
                    onClick={() => copyToClipboard(metadataCertificate.metadataCID, 'Metadata CID')}
                    className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                    title="Copy Metadata CID"
                  >
                    <CopyIcon isCopied={copiedText === 'Metadata CID'} />
                  </button>
                </div>
              </div>
              
              {metadataCertificate.metadata?.transactionHash && (
                <div className="flex items-start">
                  <span className="text-gray-400 mr-2">Transaction Hash:</span>
                  <div className="flex flex-1 items-center flex-wrap">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${metadataCertificate.metadata.transactionHash}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 break-all text-xs mr-2 flex items-center"
                      title="View on Etherscan"
                    >
                      {metadataCertificate.metadata.transactionHash}
                      <ExternalLinkIcon />
                    </a>
                    <button 
                      onClick={() => copyToClipboard(metadataCertificate.metadata.transactionHash, 'Transaction Hash')}
                      className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                      title="Copy Transaction Hash"
                    >
                      <CopyIcon isCopied={copiedText === 'Transaction Hash'} />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {metadataCertificate.metadata.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-800 p-2 rounded border border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-violet-300 text-sm">{attr.trait_type}</span>
                          {(attr.trait_type === 'Student Address' || attr.trait_type === 'Transaction Hash') && (
                            <button 
                              onClick={() => copyToClipboard(attr.value, attr.trait_type)}
                              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                              title={`Copy ${attr.trait_type}`}
                            >
                              <CopyIcon isCopied={copiedText === attr.trait_type} />
                            </button>
                          )}
                        </div>
                        <span className="text-xs break-all block mt-1">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {copiedText && (
          <div className="fixed bottom-6 right-6 bg-violet-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            {copiedText} copied to clipboard!
          </div>
        )}

        <div className="mt-6 flex justify-end sticky bottom-0 bg-gray-800 py-3 z-10">
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