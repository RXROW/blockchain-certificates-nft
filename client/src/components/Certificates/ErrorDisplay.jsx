import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;
  
  const showAddressHelp = error.toLowerCase().includes('address');
  
  return (
    <div className="mb-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-white">
      <div className="flex items-start">
        <FaExclamationTriangle className="text-red-400 mt-1 mr-3 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-red-400 mb-1">Error</h3>
          <p>{error}</p>
          {showAddressHelp && (
            <div className="mt-2 text-sm bg-gray-800/50 p-2 rounded border border-gray-700">
              <p className="font-medium text-violet-400 mb-1">Valid Address Format:</p>
              <p className="font-mono">0x + 40 hexadecimal characters (0-9, a-f)</p>
              <p className="mt-1">Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 