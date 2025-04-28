import StatusBadge from './StatusBadge';
import { Eye, FileText } from 'lucide-react';   

// Certificate Row Component (for List View)
export default function CertificateRow({ certificate, onViewMetadata, onViewImage }) {
    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="py-4 px-4">
                <div className="font-medium text-gray-800">{certificate.courseName}</div>
                <div className="text-sm text-gray-500">ID: {certificate.id}</div>
            </td>
            <td className="py-4 px-4 hidden md:table-cell">
                {certificate.institution}
            </td>
            <td className="py-4 px-4 hidden lg:table-cell">
                {certificate.student}
            </td>
            <td className="py-4 px-4">
                <div className="font-medium">{certificate.grade}</div>
                <div className="text-sm text-gray-500">{certificate.issueDate}</div>
            </td>
            <td className="py-4 px-4">
                <StatusBadge certificate={certificate} />
            </td>
            <td className="py-4 px-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewMetadata(certificate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                    >
                        <FileText className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onViewImage(certificate)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="View Certificate"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
