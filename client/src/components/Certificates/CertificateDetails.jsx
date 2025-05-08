import React from 'react';
import { formatGrade, getStatusColor, getStatusText } from '../sperates/cert_utilits';

/**
 * Reusable component to display certificate details
 * @param {Object} certificate - The certificate object with details
 * @param {boolean} compact - Whether to show a compact version (fewer details)
 */
const CertificateDetails = ({ certificate, compact = false }) => {
  if (!certificate) return null;

  // Extract certificate name from metadata or use default
  const certificateName = 
    certificate.metadata?.name || 
    certificate.certificateName || 
    (certificate.courseName ? `Certificate for ${certificate.courseName}` : `Certificate ${certificate.id}`);

  const formattedDate = certificate.completionDate && certificate.completionDate !== 'N/A'
    ? new Date(certificate.completionTimestamp * 1000).toLocaleDateString()
    : 'N/A';

  return (
    <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 rounded-lg p-4 border border-white/10">
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-4`}>
        <div>
          <p className="text-white/60 text-sm">Certificate ID</p>
          <p className="text-white font-medium">{certificate.id}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Course</p>
          <p className="text-white font-medium">{certificate.courseName || `Course ${certificate.courseId}`}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Course ID</p>
          <p className="text-white font-medium">{certificate.courseId}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Student</p>
          <p className="text-white font-medium text-xs">{certificate.student}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Institution</p>
          <p className="text-white font-medium text-xs">{certificate.institution}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Completion Date</p>
          <p className="text-white font-medium">{formattedDate}</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Grade</p>
          <p className="text-white font-medium">{certificate.grade} ({formatGrade(certificate.grade)})</p>
        </div>
        <div>
          <p className="text-white/60 text-sm">Status</p>
          <p>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(certificate)}`}>
              {getStatusText(certificate)}
            </span>
          </p>
        </div>
        
        {/* Certificate Name (if different from course) */}
        {certificateName && certificate.courseName && certificateName !== `Certificate for ${certificate.courseName}` && (
          <div className="col-span-2">
            <p className="text-white/60 text-sm">Certificate Name</p>
            <p className="text-white font-medium">{certificateName}</p>
          </div>
        )}
        
        {!compact && certificate.version && (
          <div>
            <p className="text-white/60 text-sm">Version</p>
            <p className="text-white font-medium">{certificate.version}</p>
          </div>
        )}
        
        {!compact && certificate.lastUpdateDate && certificate.lastUpdateDate !== '0' && (
          <div>
            <p className="text-white/60 text-sm">Last Updated</p>
            <p className="text-white font-medium">
              {new Date(Number(certificate.lastUpdateDate) * 1000).toLocaleDateString()}
            </p>
          </div>
        )}
        
        {!compact && certificate.updateReason && (
          <div className="col-span-full">
            <p className="text-white/60 text-sm">Update Reason</p>
            <p className="text-white font-medium">{certificate.updateReason}</p>
          </div>
        )}
        
        {!compact && certificate.isRevoked && certificate.revocationReason && (
          <div className="col-span-full">
            <p className="text-white/60 text-sm">Revocation Reason</p>
            <p className="text-white font-medium text-red-300">{certificate.revocationReason}</p>
          </div>
        )}
        
        {/* Show metadata URI if available */}
        {!compact && (certificate.metadataURI || certificate.tokenURI) && (
          <div className="col-span-full">
            <p className="text-white/60 text-sm">Metadata URI</p>
            <p className="text-white font-medium text-xs break-all">
              {certificate.metadataURI || certificate.tokenURI}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateDetails; 