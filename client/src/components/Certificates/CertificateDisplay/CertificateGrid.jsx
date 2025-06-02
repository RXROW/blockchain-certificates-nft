import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaFileAlt, FaCheck, FaBan, FaTrash, FaClock, FaExchangeAlt, FaQrcode } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import ButtonSpinner from '../../../components/ui/ButtonSpinner';
import { getStatusColor, getStatusText, formatGrade } from '../../../components/sperates/cert_utilits.js';
import BurnStatusIndicator from '../BurnStatusIndicator';
import BurningCertificate from './BurningCertificate';

const CertificateGrid = ({
  visibleCertificates,
  selectedCertificates,
  isAdmin,
  isInstitute,
  toggleCertificateSelection,
  openMetadataModal,
  handleViewImage,
  handleVerifyCertificate,
  verifyLoading,
  openRevokeModal,
  revokeLoading,
  openBurnModal,
  burnTimelock,
  onBurnAnimationStart,
  openQRModal
}) => {
  // Track which certificates are currently burning
  const [burningCertificates, setBurningCertificates] = useState({});
  // Track which certificates should be hidden after burning
  const [hiddenCertificates, setHiddenCertificates] = useState({});
  
  // Handler for when burn animation completes
  const handleBurnComplete = (certificate) => {
    console.log(`Burn animation completed for certificate #${certificate.id}`);
    
    // Update the burning state to remove this certificate
    setBurningCertificates(prev => {
      const updated = { ...prev };
      delete updated[certificate.id];
      return updated;
    });
    
    // Mark this certificate as hidden
    setHiddenCertificates(prev => ({
      ...prev,
      [certificate.id]: true
    }));
  };

  // Handler for when burn is cancelled
  const handleBurnCancel = (certificate) => {
    console.log(`Burn cancelled for certificate #${certificate.id}`);
    
    // Update the burning state to remove this certificate
    setBurningCertificates(prev => {
      const updated = { ...prev };
      delete updated[certificate.id];
      return updated;
    });
  };
  
  // Function to start burn animation for a certificate
  const startBurningAnimation = (certificate) => {
    // Set this certificate as burning
    setBurningCertificates(prev => ({
      ...prev,
      [certificate.id]: true
    }));
    
    console.log(`Starting burn animation for certificate #${certificate.id}`);
  };
  
  // Modified burn handler to include animation for admins
  const handleBurnWithAnimation = (certificate) => {
    // Just open the burn modal - animation will start during transaction processing
    openBurnModal(certificate);
  };

  // Filter out certificates that have been burned and should be hidden
  const filteredCertificates = visibleCertificates.filter(cert => !hiddenCertificates[cert.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {filteredCertificates.map((certificate) => (
        <BurningCertificate
          key={certificate.id}
          certificate={certificate}
          isBurning={burningCertificates[certificate.id] || certificate.isBurning}
          onBurnComplete={handleBurnComplete}
          onBurnCancel={handleBurnCancel}
          className={`bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden hover:border-violet-500 transition-all duration-300 shadow-lg ${selectedCertificates.some(c => c.id === certificate.id) ? 'ring-2 ring-violet-500' : ''}`}
        >
          {(isAdmin || isInstitute) && (
            <div className="p-2">
              <input 
                type="checkbox" 
                checked={selectedCertificates.some(c => c.id === certificate.id)}
                onChange={() => toggleCertificateSelection(certificate)}
                className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
              />
            </div>
          )}
          <div className={`h-2 ${getStatusColor(certificate)}`}></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-violet-400 truncate">
                {certificate.courseName || `Certificate ${certificate.id}`}
              </h3>
              <span className={`${getStatusColor(certificate)} px-3 py-1 rounded-full text-sm font-medium`}>
                {getStatusText(certificate)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-gray-400">
                <span className="font-bold">ID:</span> {certificate.id}
              </p>
              <p className="text-gray-400">
                <span className="font-bold">Student:</span> 
                <span className="text-white truncate block">{certificate.student.substring(0, 6)}...{certificate.student.substring(38)}</span>
              </p>
              <p className="text-gray-400">
                <span className="font-bold">Institution:</span> 
                <span className="text-white truncate block">{certificate.institution.substring(0, 6)}...{certificate.institution.substring(38)}</span>
              </p>
              <p className="text-gray-400">
                <span className="font-bold">Date:</span> {certificate.completionDate}
              </p>
              <p className="text-gray-400">
                <span className="font-bold">Grade:</span> {certificate.grade}% ({formatGrade(certificate.grade)})
              </p>
            </div>
            
            {/* Display burn status if requested or approved */}
            {(certificate.burnRequested || certificate.burnApproved) && (
              <div className="mb-4 p-2 border border-amber-500/30 bg-amber-900/20 rounded-md">
                <div className="flex items-center">
                  {certificate.burnApproved ? (
                    <div className="flex items-center text-green-400">
                      <FaCheck className="mr-2 text-green-400" />
                      <span className="font-medium">Burn Approved</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-400">
                      <FaClock className="mr-2 text-amber-400" />
                      <span className="font-medium">Burn Requested</span>
                    </div>
                  )}
                </div>
                
                {certificate.burnRequestTime && !certificate.burnApproved && (
                  <div className="text-xs text-gray-400 mt-1 ml-5">
                    Requested: {new Date(certificate.burnRequestTime).toLocaleString()}
                  </div>
                )}
                
                {certificate.burnReason && (
                  <div className="text-xs text-gray-400 mt-1 ml-5">
                    Reason: {certificate.burnReason}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openMetadataModal(certificate)}
                className="flex items-center px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-sm"
              >
                <FaFileAlt className="mr-1" />
                Metadata
              </button>
              
              <button
                onClick={() => handleViewImage(certificate)}
                className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
              >
                <FaEye className="mr-1" />
                View
              </button>

              <button
                onClick={() => openQRModal(certificate)}
                className="flex items-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm"
                title="Share with QR Code"
              >
                <FaQrcode className="mr-1" />
                QR Code
              </button>

              {(isAdmin || isInstitute) && !certificate.isVerified && !certificate.isRevoked && (
                <button
                  onClick={() => handleVerifyCertificate(certificate)}
                  disabled={verifyLoading[certificate.id]}
                  className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                >
                  {verifyLoading[certificate.id] ? (
                    <div className="mr-1">
                      <ButtonSpinner color="green" />
                    </div>
                  ) : (
                    <FaCheck className="mr-1" />
                  )}
                  Verify
                </button>
              )}

              {(isAdmin || isInstitute) && !certificate.isRevoked && (
                <button
                  onClick={() => openRevokeModal(certificate)}
                  disabled={revokeLoading[certificate.id]}
                  className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  {revokeLoading[certificate.id] ? (
                    <div className="mr-1">
                      <ButtonSpinner color="red" />
                    </div>
                  ) : (
                    <FaBan className="mr-1" />
                  )}
                  Revoke
                </button>
              )}

              {!certificate.isRevoked && (isAdmin || isInstitute || certificate.student === window.ethereum?.selectedAddress) && (
                <button
                  onClick={() => handleBurnWithAnimation(certificate)}
                  className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                  disabled={burningCertificates[certificate.id]}
                >
                  <FaTrash className="mr-1" />
                  Burn
                </button>
              )}
            </div>
          </div>
        </BurningCertificate>
      ))}
    </div>
  );
};

export default CertificateGrid; 