// src/states/certificateStates.js
import { useState } from 'react';

// This is a custom hook that returns state and state setters for certificates
export const initCertificateStates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState({});
  const [revokeLoading, setRevokeLoading] = useState({});
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCertificates, setVisibleCertificates] = useState([]);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [studentAddressFilter, setStudentAddressFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [maxResults] = useState(50);
  const [selectedCertificates, setSelectedCertificates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [noResultsAddress, setNoResultsAddress] = useState({
    type: null,
    address: null
  });

  return {
    certificates, setCertificates,
    loading, setLoading,
    searchLoading, setSearchLoading,
    error, setError,
    selectedCertificate, setSelectedCertificate,
    showMetadata, setShowMetadata,
    showImage, setShowImage,
    imageLoading, setImageLoading,
    contract, setContract,
    account, setAccount,
    isConnecting, setIsConnecting,
    isAdmin, setIsAdmin,
    verifyLoading, setVerifyLoading,
    revokeLoading, setRevokeLoading,
    showRevokeModal, setShowRevokeModal,
    revocationReason, setRevocationReason,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    viewMode, setViewMode,
    lastUpdated, setLastUpdated,
    currentPage, setCurrentPage,
    hasMore, setHasMore,
    loadingMore, setLoadingMore,
    visibleCertificates, setVisibleCertificates,
    totalCertificates, setTotalCertificates,
    studentAddressFilter, setStudentAddressFilter,
    institutionFilter, setInstitutionFilter,
    isSearching, setIsSearching,
    maxResults,
    selectedCertificates, setSelectedCertificates,
    bulkActionLoading, setBulkActionLoading,
    startDate, setStartDate,
    endDate, setEndDate,
    showDateFilter, setShowDateFilter,
    noResultsAddress, setNoResultsAddress
  };
};
