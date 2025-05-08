import React from 'react';
import { FaPlus, FaFileUpload, FaSync, FaSearch } from 'react-icons/fa';
import LoadingSpinner from '../Shared/LoadingSpinner';

const CourseHeader = ({ 
  onAddCourse, 
  onBulkAdd, 
  onRefreshCounts,
  refreshingCounts,
  loading,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="relative mb-8">
      {/* Background element with gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl blur-sm -z-10"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-center py-6 px-8 backdrop-blur-sm bg-gray-900/60 rounded-xl border border-gray-800 shadow-lg">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Course Management
            </span>
          </h2>
        </div>
        
        {/* Search Component */}
        <div className="w-full md:w-auto mb-4 md:mb-0 md:mx-4 order-3 md:order-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative flex items-center bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden group-hover:border-blue-500/50 transition-all duration-300">
              <FaSearch className="absolute left-3 text-gray-500 group-hover:text-blue-400 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 py-2 pl-10 pr-4 bg-transparent text-white focus:outline-none placeholder-gray-500"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-gray-500 hover:text-white p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 order-2 md:order-3">
          <button
            onClick={onAddCourse}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg shadow-blue-600/30"
          >
            <FaPlus /> Add Course
          </button>
          
          <button
            onClick={onBulkAdd}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg shadow-purple-600/30"
          >
            <FaFileUpload /> Bulk Add
          </button>
          
          <button
            onClick={onRefreshCounts}
            disabled={loading || refreshingCounts}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshingCounts ? <LoadingSpinner size="small" /> : <FaSync />}
            {refreshingCounts ? 'Updating...' : 'Refresh Counts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader; 