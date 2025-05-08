import React, { useState } from 'react';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';

const CourseSearchBox = ({
  courseNameFilter,
  setCourseNameFilter,
  handleCourseNameSearch
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const onSearch = async () => {
    setLocalLoading(true);
    await handleCourseNameSearch();
    setLocalLoading(false);
  };

  return (
    <div className="mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-white">Search by Course Name</h3>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter course name"
          value={courseNameFilter}
          onChange={(e) => setCourseNameFilter(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {/* Course Name search button */}
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
            <span>Search Course</span>
          )}
        </button>
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Enter a course name to find all certificates issued for that course
      </p>
    </div>
  );
};

export default CourseSearchBox; 