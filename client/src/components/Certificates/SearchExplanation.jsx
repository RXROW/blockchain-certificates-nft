import React from 'react';

const SearchExplanation = () => {
  return (
    <div className="mb-6 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="text-xs text-gray-400">
        <span className="font-medium text-violet-400">Search tips:</span> You can search by certificate ID, course name, student address, or institution address. 
        Use the status filter to view only verified, pending, or revoked certificates.
      </div>
    </div>
  );
};

export default SearchExplanation; 