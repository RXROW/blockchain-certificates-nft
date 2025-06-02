import React, { useState, useEffect } from 'react';
import { FaBan, FaExclamationTriangle } from 'react-icons/fa';
import ButtonSpinner from '../../../components/ui/ButtonSpinner';

const RevokeModal = ({
  showRevokeModal,
  selectedCertificate,
  revocationReason,
  setRevocationReason,
  closeRevokeModal,
  handleRevokeSubmit,
  revokeLoading
}) => {
  const [validationError, setValidationError] = useState('');
  const MAX_CHARS = 200;
  
  // Calculate remaining characters
  const remainingChars = MAX_CHARS - (revocationReason?.length || 0);
  
  // Determine color based on remaining characters
  const getCounterColor = () => {
    if (remainingChars <= 0) return 'text-red-500 font-bold';
    if (remainingChars < 20) return 'text-yellow-400';
    return 'text-gray-400';
  };
  
  // Validate input whenever revocation reason changes
  useEffect(() => {
    if (!revocationReason || revocationReason.trim() === '') {
      setValidationError('Please provide a reason for revocation');
    } else if (revocationReason.length > MAX_CHARS) {
      setValidationError(`Reason exceeds maximum of ${MAX_CHARS} characters`);
    } else {
      setValidationError('');
    }
  }, [revocationReason]);
  
  // Handle form submission with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!revocationReason || revocationReason.trim() === '') {
      setValidationError('Please provide a reason for revocation');
      return;
    }
    
    if (revocationReason.length > MAX_CHARS) {
      setValidationError(`Reason exceeds maximum of ${MAX_CHARS} characters`);
      return;
    }
    
    handleRevokeSubmit(e);
  };
  
  if (!showRevokeModal || !selectedCertificate) return null;

  // Check if the current certificate is loading (revokeLoading is an object keyed by certificate id)
  const isLoading = revokeLoading && revokeLoading[selectedCertificate.id];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-red-900/30 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-red-400">Revoke Certificate</h3>
          <button
            onClick={closeRevokeModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <p className="mb-4 text-gray-300">
          You are about to revoke certificate <span className="font-semibold">#{selectedCertificate.id}</span> for course <span className="font-semibold">{selectedCertificate.courseName}</span>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="revocationReason" className="block text-gray-400">Reason for Revocation</label>
              <span className={`text-xs ${getCounterColor()}`}>
                {remainingChars} characters remaining
              </span>
            </div>
            <textarea
              id="revocationReason"
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              className={`w-full px-4 py-2 bg-gray-700 border ${validationError ? 'border-red-500' : 'border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white`}
              rows={3}
              placeholder="Enter reason for revocation..."
              required
              maxLength={MAX_CHARS + 5} // Allow slight overflow for UX but show error
            ></textarea>
            
            {validationError && (
              <div className="mt-1 text-red-400 text-sm flex items-start">
                <FaExclamationTriangle className="mr-1 mt-0.5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            
            <p className="mt-2 text-xs text-gray-500">
              <span className="text-yellow-400">Note:</span> This reason will be permanently stored on the blockchain. 
              Keep it concise to minimize transaction costs.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeRevokeModal}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!!validationError || isLoading}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="mr-2">
                  <ButtonSpinner color="red" size="md" />
                </div>
              ) : (
                <FaBan className="mr-2" />
              )}
              Confirm Revocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevokeModal; 