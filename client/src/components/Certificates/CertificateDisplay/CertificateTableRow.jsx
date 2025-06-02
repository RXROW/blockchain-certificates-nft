import React from 'react';
import { FaEye, FaFileAlt, FaCheck, FaBan, FaQrcode } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';
import { getStatusColor, getStatusText, formatGrade } from '../../../components/sperates/cert_utilits.js';

const CertificateTableRow = ({
  certificate,
  isAdmin,
  isInstitute,
  selectedCertificates,
  toggleCertificateSelection,
  openMetadataModal,
  handleViewImage,
  handleVerifyCertificate,
  verifyLoading,
  openRevokeModal,
  revokeLoading,
  openQRModal
}) => {
  return (
    <tr className="border-t border-gray-700 hover:bg-gray-700/50">
      {(isAdmin || isInstitute) && (
        <td className="px-4 py-3">
          <input 
            type="checkbox" 
            checked={selectedCertificates.some(c => c.id === certificate.id)}
            onChange={() => toggleCertificateSelection(certificate)}
            className="rounded bg-gray-800 border-gray-600 text-violet-500 focus:ring-violet-500"
          />
        </td>
      )}
      <td className="px-4 py-3">{certificate.id}</td>
      <td className="px-4 py-3 max-w-xs truncate">
        {certificate.courseName || `Certificate ${certificate.id}`}
      </td>
      <td className="px-4 py-3">{certificate.student.substring(0, 6)}...{certificate.student.substring(certificate.student.length - 4)}</td>
      <td className="px-4 py-3">{certificate.institution.substring(0, 6)}...{certificate.institution.substring(certificate.institution.length - 4)}</td>
      <td className="px-4 py-3">{certificate.completionDate}</td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="text-xs text-gray-500">
          UTC: {certificate.completionDateUTC?.split(' ').slice(0, 4).join(' ')}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`font-semibold ${certificate.grade >= 70 ? 'text-green-400' : certificate.grade >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {formatGrade(certificate.grade)} ({certificate.grade}%)
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`${getStatusColor(certificate)} px-2 py-1 rounded-full text-xs font-medium`}>
          {getStatusText(certificate)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <button
            onClick={() => openMetadataModal(certificate)}
            className="p-1 text-violet-400 hover:text-violet-300"
            title="View Metadata"
          >
            <FaFileAlt />
          </button>
          <button
            onClick={() => handleViewImage(certificate)}
            className="p-1 text-purple-400 hover:text-purple-300"
            title="View Certificate"
          >
            <FaEye />
          </button>
          <button
            onClick={() => openQRModal(certificate)}
            className="p-1 text-teal-400 hover:text-teal-300"
            title="Share with QR Code"
          >
            <FaQrcode />
          </button>

          {(isAdmin || isInstitute) && !certificate.isVerified && !certificate.isRevoked && (
            <button
              onClick={() => handleVerifyCertificate(certificate)}
              disabled={verifyLoading[certificate.id]}
              className="p-1 text-green-400 hover:text-green-300"
              title="Verify Certificate"
            >
              {verifyLoading[certificate.id] ? (
                <div className="inline-block h-4 w-4">
                  <FuturisticSpinner size="sm" color="green" />
                </div>
              ) : <FaCheck />}
            </button>
          )}

          {(isAdmin || isInstitute) && !certificate.isRevoked && (
            <button
              onClick={() => openRevokeModal(certificate)}
              disabled={revokeLoading[certificate.id]}
              className="p-1 text-red-400 hover:text-red-300"
              title="Revoke Certificate"
            >
              {revokeLoading[certificate.id] ? (
                <div className="inline-block h-4 w-4">
                  <FuturisticSpinner size="sm" color="red" />
                </div>
              ) : <FaBan />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default CertificateTableRow; 