import React, { useState } from 'react';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';
import InstitutionManagement from '../../components/Institutions/InstitutionManagement';
import toast from 'react-hot-toast';

const ManageInstitutions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Use the updated InstitutionManagement component without redundant toast notifications
  const {
    institutions,
    loading,
    error,
    success,
    newInstitution,
    institutionName,
    nameError,
    showConfirmDialog,
    institutionToDelete,
    setNewInstitution,
    setInstitutionName,
    authorizeInstitution,
    confirmRevokeInstitution,
    cancelRevoke,
    revokeInstitution,
    validateEthereumAddress,
    validateInstitutionName
  } = InstitutionManagement({
    // Don't show duplicate toasts - InstitutionManagement already handles notifications
    onSuccess: () => {},
    onError: () => {}
  });

  // Filter institutions based on search term and status
  const filteredInstitutions = institutions.filter(institution => {
    const matchesSearch = 
      institution.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institution.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || institution.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'grid' : 'table');
  };

  return (
    <div className="max-w-7xl bg-gradient-to-br from-slate-950 to-violet-950 mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-950/20 rounded-lg shadow-xl p-6 border border-gray-700/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Manage Institutions</h2>
        </div>

        {/* Add New Institution */}
        <div className="mb-8 bg-gray-900/50 p-6 rounded border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Institution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
                <label htmlFor="institution-name" className="block text-sm font-medium text-gray-300 mb-1">
                    Institution Name
                </label>
                <input
                    id="institution-name"
                    type="text"
                    value={institutionName}
                    onChange={(e) => {
                        setInstitutionName(e.target.value);
                        if (e.target.value.trim()) {
                            validateInstitutionName(e.target.value);
                        }
                    }}
                    placeholder="Enter institution name"
                    className={`w-full px-4 py-2 bg-gray-800 border ${
                        nameError ? 'border-red-500' : 'border-gray-700'
                    } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500`}
                />
                {nameError && (
                    <p className="mt-1 text-sm text-red-400">{nameError}</p>
                )}
            </div>
            <div className="relative">
                <label htmlFor="institution-address" className="block text-sm font-medium text-gray-300 mb-1">
                    Ethereum Address
                </label>
                <div className="relative">
                    <input
                        id="institution-address"
                        type="text"
                        value={newInstitution}
                        onChange={(e) => setNewInstitution(e.target.value)}
                        placeholder="Enter institution address"
                        className={`w-full px-4 py-2 bg-gray-800 border ${
                          newInstitution && !validateEthereumAddress(newInstitution)
                            ? 'border-red-500'
                            : 'border-gray-700'
                        } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500`}
                    />
                    {newInstitution && !validateEthereumAddress(newInstitution) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                </div>
                {newInstitution && !validateEthereumAddress(newInstitution) && (
                    <p className="mt-1 text-sm text-red-400">Please enter a valid Ethereum address</p>
                )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
                onClick={authorizeInstitution}
                disabled={loading || !newInstitution || !institutionName.trim() || !validateEthereumAddress(newInstitution) || nameError}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? (
                    <>
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Adding...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Institution
                    </>
                )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded text-green-200">
            {success}
          </div>
        )}

        {/* Search, Filter and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search institutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleViewMode}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white hover:bg-gray-800 transition-colors duration-200 flex items-center"
              title={viewMode === 'table' ? 'Switch to Grid View' : 'Switch to Table View'}
            >
              {viewMode === 'table' ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Grid View
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table View
                </>
              )}
            </button>
          </div>
        </div>

        {/* Institutions List */}
        <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Current Institutions ({filteredInstitutions.length})
            </h3>
            <div className="text-sm text-gray-400">
              Showing {filteredInstitutions.length} of {institutions.length}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner size="medium" />
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-300">No institutions found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Institution
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Certificates
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredInstitutions.map((institution, index) => (
                    <tr key={index} className="hover:bg-gray-800/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-violet-900/40 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{institution.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300 font-mono">{institution.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          institution.status === 'active' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {institution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {institution.certificateCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {institution.isAdmin ? (
                          <span className="bg-violet-900/30 text-violet-300 px-3 py-1 rounded-full font-medium">
                            Admin
                          </span>
                        ) : institution.isSelf ? (
                          <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full font-medium">
                            Self
                          </span>
                        ) : institution.status === 'inactive' ? (
                          <span className="bg-gray-800/70 text-gray-400 px-3 py-1 rounded-full font-medium">
                            Already Revoked
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmRevokeInstitution(institution)}
                            disabled={loading}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center ml-auto"
                            title="Revoke Institution"
                          >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstitutions.map((institution, index) => (
                <div key={index} className="bg-gray-800/30 rounded border border-gray-700/50 p-4 hover:bg-gray-800/50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="bg-violet-900/40 p-2 rounded-lg">
                        <svg className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-white">{institution.name}</h4>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          institution.status === 'active' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        } mt-1`}>
                          {institution.status}
                        </span>
                      </div>
                    </div>
                    {institution.isAdmin ? (
                      <span className="bg-violet-900/30 text-violet-300 px-3 py-1 rounded-full text-xs font-medium">
                        Admin
                      </span>
                    ) : institution.isSelf ? (
                      <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                        Self
                      </span>
                    ) : institution.status === 'inactive' ? (
                      <span className="bg-gray-800/70 text-gray-400 px-3 py-1 rounded-full text-xs font-medium">
                        Already Revoked
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmRevokeInstitution(institution)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center"
                        title="Revoke Institution"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="ml-1 text-xs">Revoke</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-1">Address:</div>
                    <div className="text-sm text-gray-300 font-mono break-all">{institution.address}</div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-gray-400 mb-1">Certificates:</div>
                    <div className="text-sm text-gray-300">{institution.certificateCount}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Revocation</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to revoke <span className="font-semibold text-white">{institutionToDelete.name}</span>? 
              This will remove their ability to issue new certificates.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelRevoke}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={revokeInstitution}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Revoking...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Revoke Institution
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstitutions;