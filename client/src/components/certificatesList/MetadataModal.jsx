import React from 'react';
import { X, Award, Building2, User, Calendar, FileText, Hash } from 'lucide-react';
import StatusBadge from './StatusBadge';

// Metadata Modal Component
export default function MetadataModal({ certificate, onClose }) {
    const getStatusText = (cert) => {
        if (cert.isRevoked) return 'Revoked';
        if (cert.isVerified) return 'Verified';
        return 'Pending';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Certificate Details
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Basic Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Hash className="w-4 h-4" />
                                        Certificate ID
                                    </div>
                                    <div className="font-medium">{certificate.id}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <FileText className="w-4 h-4" />
                                        Course Name
                                    </div>
                                    <div className="font-medium">{certificate.courseName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        Institution
                                    </div>
                                    <div className="font-medium">{certificate.institution}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        Student Address
                                    </div>
                                    <div className="font-medium">{certificate.student}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Additional Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-500">Grade</div>
                                    <div className="font-medium">{certificate.grade}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Issue Date
                                    </div>
                                    <div className="font-medium">{certificate.issueDate}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Status</div>
                                    <div>
                                        <StatusBadge certificate={certificate} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Blockchain TX</div>
                                    <div className="font-medium text-blue-600 truncate">
                                        {certificate.txHash || '0x83f7b8d72e6b94a1cf3b27c7c29cbe171ac03e3f7d2cd21c8...'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Certificate Hash</h3>
                        <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                            {certificate.hash || '8d72e6b94a1cf3b27c7c29cbe171ac03e3f7d2cd21c83f7b8d72e6b94a1cf3b27c7c29cbe171ac03e3f7d2c'}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
