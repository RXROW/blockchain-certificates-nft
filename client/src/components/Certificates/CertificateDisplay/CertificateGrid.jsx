import React from 'react';
import { FaEye, FaFileAlt, FaCheck, FaBan } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import { getStatusColor, getStatusText, formatGrade } from '../../../components/sperates/cert_utilits.js';

const CertificateGrid = ({
  visibleCertificates,
  selectedCertificates,
  isAdmin,
  toggleCertificateSelection,
  openMetadataModal,
  handleViewImage,
  handleVerifyCertificate,
  verifyLoading,
  openRevokeModal,
  revokeLoading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {visibleCertificates.map((certificate) => (
        <div
          key={certificate.id}
          className={`bg-gray-800/80 border border-gray-700 rounded-lg overflow-hidden hover:border-violet-500 transition-all duration-300 shadow-lg ${selectedCertificates.some(c => c.id === certificate.id) ? 'ring-2 ring-violet-500' : ''}`}
        >
          {isAdmin && (
            <div className="absolute top-2 left-2">
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

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-400">Certificate ID: {certificate.id}</p>
              <p className="flex items-center text-sm">
                <span className="text-gray-400 w-32">Student:</span>
                <span className="truncate">{certificate.student.substring(0, 10)}...{certificate.student.substring(certificate.student.length - 8)}</span>
              </p>
              <p className="flex items-center text-sm">
                <span className="text-gray-400 w-32">Institution:</span>
                <span className="truncate">{certificate.institution.substring(0, 10)}...{certificate.institution.substring(certificate.institution.length - 8)}</span>
              </p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 w-32">Completion:</span>
                <span>{certificate.completionDate}</span>
              </div>
              {/* Add UTC date display with proper formatting */}
              <div className="flex justify-between items-center mb-2 text-xs">
                <span className="text-gray-500 w-32">UTC Time:</span>
                <span className="text-gray-500">
                  {certificate.completionTimestamp 
                    ? new Date(certificate.completionTimestamp * 1000).toUTCString().split(' ').slice(0, 4).join(' ')
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-400 w-32">Grade:</span>
                <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {formatGrade(certificate.grade)} ({certificate.grade}%)
                </span>
              </div>
              {certificate.revocationReason && (
                <p className="flex items-center text-sm">
                  <span className="text-gray-400 w-32">Revoked:</span>
                  <span className="text-red-400">{certificate.revocationReason}</span>
                </p>
              )}
            </div>

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

              {isAdmin && !certificate.isVerified && !certificate.isRevoked && (
                <button
                  onClick={() => handleVerifyCertificate(certificate)}
                  disabled={verifyLoading[certificate.id]}
                  className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                >
                  {verifyLoading[certificate.id] ? (
                    <div className="mr-1 h-4 w-4">
                      <FuturisticSpinner size="sm" color="white" />
                    </div>
                  ) : (
                    <FaCheck className="mr-1" />
                  )}
                  Verify
                </button>
              )}

              {isAdmin && !certificate.isRevoked && (
                <button
                  onClick={() => openRevokeModal(certificate)}
                  disabled={revokeLoading[certificate.id]}
                  className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  {revokeLoading[certificate.id] ? (
                    <div className="mr-1 h-4 w-4">
                      <FuturisticSpinner size="sm" color="white" />
                    </div>
                  ) : (
                    <FaBan className="mr-1" />
                  )}
                  Revoke
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CertificateGrid; 