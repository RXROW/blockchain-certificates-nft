import React, { useState } from 'react';
import { Award, RefreshCw } from 'lucide-react';
import StatsBar from '../../components/certificatesList/StatsBar';
import SearchAndFilter from '../../components/certificatesList/SearchAndFilter';
import CertificateList from '../../components/certificatesList/CertificateList';
import MetadataModal from '../../components/certificatesList/MetadataModal';
import ImageModal from '../../components/certificatesList/ImageModal';
import Header from '../../components/certificatesList/Header';

// Placeholder image for certificates
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkM2Q0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YzcyN2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

// Sample certificate data
const dummyCertificates = [
    {
        id: '1',
        courseName: 'Blockchain Development',
        institution: 'University of Technology',
        student: '0x1234...5678',
        grade: 'A+',
        issueDate: '2024-01-15',
        isVerified: true,
        isRevoked: false,
        imageUrl: placeholderImage
    },
    {
        id: '2',
        courseName: 'Smart Contract Security',
        institution: 'Crypto Academy',
        student: '0x8765...4321',
        grade: 'B',
        issueDate: '2024-02-20',
        isVerified: false,
        isRevoked: false,
        imageUrl: placeholderImage
    },
    {
        id: '3',
        courseName: 'Web3 Development',
        institution: 'Blockchain Institute',
        student: '0xabcd...efgh',
        grade: 'A',
        issueDate: '2024-03-10',
        isVerified: true,
        isRevoked: true,
        imageUrl: placeholderImage
    },
    {
        id: '4',
        courseName: 'Cryptocurrency Economics',
        institution: 'FinTech University',
        student: '0x9876...abcd',
        grade: 'B+',
        issueDate: '2024-04-05',
        isVerified: true,
        isRevoked: false,
        imageUrl: placeholderImage
    }
];

// Main component
export default function CertificateManagement() {
    const [certificates] = useState(dummyCertificates);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [modalType, setModalType] = useState(null); // 'metadata' or 'image'
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(false);

    // Filter certificates based on search term and filters
    const filteredCertificates = certificates.filter(cert => {
        // Search term filter
        const matchesSearch = !searchTerm ||
            cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.id.includes(searchTerm) ||
            cert.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.student.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'verified' && cert.isVerified && !cert.isRevoked) ||
            (statusFilter === 'pending' && !cert.isVerified && !cert.isRevoked) ||
            (statusFilter === 'revoked' && cert.isRevoked);

        // Date filter (if applied)
        let matchesDate = true;
        if (dateFilter.start && dateFilter.end) {
            const certDate = new Date(cert.issueDate);
            const startDate = new Date(dateFilter.start);
            const endDate = new Date(dateFilter.end);
            matchesDate = certDate >= startDate && certDate <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Simulate loading more certificates
    const handleLoadMore = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // In a real app, you would fetch more certificates here
        }, 1500);
    };

    return (
        <div className="  bg-gradient-to-br from-slate-950 to-violet-950  min-h-screen">
            {/* Header component */}
            <Header />

            <div className="container mx-auto   py-6">
                {/* Stats component */}
                <StatsBar
                    totalCount={certificates.length}
                    filteredCount={filteredCertificates.length}
                />

                {/* Search and filter component */}
                <SearchAndFilter
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    showAdvancedFilters={showAdvancedFilters}
                    setShowAdvancedFilters={setShowAdvancedFilters}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />

                {/* Certificate list component */}
                <CertificateList
                    certificates={filteredCertificates}
                    viewMode={viewMode}
                    onViewMetadata={(cert) => {
                        setSelectedCertificate(cert);
                        setModalType('metadata');
                    }}
                    onViewImage={(cert) => {
                        setSelectedCertificate(cert);
                        setModalType('image');
                    }}
                />

                {/* Load more button */}
                {filteredCertificates.length > 0 && (
                    <div className="mt-8 text-center">
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center mx-auto"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? (
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5 mr-2" />
                            )}
                            Load More Certificates
                        </button>
                    </div>
                )}

                {/* No results message */}
                {filteredCertificates.length === 0 && (
                    <div className="text-center py-12">
                        <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No certificates found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            {/* Modal components */}
            {modalType === 'metadata' && selectedCertificate && (
                <MetadataModal
                    certificate={selectedCertificate}
                    onClose={() => {
                        setModalType(null);
                        setSelectedCertificate(null);
                    }}
                />
            )}

            {modalType === 'image' && selectedCertificate && (
                <ImageModal
                    certificate={selectedCertificate}
                    onClose={() => {
                        setModalType(null);
                        setSelectedCertificate(null);
                    }}
                />
            )}
        </div>
    );
}
