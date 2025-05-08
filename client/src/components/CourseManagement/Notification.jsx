import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const Notification = ({ type, message, onDismiss }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);
  
  if (!message) return null;
  
  const isSuccess = type === 'success';
  
  return (
    <div 
      className={`animate-fade-in-slide-up fixed bottom-8 right-8 z-50 rounded-lg shadow-lg max-w-md px-6 py-4 flex items-center
      ${isSuccess ? 'bg-gradient-to-r from-green-900/90 to-green-800/90 backdrop-blur-sm border border-green-700/50' : 
                    'bg-gradient-to-r from-red-900/90 to-red-800/90 backdrop-blur-sm border border-red-700/50'}`}
    >
      <div className={`flex-shrink-0 mr-3 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
        {isSuccess ? <FaCheckCircle size={24} /> : <FaExclamationTriangle size={24} />}
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">
          {message}
        </p>
      </div>
      <button 
        onClick={onDismiss}
        className="ml-4 text-gray-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Notification; 