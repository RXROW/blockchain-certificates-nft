import React from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaFileAlt, FaCheck, FaBan, FaTrash, FaInfoCircle, FaExchangeAlt } from 'react-icons/fa';
import ButtonSpinner from '../../../components/ui/ButtonSpinner';
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
  openQRModal
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
          <CertificateTableRow
            key={certificate.id}
            certificate={certificate}
            isAdmin={isAdmin}
            isInstitute={isInstitute}
            selectedCertificates={selectedCertificates}
            toggleCertificateSelection={toggleCertificateSelection}
            openMetadataModal={openMetadataModal}
            handleViewImage={handleViewImage}
            handleVerifyCertificate={handleVerifyCertificate}
            verifyLoading={verifyLoading}
            openRevokeModal={openRevokeModal}
            revokeLoading={revokeLoading}
            openQRModal={openQRModal}
          />
        ))}
      </tbody>
    </table>
  );
};

export default CertificateTable; 