import React from 'react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import BlockchainLoader from '../Shared/BlockchainLoader';

const BulkAddModal = ({ 
  isOpen, 
  onClose, 
  courseNames, 
  setCourseNames, 
  onSubmit, 
  isLoading 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden max-w-md w-full shadow-xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Border glow effect */}
        <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-md -z-10"></div>
        
        {/* Modal content */}
        <div className="p-6">
          {!isLoading ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Add Multiple Courses</h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={onSubmit}>
                <div className="mb-5">
                  <label htmlFor="bulkCourseNames" className="block text-sm font-medium text-gray-300 mb-2">
                    Course Names (one per line)
                  </label>
                  <div className="relative">
                    <textarea
                      id="bulkCourseNames"
                      value={courseNames}
                      onChange={(e) => setCourseNames(e.target.value)}
                      placeholder="Mathematics 101&#10;Computer Science 101&#10;Physics 101"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                      rows={5}
                      required
                      disabled={isLoading}
                    ></textarea>
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: courseNames.length > 0 ? '100%' : '0%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Enter each course name on a separate line. Unique IDs will be automatically generated.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !courseNames.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                  >
                    Add Courses
                  </button>
                </div>
              </form>
            </>
          ) : (
            <BlockchainLoader 
              message="Adding courses..." 
              subMessage="Adding to blockchain..." 
              variant="purple" 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAddModal; 