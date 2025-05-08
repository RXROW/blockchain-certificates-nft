import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorDisplay = ({ error }) => {
  if (!error) return null;
  
  const showAddressHelp = error.toLowerCase().includes('address');
  
  return (
    <div className="mb-2 md:mb-4 p-2 md:p-4 bg-red-900/30 border border-red-800 rounded-lg text-white max-w-full w-full">
      <div className="flex items-start flex-wrap">
        <FaExclamationTriangle className="text-red-400 mt-1 mr-2 md:mr-3 flex-shrink-0 text-lg md:text-xl" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-red-400 mb-1 text-base md:text-lg">Error</h3>
          <p className="break-words text-sm md:text-base">{error}</p>
          {showAddressHelp && (
            <div className="mt-2 text-xs md:text-sm bg-gray-800/50 p-2 rounded border border-gray-700 overflow-x-auto">
              <p className="font-medium text-violet-400 mb-1">Valid Address Format:</p>
              <p className="font-mono">0x + 40 hexadecimal characters (0-9, a-f)</p>
              <p className="mt-1 break-all">Example:<br/><span className="font-mono text-violet-300">0x71C7656EC7ab88b098defB751B7401B5f6d8976F</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 