import React from 'react';

const SearchExplanation = () => {
  return (
    <div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-blue-300">Search Options</h3>
      <p className="text-sm text-gray-300 mb-2">
        There are two main ways to search for certificates:
      </p>
      <ul className="list-disc list-inside text-sm text-gray-300 ml-2 space-y-1">
        <li>
          <span className="font-semibold">Certificate Token ID</span>: Use the main search box to find a specific certificate by its unique token ID (e.g., "1", "2")
        </li>
        <li>
          <span className="font-semibold">Course Name</span>: Use the course name search box to find all certificates issued for a specific course
        </li>
      </ul>
    </div>
  );
};

export default SearchExplanation; 