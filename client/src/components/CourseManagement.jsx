import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { contractAddress, contractABI } from '../config/contracts';
import LoadingSpinner from './Shared/LoadingSpinner';

const ITEMS_PER_PAGE = 12;
const COURSES_CACHE_KEY = 'courses_cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

const CourseManagement = ({ isInstitution }) => {
  const [courses, setCourses] = useState([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [showModal, setShowModal] = useState(false);

  // Refs
  const courseListRef = useRef(null);

  // Initialize with cached data if available
  useEffect(() => {
    const cachedData = localStorage.getItem(COURSES_CACHE_KEY);

    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

        if (!isExpired && Array.isArray(data) && data.length > 0) {
          setCourses(data);
          console.log('Loaded from cache:', data.length, 'courses');
          // Still fetch fresh data in the background
          fetchCourses(true);
          return;
        }
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }

    // No valid cache, load fresh data
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!isInstitution) {
      setError('Only institutions can manage courses');
    }
  }, [isInstitution]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Modal keyboard handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [showModal]);

  // Efficient course fetching
  const fetchCourses = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }

      setError('');

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );

      // Get courses directly
      // First get certificates to find course IDs
      const totalSupply = await contract.totalSupply();
      const totalCertificates = Number(totalSupply);

      // Set to hold unique course IDs
      const uniqueCourseIds = new Set();

      // Get course IDs from certificates (up to 100 certificates)
      const maxCertificatesToCheck = Math.min(totalCertificates, 100);
      for (let i = 0; i < maxCertificatesToCheck; i++) {
        try {
          const tokenId = await contract.tokenByIndex(i);
          const cert = await contract.getCertificate(tokenId);
          uniqueCourseIds.add(cert[2].toString());
        } catch (err) {
          console.warn(`Error getting certificate at index ${i}:`, err);
        }
      }

      // Check for courses without certificates
      // Try to find up to 100 courses
      for (let i = 1; i <= 100; i++) {
        try {
          const courseName = await contract.getCourseName(i.toString());
          if (courseName && courseName.trim()) {
            uniqueCourseIds.add(i.toString());
          }
        } catch (err) {
          // Ignore errors - just means this course ID doesn't exist
        }
      }

      // Process each course ID to get name
      const allCourses = [];
      for (const courseId of uniqueCourseIds) {
        try {
          const courseName = await contract.getCourseName(courseId);
          if (courseName && courseName.trim()) {
            allCourses.push({
              id: courseId,
              name: courseName
            });
          }
        } catch (err) {
          console.warn(`Error getting course name for ID ${courseId}:`, err);
        }
      }

      // Sort courses by ID
      allCourses.sort((a, b) => Number(a.id) - Number(b.id));

      // Update state and cache
      setCourses(allCourses);

      // Cache the fetched data
      localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
        data: allCourses,
        timestamp: Date.now()
      }));

      console.log('Fetched and cached', allCourses.length, 'courses');
    } catch (err) {
      setError('Failed to fetch courses: ' + err.message);
      console.error('Error fetching courses:', err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const validateInput = () => {
    const errors = {};
    let isValid = true;

    // Validate course name
    if (!newCourseName) {
      errors.courseName = 'Course name is required';
      isValid = false;
    } else if (newCourseName.trim().length === 0) {
      errors.courseName = 'Course name cannot be empty';
      isValid = false;
    } else if (newCourseName.trim().length < 3) {
      errors.courseName = 'Course name must be at least 3 characters long';
      isValid = false;
    } else {
      // Check if course name already exists (case-insensitive)
      const exists = courses.some(course =>
        course.name.toLowerCase() === newCourseName.trim().toLowerCase()
      );
      if (exists) {
        errors.courseName = 'Course name already exists';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setValidationErrors({});

      // Validate before proceeding with transaction
      const isValid = validateInput();
      if (!isValid) {
        return; // Stop if validation fails
      }

      setActionLoading(true);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        signer
      );

      // We need to update the course name using setCourseName instead of addCourse
      // First, get the highest course ID to determine the next one
      let highestCourseId = 0;
      if (courses.length > 0) {
        // Find the highest existing course ID
        highestCourseId = Math.max(...courses.map(c => Number(c.id)));
      }

      // Use the next available ID
      const newCourseId = (highestCourseId + 1).toString();

      // Set the course name
      const tx = await contract.setCourseName(newCourseId, newCourseName.trim());
      await tx.wait();

      setSuccess('Course added successfully');
      setNewCourseName('');

      // Add the new course to the list without reloading
      setCourses(prevCourses => {
        const newCourses = [
          ...prevCourses,
          { id: newCourseId, name: newCourseName.trim() }
        ].sort((a, b) => Number(a.id) - Number(b.id));

        // Update cache
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
          data: newCourses,
          timestamp: Date.now()
        }));

        return newCourses;
      });

      // Close the modal
      setShowModal(false);
    } catch (err) {
      console.error('Error adding course:', err);
      // Handle user rejected transaction
      if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.message.includes('User denied')) {
        setError('Transaction was cancelled by user');
      } else if (err.message.includes("Caller is not an institution")) {
        setError('Only institutions can add or modify courses');
      } else {
        setError('Failed to add course: ' + err.message);
      }

      // Don't close modal on error unless it was a user cancellation
      if (err.code === 'ACTION_REJECTED' || err.code === 4001 || err.message.includes('User denied')) {
        setShowModal(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Debounced search handler
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Handle sort
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filtered courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;

    const searchLower = searchTerm.toLowerCase();
    return courses.filter(course =>
      course.id.toString().includes(searchTerm) ||
      course.name.toLowerCase().includes(searchLower)
    );
  }, [courses, searchTerm]);

  // Sorted courses based on sort config
  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc'
          ? Number(a.id) - Number(b.id)
          : Number(b.id) - Number(a.id);
      } else {
        return sortConfig.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
  }, [filteredCourses, sortConfig]);

  // Paginated courses
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedCourses.slice(start, end);
  }, [sortedCourses, currentPage]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedCourses.length / ITEMS_PER_PAGE));
  }, [sortedCourses]);

  // Handle refresh courses
  const handleRefreshCourses = () => {
    fetchCourses();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Course Management</h2>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg ${sortConfig.key === 'id'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  onClick={() => handleSort('id')}
                >
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${sortConfig.key === 'name'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  onClick={() => handleSort('name')}
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 flex items-center gap-2"
                  onClick={handleRefreshCourses}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="small" /> : '↻'}
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => setShowModal(true)}
                >
                  Add New Course
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500 text-white rounded-lg animate-fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-500 text-white rounded-lg animate-fade-in">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="medium" text="Loading courses..." />
            </div>
          ) : sortedCourses.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {searchTerm
                ? 'No courses match your search'
                : 'No courses found. Click "Add New Course" to create one.'}
            </div>
          ) : (
            <>
              <div className="text-gray-400 mb-4">
                Showing {paginatedCourses.length} of {sortedCourses.length} courses
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded">
                        ID: {course.id}
                      </span>
                    </div>
                    <div className="mt-2 text-white font-medium">{course.name}</div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    « First
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    ‹ Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next ›
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last »
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Add New Course</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => !actionLoading && setShowModal(false)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCourse}>
              <div className="mb-4">
                <label htmlFor="courseName" className="block text-gray-300 mb-2">
                  Course Name:
                </label>
                <input
                  type="text"
                  id="courseName"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Enter course name"
                  className={`w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.courseName ? 'border-red-500' : ''
                    }`}
                  required
                  autoFocus
                  disabled={actionLoading}
                />
                {validationErrors.courseName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.courseName}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  A unique ID will be automatically generated for this course
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                  onClick={() => !actionLoading && setShowModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="small" />
                      Adding...
                    </div>
                  ) : (
                    'Add Course'
                  )}
                </button>
              </div>

              {actionLoading && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span>⛓️</span>
                    <span>Transaction in progress...</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Please wait while your transaction is being processed on the blockchain.
                    This may take a few moments.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement; 