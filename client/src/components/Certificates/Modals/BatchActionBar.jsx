import React from 'react';
import { FaCheck } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';

const BatchActionBar = ({
  selectedCertificates,
  clearSelection,
  bulkVerifyCertificates,
  bulkActionLoading
}) => {
  if (selectedCertificates.length === 0) return null;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gray-800/95 border-t border-gray-700 p-3 flex justify-between items-center z-10">
      <div className="flex items-center">
        <span className="mr-2">
          {selectedCertificates.length} certificate{selectedCertificates.length !== 1 ? 's' : ''} selected
        </span>
        <button 
          onClick={clearSelection}
          className="text-sm text-gray-400 hover:text-white mx-2"
        >
          Clear selection
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={bulkVerifyCertificates}
          disabled={bulkActionLoading || !selectedCertificates.some(c => !c.isVerified && !c.isRevoked)}
          className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          {bulkActionLoading ? (
            <div className="mr-1 h-4 w-4">
              <FuturisticSpinner size="sm" color="white" />
            </div>
          ) : <FaCheck className="mr-1" />}
          Verify Selected
        </button>
        {/* Add more batch actions as needed */}
      </div>
    </div>
  );
};

export default BatchActionBar; 