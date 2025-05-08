import React from 'react';
import { FaHourglassHalf, FaCheck, FaTrash } from 'react-icons/fa';

const BurnStatusIndicator = ({ certificate, burnTimelock }) => {
  // Skip if certificate isn't burn-related
  if (!certificate || (!certificate.burnRequested && !certificate.burnApproved)) {
    return null;
  }
  
  // Calculate when the burn will execute
  const getBurnExecutionTime = () => {
    if (!certificate.burnRequestTime || !burnTimelock) return null;
    
    const executionTime = new Date(certificate.burnRequestTime + (burnTimelock * 1000));
    
    // Format nicely
    return executionTime.toLocaleString();
  };
  
  const executionTime = getBurnExecutionTime();
  
  return (
    <div className="mt-2 border-t border-gray-700 pt-2">
      {certificate.burnApproved ? (
        <div className="flex items-center text-green-500">
          <FaCheck className="mr-2" />
          <span className="text-sm">Burn approved</span>
        </div>
      ) : certificate.burnRequested ? (
        <div className="flex items-center text-amber-500">
          <FaHourglassHalf className="mr-2" />
          <div>
            <span className="text-sm">Burn requested</span>
            {executionTime && (
              <div className="text-xs text-gray-400">
                Execution: {executionTime}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BurnStatusIndicator; 