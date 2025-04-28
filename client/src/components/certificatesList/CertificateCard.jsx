import StatusBadge from './StatusBadge';
import { Eye, FileText } from 'lucide-react';

// Certificate Card Component (for Grid View)
export default function CertificateCard({ certificate, onViewMetadata, onViewImage }) {
    return (
        <div className="bg-slate-950/40 text-white rounded-lg shadow overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
            <div className="h-40 bg-gray-200 relative">
                <img
                    src={certificate.imageUrl}
                    alt={certificate.courseName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                    <StatusBadge certificate={certificate} />
                </div>
            </div>
            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">{certificate.courseName}</h3>

                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-gray-200">Institution</span>
                        <span className="text-gray-200 font-medium">{certificate.institution}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-200">ID</span>
                        <span className="text-gray-200 font-medium">{certificate.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-200">Grade</span>
                        <span className="text-gray-200 font-medium">{certificate.grade}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-200">Issue Date</span>
                        <span className="text-gray-200 font-medium">{certificate.issueDate}</span>
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => onViewMetadata(certificate)}
                        className="flex items-center justify-center gap-1 flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        <span>Details</span>
                    </button>
                    <button
                        onClick={() => onViewImage(certificate)}
                        className="flex items-center justify-center gap-1 flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
