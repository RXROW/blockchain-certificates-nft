import React, { useEffect } from 'react';
import { FaExclamationTriangle, FaTimesCircle, FaTimes, FaGasPump, FaEthereum } from 'react-icons/fa';

/**
 * A futuristic modal component for displaying blockchain transaction errors
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {Object} props.error - The error object from the transaction
 * @param {string} props.action - The action that was being performed (e.g., "revoke", "verify")
 */
const TransactionErrorModal = ({ show, onClose, error, action = 'transaction' }) => {
  // Auto-close after 10 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  // Parse the error to determine message and type
  const isRejected = error?.message?.includes('rejected') || 
                     error?.code === 'ACTION_REJECTED' ||
                     error?.reason === 'rejected';
                     
  const isGasError = error?.message?.includes('gas') || 
                    error?.message?.includes('fee');
                    
  const isContractError = error?.message?.includes('execution reverted') ||
                         error?.message?.includes('invalid opcode');
  
  // Extract a clean error message
  let errorTitle = 'Transaction Failed';
  let errorMessage = 'An error occurred while processing your transaction.';
  
  if (isRejected) {
    errorTitle = 'Transaction Rejected';
    errorMessage = 'You declined to sign the transaction in your wallet.';
  } else if (isGasError) {
    errorTitle = 'Gas Estimation Failed';
    errorMessage = 'The transaction could not be completed with the current gas settings.';
  } else if (isContractError) {
    errorTitle = 'Contract Error';
    errorMessage = 'The smart contract could not execute this operation.';
    
    // Extract the actual contract error message if available
    const revertMatch = error?.message?.match(/execution reverted: (.*?)(?:\(|$)/);
    if (revertMatch && revertMatch[1]) {
      errorMessage = revertMatch[1].trim();
    }
  }
  
  // Format action name for display
  const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="transaction-error-modal">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-900 border border-red-800 p-0 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-red-900/30 p-5 border-b border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-red-900 p-2 rounded-full">
                    {isRejected ? (
                      <FaTimesCircle className="h-6 w-6 text-red-400" aria-hidden="true" />
                    ) : (
                      <FaExclamationTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <h3 className="text-lg leading-6 font-semibold text-white">
                    {errorTitle}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="bg-gray-800/50 rounded-full p-1.5 text-gray-400 hover:text-white"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              {/* Data readout animation */}
              <div className="h-1 w-full bg-gray-800 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 animate-pulse-slow rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            
            {/* Error details */}
            <div className="p-5">
              <div className="mb-4">
                <div className="text-white mb-2">
                  <span className="text-red-400 font-mono">Failed to {action} certificate:</span>
                </div>
                <div className="text-gray-300 bg-gray-800/50 p-3 rounded-lg border border-gray-700 font-mono text-sm">
                  {errorMessage}
                </div>
              </div>
              
              {/* Transaction data */}
              <div className="mb-5 text-xs text-gray-400">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <FaEthereum className="mr-1 text-blue-400" />
                    <span>Network: Ethereum</span>
                  </div>
                  <div className="flex items-center">
                    <FaGasPump className="mr-1 text-yellow-400" />
                    <span>Status: {isRejected ? 'Rejected' : 'Failed'}</span>
                  </div>
                </div>
              </div>
              
              {/* Suggestion */}
              <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-300">
                {isRejected ? (
                  <p>You can try again by clicking the {formattedAction} button once more and approving the transaction in your wallet.</p>
                ) : isGasError ? (
                  <p>Try again with higher gas settings in your wallet, or wait for network congestion to decrease.</p>
                ) : (
                  <p>Please check if you have the necessary permissions for this operation or contact support if the issue persists.</p>
                )}
              </div>
              
              {/* Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-red-200 text-white transition rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default TransactionErrorModal; 