import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useCourseManagement } from '../../hooks/useCourseManagement'
import { 
  CourseHeader, 
  CourseGrid, 
  CourseStats, 
  AddCourseModal, 
  BulkAddModal, 
  Notification 
} from '../../components/CourseManagement/index'
import { FaPlus, FaSearch, FaSort, FaSortUp, FaSortDown, FaFileUpload, FaGraduationCap, FaSync } from 'react-icons/fa'
import LoadingSpinner from '../../components/Shared/LoadingSpinner'

const ManageCourses = ({ isInstitution }) => {
  // Local state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCourseNames, setBulkCourseNames] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [refreshingCounts, setRefreshingCounts] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [addingBulkCourses, setAddingBulkCourses] = useState(false);

  // Use our custom hook with memoization
  const {
    courses,
    loading,
    error,
    success,
    bulkActionLoading,
    fetchCourses,
    fetchCourseCertificateCounts,
    addCourse,
    addMultipleCourses,
    setError,
    setSuccess
  } = useCourseManagement();

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle manual refresh of certificate counts
  const handleRefreshCounts = useCallback(() => {
    if (courses && courses.length > 0 && !refreshingCounts) {
      setRefreshingCounts(true);
      fetchCourseCertificateCounts(courses.map(c => c.id))
        .then(() => {
          console.log('Certificate counts refreshed');
          setSuccess('Certificate counts updated');
        })
        .catch(err => {
          console.error('Error refreshing counts:', err);
          setError('Failed to refresh certificate counts');
        })
        .finally(() => {
          setTimeout(() => setRefreshingCounts(false), 500);
        });
    }
  }, [courses, fetchCourseCertificateCounts, setSuccess, setError, refreshingCounts]);

  // Handle sort - memoize the function
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Add a course - memoize the function
  const handleAddCourse = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newCourseName.trim()) {
      setError('Course name cannot be empty');
      return;
    }
    
    setAddingCourse(true);
    try {
      const result = await addCourse(newCourseName);
      if (result) {
        // Keep the loading state for a bit longer for visual feedback
        setTimeout(() => {
          setNewCourseName('');
          setShowAddModal(false);
          setAddingCourse(false);
          setSuccess(`Course "${newCourseName}" added successfully`);
        }, 2000);
      } else {
        setAddingCourse(false);
      }
    } catch (error) {
      setAddingCourse(false);
    }
  }, [newCourseName, addCourse, setError, setSuccess]);

  // Add multiple courses - memoize the function
  const handleAddMultipleCourses = useCallback(async (e) => {
    e.preventDefault();
    
    const courseNames = bulkCourseNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (courseNames.length === 0) {
      setError('Please enter at least one course name');
      return;
    }
    
    setAddingBulkCourses(true);
    try {
      const result = await addMultipleCourses(courseNames);
      if (result && result.length > 0) {
        // Keep the loading state for a bit longer for visual feedback
        setTimeout(() => {
          setBulkCourseNames('');
          setShowBulkModal(false);
          setAddingBulkCourses(false);
          setSuccess(`${result.length} courses added successfully`);
        }, 2000);
      } else {
        setAddingBulkCourses(false);
      }
    } catch (error) {
      setAddingBulkCourses(false);
    }
  }, [bulkCourseNames, addMultipleCourses, setError, setSuccess]);

  // Memoize filtered courses to prevent unnecessary re-filtering
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    
    const term = searchTerm.toLowerCase().trim();
    return courses.filter(course => 
      course.id.toString().includes(term) || 
      course.name.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  // Memoize sorted courses to prevent unnecessary re-sorting
  const sortedCourses = useMemo(() => [...filteredCourses].sort((a, b) => {
    if (sortConfig.key === 'id') {
      return sortConfig.direction === 'asc'
        ? Number(a.id) - Number(b.id)
        : Number(b.id) - Number(a.id);
    } else if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortConfig.key === 'count') {
      return sortConfig.direction === 'asc'
        ? (a.certificateCount || 0) - (b.certificateCount || 0)
        : (b.certificateCount || 0) - (a.certificateCount || 0);
    }
    return 0;
  }), [filteredCourses, sortConfig]);

  // Memoize pagination calculations
  const { totalPages, paginatedCourses } = useMemo(() => {
    const total = Math.max(1, Math.ceil(sortedCourses.length / ITEMS_PER_PAGE));
    const paginated = sortedCourses.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    return { totalPages: total, paginatedCourses: paginated };
  }, [sortedCourses, currentPage, ITEMS_PER_PAGE]);

  // Handle pagination
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  if (!isInstitution) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center border border-gray-800">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400">Only institutions can manage courses.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Background decorative elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-600 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-600 rounded-full opacity-5 blur-3xl"></div>
        </div>
        
        {/* Header section */}
        <CourseHeader 
          onAddCourse={() => setShowAddModal(true)}
          onBulkAdd={() => setShowBulkModal(true)}
          onRefreshCounts={handleRefreshCounts}
          refreshingCounts={refreshingCounts}
          loading={loading || bulkActionLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        {/* Stats section */}
        <CourseStats courses={courses} loading={loading} />
        
        {/* Course grid */}
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 shadow-xl">
          {/* Results info */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-400">
              {searchTerm ? (
                <p>
                  Found <span className="text-white font-medium">{filteredCourses.length}</span> 
                  {filteredCourses.length === 1 ? ' course' : ' courses'} 
                  {searchTerm && (
                    <span> for "<span className="text-blue-400">{searchTerm}</span>"</span>
                  )}
                </p>
              ) : (
                <p>Showing all <span className="text-white font-medium">{courses.length}</span> courses</p>
              )}
            </div>
            
            {/* Sort controls */}
            <div className="flex items-center">
              <span className="text-gray-400 mr-2 hidden md:inline">Sort by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSort('id')}
                  className={`px-3 py-1.5 rounded flex items-center text-sm ${
                    sortConfig.key === 'id' 
                      ? 'bg-blue-600/30 text-blue-300' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ID
                  {sortConfig.key === 'id' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('name')}
                  className={`px-3 py-1.5 rounded flex items-center text-sm ${
                    sortConfig.key === 'name' 
                      ? 'bg-blue-600/30 text-blue-300' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Name
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('count')}
                  className={`px-3 py-1.5 rounded flex items-center text-sm ${
                    sortConfig.key === 'count' 
                      ? 'bg-blue-600/30 text-blue-300' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Count
                  {sortConfig.key === 'count' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Pagination controls - only show if we have multiple pages */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mb-6">
              <button
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="px-4 py-1 bg-gray-800/50 text-gray-300 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          )}
          
          {/* No results state */}
          {filteredCourses.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-900/20 flex items-center justify-center mb-4">
                <FaSearch className="h-8 w-8 text-blue-500/70" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No courses found</h3>
              <p className="text-gray-400 max-w-md">
                {searchTerm ? 
                  `We couldn't find any courses matching "${searchTerm}". Try a different search term or add a new course.` :
                  "There are no courses yet. Click 'Add Course' to create your first course."
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-blue-600/30 text-blue-300 rounded-lg hover:bg-blue-600/50 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
          
          {/* Course grid */}
          {filteredCourses.length > 0 && (
            <CourseGrid courses={paginatedCourses} loading={loading} />
          )}
        </div>
      </div>
      
      {/* Modals */}
      <AddCourseModal 
        isOpen={showAddModal}
        onClose={() => !addingCourse && setShowAddModal(false)}
        courseName={newCourseName}
        setCourseName={setNewCourseName}
        onSubmit={handleAddCourse}
        isLoading={addingCourse || bulkActionLoading}
      />
      
      <BulkAddModal 
        isOpen={showBulkModal}
        onClose={() => !addingBulkCourses && setShowBulkModal(false)}
        courseNames={bulkCourseNames}
        setCourseNames={setBulkCourseNames}
        onSubmit={handleAddMultipleCourses}
        isLoading={addingBulkCourses || bulkActionLoading}
      />
      
      {/* Notifications */}
      <Notification 
        type="success"
        message={success}
        onDismiss={() => setSuccess('')}
      />
      
      <Notification 
        type="error"
        message={error}
        onDismiss={() => setError('')}
      />
    </div>
  );
}

export default ManageCourses;