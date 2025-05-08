import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaFileAlt, FaCheck, FaBan, FaTrash, FaInfoCircle, FaExchangeAlt } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import { getStatusColor, getStatusText, formatGrade } from '../../../components/sperates/cert_utilits.js';
import CertificateTableRow from './CertificateTableRow';

const CertificateTable = ({
  visibleCertificates,
  selectedCertificates,
  isAdmin,
  isInstitute,
  toggleCertificateSelection,
  selectAllVisible,
  clearSelection,
  openMetadataModal,
  handleViewImage,
  handleVerifyCertificate,
  verifyLoading,
  openRevokeModal,
  revokeLoading,
  openBurnModal,
  burnTimelock,
  openTransferModal,
  transfersAllowed
}) => {
  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-gray-700">
        <tr>
          {(isAdmin || isInstitute) && (
            <th className="px-4 py-3 text-left">
              <input 
                type="checkbox" 
                checked={visibleCertificates.length > 0 && selectedCertificates.length === visibleCertificates.length}
                onChange={() => {
                  if (selectedCertificates.length === visibleCertificates.length) {
                    clearSelection();
                  } else {
                    selectAllVisible();
                  }
                }}
                className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
              />
            </th>
          )}
          <th className="px-4 py-3 text-left">ID</th>
          <th className="px-4 py-3 text-left">Course</th>
          <th className="px-4 py-3 text-left">Student</th>
          <th className="px-4 py-3 text-left">Institution</th>
          <th className="px-4 py-3 text-left">Completion Date</th>
          <th className="px-4 py-3 text-left hidden md:table-cell">UTC Time</th>
          <th className="px-4 py-3 text-left">Grade</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {visibleCertificates.map((certificate) => (
          <tr key={certificate.id} className="border-b border-gray-700 hover:bg-gray-700/50">
            {(isAdmin || isInstitute) && (
              <td className="px-4 py-4">
                <input 
                  type="checkbox" 
                  checked={selectedCertificates.some(c => c.id === certificate.id)}
                  onChange={() => toggleCertificateSelection(certificate)}
                  className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
                />
              </td>
            )}
            <td className="px-4 py-4">{certificate.id}</td>
            <td className="px-4 py-4 max-w-[150px] truncate">{certificate.courseName || `Certificate ${certificate.id}`}</td>
            <td className="px-4 py-4">
              <span title={certificate.student} className="truncate">
                {certificate.student.substring(0, 6)}...{certificate.student.substring(38)}
              </span>
            </td>
            <td className="px-4 py-4">
              <span title={certificate.institution} className="truncate">
                {certificate.institution.substring(0, 6)}...{certificate.institution.substring(38)}
              </span>
            </td>
            <td className="px-4 py-4">{certificate.completionDate}</td>
            <td className="px-4 py-4 hidden md:table-cell">{certificate.completionDateUTC}</td>
            <td className="px-4 py-4">{certificate.grade}% ({formatGrade(certificate.grade)})</td>
            <td className="px-4 py-4">
              <span className={`${getStatusColor(certificate)} px-2 py-1 rounded-full text-xs`}>
                {getStatusText(certificate)}
              </span>
              
              {/* Show burn status if exists */}
              {(certificate.burnRequested || certificate.burnApproved) && (
                <div className="mt-1 text-xs">
                  {certificate.burnApproved ? (
                    <span className="text-green-500">Burn approved</span>
                  ) : (
                    <span className="text-amber-500">Burn requested</span>
                  )}
                </div>
              )}
            </td>
            <td className="px-4 py-4">
              <div className="flex space-x-2 justify-center">
                {/* Remove the Details link */}
                {/* 
                <Link
                  to={`/dashboard/certificate/${certificate.id}`}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                  title="View Certificate Details"
                >
                  <FaInfoCircle />
                </Link>
                */}
                
                <button
                  onClick={() => handleViewImage(certificate)}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white transition-colors"
                  title="View Certificate"
                >
                  <FaEye />
                </button>
                
                <button
                  onClick={() => openMetadataModal(certificate)}
                  className="p-1.5 bg-violet-600 hover:bg-violet-700 rounded-full text-white transition-colors"
                  title="View Metadata"
                >
                  <FaFileAlt />
                </button>
                
                {/* Only show verify button if not verified and not revoked */}
                {!certificate.isVerified && !certificate.isRevoked && (isAdmin || isInstitute) && (
                  <button
                    onClick={() => handleVerifyCertificate(certificate)}
                    disabled={verifyLoading[certificate.id]}
                    className="p-1.5 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors w-7 h-7 flex items-center justify-center"
                    title="Verify Certificate"
                  >
                    {verifyLoading[certificate.id] ? (
                      <div className="w-4 h-4">
                        <FuturisticSpinner size="sm" color="white" />
                      </div>
                    ) : (
                      <FaCheck />
                    )}
                  </button>
                )}
                
                {/* Only show revoke button if not revoked */}
                {!certificate.isRevoked && (isAdmin || isInstitute) && (
                  <button
                    onClick={() => openRevokeModal(certificate)}
                    disabled={revokeLoading[certificate.id]}
                    className="p-1.5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors w-7 h-7 flex items-center justify-center"
                    title="Revoke Certificate"
                  >
                    {revokeLoading[certificate.id] ? (
                      <div className="w-4 h-4">
                        <FuturisticSpinner size="sm" color="white" />
                      </div>
                    ) : (
                      <FaBan />
                    )}
                  </button>
                )}
                
                {/* Add transfer button for institutions */}
                {(isAdmin || isInstitute) && !certificate.isRevoked && transfersAllowed && (
                  <button
                    onClick={() => openTransferModal(certificate)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                    title="Transfer Certificate"
                  >
                    <FaExchangeAlt />
                  </button>
                )}
                
                {/* Add the burn button - show to admins, institutions and owners */}
                {!certificate.isRevoked && (isAdmin || isInstitute || certificate.student === window.ethereum?.selectedAddress) && (
                  <button
                    onClick={() => openBurnModal(certificate)}
                    className="p-1.5 bg-red-800 hover:bg-red-900 rounded-full text-white transition-colors"
                    title="Burn Certificate"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CertificateTable; 