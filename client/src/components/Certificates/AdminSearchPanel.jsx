import React, { useState } from 'react';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';
import DateRangeFilter from './DateRangeFilter';

const AdminSearchPanel = ({
  searchTerm,
  setSearchTerm,
  studentAddressFilter,
  setStudentAddressFilter,
  institutionFilter,
  setInstitutionFilter,
  statusFilter,
  setStatusFilter,
  setNoResultsAddress,
  normalizeAddress,
  setError,
  setCurrentPage,
  contract,
  handleSearch,
  viewMode,
  setViewMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showDateFilter,
  setShowDateFilter,
  courseNameFilter
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleSearchClick = async () => {
    setNoResultsAddress({ type: null, address: null });
    if (studentAddressFilter && !normalizeAddress(studentAddressFilter)) {
      setError('Invalid student address format. Please enter a valid Ethereum address.');
      return;
    }
    if (institutionFilter && !normalizeAddress(institutionFilter)) {
      setError('Invalid institution address format. Please enter a valid Ethereum address.');
      return;
    }
    setError('');
    setLocalLoading(true);
    setCurrentPage(1);
    if (!contract || !contract.target) {
      console.error('Contract not properly initialized. Attempting to reinitialize...');
      setError('Connection to blockchain not established. Please check your wallet connection.');
      setLocalLoading(false);
      return;
    }
    await handleSearch({
      studentAddress: studentAddressFilter,
      institutionAddress: institutionFilter,
      courseName: courseNameFilter,
      searchTerm,
      statusFilter,
      startDate,
      endDate
    });
    setLocalLoading(false);
  };

  return (
    <div className="mb-6 p-6 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-gray-400 mb-1 text-sm">Certificate ID / Course Name</label>
          <input
            type="text"
            placeholder="Enter certificate ID or course name"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1 text-sm">Student Address</label>
          <div className="relative">
            <input
              type="text"
              placeholder="0x... (Student Ethereum Address)"
              className={`w-full px-4 py-2 bg-gray-800 border ${studentAddressFilter && !studentAddressFilter.match(/^0x[0-9a-fA-F]{40}$/) ? 'border-red-500' : 'border-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
              value={studentAddressFilter}
              onChange={(e) => setStudentAddressFilter(e.target.value)}
            />
            {studentAddressFilter && !studentAddressFilter.match(/^0x[0-9a-fA-F]{40}$/) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                Invalid format
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-gray-400 mb-1 text-sm">Institution Address</label>
          <div className="relative">
            <input
              type="text"
              placeholder="0x... (Institution Ethereum Address)"
              className={`w-full px-4 py-2 bg-gray-800 border ${institutionFilter && !institutionFilter.match(/^0x[0-9a-fA-F]{40}$/) ? 'border-red-500' : 'border-gray-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
            />
            {institutionFilter && !institutionFilter.match(/^0x[0-9a-fA-F]{40}$/) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                Invalid format
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-gray-400 mb-1 text-sm">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Add DateRangeFilter component */}
      <DateRangeFilter
        showDateFilter={showDateFilter}
        setShowDateFilter={setShowDateFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={handleSearchClick}
          disabled={localLoading}
          className="flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 shadow-lg"
        >
          {localLoading ? (
            <div className="flex items-center">
              <div className="mr-3 h-5 w-5">
                <FuturisticSpinner size="sm" color="white" />
              </div>
              <span>Searching...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search Certificates
            </>
          )}
        </button>
        
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-violet-600' : 'bg-gray-800'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 ${viewMode === 'list' ? 'bg-violet-600' : 'bg-gray-800'}`}
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSearchPanel; 