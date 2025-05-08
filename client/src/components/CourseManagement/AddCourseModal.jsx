import React from 'react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import BlockchainLoader from '../Shared/BlockchainLoader';

const AddCourseModal = ({ 
  isOpen, 
  onClose, 
  courseName, 
  setCourseName, 
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
        <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md -z-10"></div>
        
        {/* Modal content */}
        <div className="p-6">
          {!isLoading ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Add New Course</h3>
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
                  <label htmlFor="courseName" className="block text-sm font-medium text-gray-300 mb-2">
                    Course Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="courseName"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style={{ width: courseName.length > 0 ? '100%' : '0%' }}></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    A unique ID will be automatically generated for this course
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
                    disabled={isLoading || !courseName.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                  >
                    Add Course
                  </button>
                </div>
              </form>
            </>
          ) : (
            <BlockchainLoader 
              message="Adding course..." 
              subMessage="Adding to blockchain..." 
              variant="blue" 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal; 