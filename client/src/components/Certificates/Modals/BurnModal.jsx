import React, { useState, useEffect } from 'react';
import { FaTrash, FaSpinner, FaClock, FaCheck, FaHourglassHalf, FaFire, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ButtonSpinner from '../../ui/ButtonSpinner';

const BurnModal = ({
  showBurnModal,
  selectedCertificate,
  burnReason,
  setBurnReason,
  burnTimelock,
  closeBurnModal,
  handleBurnRequest,
  handleCancelRequest,
  burnLoading,
  canDirectBurn,
  handleDirectBurn,
  isInstitute,
  onBurnAnimationStart
}) => {
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [directBurnSuccess, setDirectBurnSuccess] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [localBurnLoading, setLocalBurnLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Define max characters for burn reason
  const MAX_CHARS = 200;
  
  // Calculate remaining characters
  const remainingChars = MAX_CHARS - (burnReason?.length || 0);
  
  // Determine color based on remaining characters
  const getCounterColor = () => {
    if (remainingChars <= 0) return 'text-red-500 font-bold';
    if (remainingChars < 20) return 'text-yellow-400';
    return 'text-gray-400';
  };
  
  // Validate input whenever burn reason changes
  useEffect(() => {
    if (!burnReason || burnReason.trim() === '') {
      setValidationError('Please provide a reason for burn');
    } else if (burnReason.length > MAX_CHARS) {
      setValidationError(`Reason exceeds maximum of ${MAX_CHARS} characters`);
    } else {
      setValidationError('');
    }
  }, [burnReason]);
  
  // Format the timelock in days, hours, minutes
  const formatTimelock = (seconds) => {
    if (seconds === 0) return 'Immediate';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    return result.trim();
  };
  
  // Determine if this user can directly burn
  // Admins can always directly burn, institutions can burn their own certificates
  const canUserDirectBurn = canDirectBurn || 
    (isInstitute && selectedCertificate?.institution === window.ethereum?.selectedAddress);
  
  // Wrap the burn request handler to set our state
  const handleBurnRequestWithState = async () => {
    // Validate before submitting
    if (!burnReason || burnReason.trim() === '') {
      setValidationError('Please provide a reason for burn');
      return;
    }
    
    if (burnReason.length > MAX_CHARS) {
      setValidationError(`Reason exceeds maximum of ${MAX_CHARS} characters`);
      return;
    }
    
    try {
      setLocalBurnLoading(true);
      await handleBurnRequest();
      setRequestSubmitted(true);
    } catch (error) {
      console.error("Error in burn request:", error);
    } finally {
      setLocalBurnLoading(false);
    }
  };
  
  // Wrap the direct burn handler to set our state
  const handleDirectBurnWithState = async () => {
    // Validate before submitting
    if (!burnReason || burnReason.trim() === '') {
      setValidationError('Please provide a reason for burn');
      return;
    }
    
    if (burnReason.length > MAX_CHARS) {
      setValidationError(`Reason exceeds maximum of ${MAX_CHARS} characters`);
      return;
    }
    
    try {
      setDirectBurnSuccess(false);
      setLocalBurnLoading(true);
      
      // First start the animation and close the modal BEFORE transaction
      if (canUserDirectBurn && onBurnAnimationStart && !animationStarted) {
        onBurnAnimationStart(selectedCertificate);
        setAnimationStarted(true);
        
        // Close modal immediately so user can see the animation while transaction processes
        closeBurnModal();
      }
      
      // Execute the actual burn
      await handleDirectBurn();
      setDirectBurnSuccess(true);
      
    } catch (error) {
      console.error("Error in direct burn:", error);
      // Reset animation state if there was an error
      setAnimationStarted(false);
    } finally {
      setLocalBurnLoading(false);
    }
  };

  // Add a function to handle the cancel operation with state updates
  const handleCancelRequestWithState = async () => {
    try {
      setLocalBurnLoading(true);
      await handleCancelRequest();
      setRequestSubmitted(false); // Reset state to show form again
    } catch (error) {
      console.error("Error in cancel request:", error);
    } finally {
      setLocalBurnLoading(false);
    }
  };
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!showBurnModal) {
      // Small delay to prevent flashing during close animation
      setTimeout(() => {
        setRequestSubmitted(false);
        setDirectBurnSuccess(false);
        setAnimationStarted(false);
        setLocalBurnLoading(false);
        setValidationError('');
      }, 300);
    }
  }, [showBurnModal]);
  
  // Determine if loading state is active (either from parent or local)
  const isLoading = burnLoading || localBurnLoading;
  
  if (!showBurnModal) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 w-full max-w-md rounded-lg p-6 shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-500 flex items-center">
            <FaTrash className="mr-2" />
            {canUserDirectBurn ? "Burn Certificate" : "Request Certificate Burn"}
          </h3>
          <button
            onClick={closeBurnModal}
            className="text-gray-400 hover:text-gray-200"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        {/* Success message */}
        {(requestSubmitted || directBurnSuccess) ? (
          <div className="mb-6 bg-green-900/30 border border-green-600/30 rounded-lg p-4">
            <div className="flex items-center text-green-400 mb-2">
              <FaCheck className="mr-2" />
              <span className="font-semibold">
                {directBurnSuccess ? 'Certificate burned successfully!' : 'Burn request submitted successfully!'}
              </span>
            </div>
            
            {requestSubmitted && !directBurnSuccess && (
              <div className="mt-4">
                <div className="flex items-center text-amber-400 mb-2">
                  <FaHourglassHalf className="mr-2" />
                  <span className="font-medium">Timelock period has started</span>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  The request will be pending for {formatTimelock(burnTimelock)} before it can be executed.
                </p>
                <div className="flex space-x-3">
                  <Link 
                    to="/dashboard/burn-approvals" 
                    className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors text-white text-sm"
                    onClick={closeBurnModal}
                  >
                    <FaFire className="mr-2" />
                    View Burn Requests
                  </Link>
                  
                  {handleCancelRequest && (
                    <button
                      onClick={handleCancelRequestWithState}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white text-sm"
                    >
                      {isLoading ? (
                        <div className="mr-2">
                          <ButtonSpinner color="red" size="sm" />
                        </div>
                      ) : (
                        <FaTimes className="mr-2" />
                      )}
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {directBurnSuccess && (
              <div className="mt-3 flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaFire className="text-orange-500 text-5xl animate-pulse" />
                  </div>
                  <svg className="animate-spin-slow" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-red-500/30"
                      strokeDasharray="280"
                      strokeDashoffset="100"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                {canUserDirectBurn 
                  ? `You are about to permanently burn certificate #${selectedCertificate?.id}.` 
                  : `You are requesting to burn certificate #${selectedCertificate?.id}.`}
              </p>
              
              {!canUserDirectBurn && burnTimelock > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-3 mb-4 flex items-start">
                  <FaClock className="text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-medium">Timelock Period</p>
                    <p className="text-gray-300 text-sm">
                      This request will have a waiting period of {formatTimelock(burnTimelock)} before it can be executed.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-gray-400">Reason for burn {canUserDirectBurn ? "" : "request"}</label>
                <span className={`text-xs ${getCounterColor()}`}>
                  {remainingChars} characters remaining
                </span>
              </div>
              <textarea
                className={`w-full bg-gray-700 text-white rounded p-3 border ${validationError ? 'border-red-500' : 'border-gray-600'} focus:border-violet-500 focus:outline-none`}
                value={burnReason}
                onChange={(e) => setBurnReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason for burning this certificate..."
                maxLength={MAX_CHARS + 5} // Allow slight overflow for UX but show error
              />
              
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
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                onClick={closeBurnModal}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 flex items-center transition-colors disabled:opacity-50"
                onClick={canUserDirectBurn ? handleDirectBurnWithState : handleBurnRequestWithState}
                disabled={!!validationError || !burnReason.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2">
                      <ButtonSpinner color="red" size="sm" />
                    </div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    {canUserDirectBurn ? "Burn Certificate" : "Request Burn"}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BurnModal; 