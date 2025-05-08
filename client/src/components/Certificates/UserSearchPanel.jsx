import React, { useState } from 'react';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';

const UserSearchPanel = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  handleSearch
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const onSearch = async () => {
    setLocalLoading(true);
    if (handleSearch) await handleSearch();
    setLocalLoading(false);
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          placeholder="Search by course name, ID, student, or institution..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          onClick={onSearch}
          disabled={localLoading}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {localLoading ? (
            <div className="flex items-center">
              <div className="mr-2 h-4 w-4">
                <FuturisticSpinner size="sm" color="white" />
              </div>
              <span>Searching...</span>
            </div>
          ) : (
            <span>Search</span>
          )}
        </button>
      </div>
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="revoked">Revoked</option>
        </select>
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

export default UserSearchPanel; 