import CertificateCard from "./CertificateCard";
import CertificateRow from "./CertificateRow";

// Certificate List Component
function CertificateList({ certificates, viewMode, onViewMetadata, onViewImage }) {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {certificates.map(cert => (
                    <CertificateCard
                        key={cert.id}
                        certificate={cert}
                        onViewMetadata={onViewMetadata}
                        onViewImage={onViewImage}
                    />
                ))}
            </div>
        );
    } else {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Course Name
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    Institution
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                    Student
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade/Date
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {certificates.map(cert => (
                                <CertificateRow
                                    key={cert.id}
                                    certificate={cert}
                                    onViewMetadata={onViewMetadata}
                                    onViewImage={onViewImage}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default CertificateList;
