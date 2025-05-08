import React from 'react';
import { FaCheck, FaTimes, FaFire, FaBan } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';

const BatchActionBar = ({
  selectedCount = 0,
  selectedCertificates = [],
  onApprove,
  onCancel,
  onBurn,
  onClear,
  onRequestBurnClick,
  clearSelection,
  bulkVerifyCertificates,
  bulkActionLoading,
  hasEligibleForBurn = false,
  hasPendingRequests = false,
  isInstitute = false
}) => {
  if (selectedCertificates.length === 0 && selectedCount === 0) return null;
  
  const count = selectedCertificates.length || selectedCount;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 rounded-lg shadow-lg border border-violet-500/20 py-3 px-5 flex items-center">
      <div className="flex items-center mr-4">
        <div className="bg-violet-600 h-6 w-6 rounded-full flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">{count}</span>
        </div>
        <span className="text-white font-medium">certificates selected</span>
      </div>
      
      <div className="flex space-x-3">
        {/* Show verify button if bulkVerifyCertificates is provided */}
        {bulkVerifyCertificates && (
          <button
            onClick={bulkVerifyCertificates}
            disabled={bulkActionLoading}
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-4 rounded-md flex items-center transition-colors disabled:opacity-50"
          >
            {bulkActionLoading ? (
              <>
                <FuturisticSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaCheck className="mr-2" />
                Verify Selected
              </>
            )}
          </button>
        )}
        
        {/* Existing approve button */}
        {hasPendingRequests && onApprove && (
          <button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-4 rounded-md flex items-center transition-colors"
          >
            <FaCheck className="mr-2" />
            Approve Selected
          </button>
        )}
        
        {/* Existing cancel button */}
        {hasPendingRequests && onCancel && (
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-4 rounded-md flex items-center transition-colors"
          >
            <FaBan className="mr-2" />
            Cancel Requests
          </button>
        )}
        
        {/* Existing burn button */}
        {hasEligibleForBurn && onBurn && (
          <button
            onClick={onBurn}
            className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-4 rounded-md flex items-center transition-colors"
          >
            <FaFire className="mr-2" />
            Burn Eligible
          </button>
        )}
        
        {/* NEW: Request Burn Button */}
        {onRequestBurnClick && (isInstitute || true) && (
          <button
            onClick={onRequestBurnClick}
            className="bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-4 rounded-md flex items-center transition-colors"
          >
            <FaFire className="mr-2" />
            Request Burn
          </button>
        )}
        
        {/* Clear button */}
        <button
          onClick={clearSelection || onClear}
          className="bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-4 rounded-md flex items-center transition-colors"
        >
          <FaTimes className="mr-2" />
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default BatchActionBar; 