import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

// Status Badge Component
export default function StatusBadge({ certificate }) {
    const getStatusColor = (cert) => {
        if (cert.isRevoked) return 'bg-red-500 text-white';
        if (cert.isVerified) return 'bg-green-500 text-white';
        return 'bg-yellow-500 text-white';
    };

    const getStatusText = (cert) => {
        if (cert.isRevoked) return 'Revoked';
        if (cert.isVerified) return 'Verified';
        return 'Pending';
    };

    const getStatusIcon = (cert) => {
        if (cert.isRevoked) return <XCircle className="w-4 h-4" />;
        if (cert.isVerified) return <CheckCircle className="w-4 h-4" />;    
        return <AlertCircle className="w-4 h-4" />;
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(certificate)}`}>
            {getStatusIcon(certificate)}
            {getStatusText(certificate)}
        </span>
    );
}
