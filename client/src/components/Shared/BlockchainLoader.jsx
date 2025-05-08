import React from 'react';
import { FaCube, FaLink } from 'react-icons/fa';

/**
 * A reusable blockchain loading animation component
 * 
 * @param {Object} props
 * @param {string} props.message - Primary message to display (e.g. "Adding certificate...")
 * @param {string} props.subMessage - Secondary message to display (defaults to "Adding to blockchain...")
 * @param {string} props.variant - Color variant ('blue', 'purple', or 'green')
 * @param {boolean} props.fullscreen - Whether to display as fullscreen overlay
 * @param {boolean} props.modal - Whether to display with modal styling
 * @param {function} props.onClose - Optional close handler for modal variant
 */
const BlockchainLoader = ({ 
  message = "Processing transaction...", 
  subMessage = "Adding to blockchain...",
  variant = 'blue',
  fullscreen = false,
  modal = false,
  onClose = null
}) => {
  // Set color variants
  const colors = {
    blue: {
      block1: 'bg-blue-900/40',
      block2: 'bg-blue-900/60',
      block3: 'bg-blue-900/80',
      icon: 'text-blue-400',
      link: 'bg-blue-600/20 text-blue-400',
      line: 'bg-blue-500/40'
    },
    purple: {
      block1: 'bg-purple-900/40',
      block2: 'bg-purple-900/60',
      block3: 'bg-purple-900/80',
      icon: 'text-purple-400',
      link: 'bg-purple-600/20 text-purple-400',
      line: 'bg-purple-500/40'
    },
    green: {
      block1: 'bg-emerald-900/40',
      block2: 'bg-emerald-900/60',
      block3: 'bg-emerald-900/80',
      icon: 'text-emerald-400',
      link: 'bg-emerald-600/20 text-emerald-400',
      line: 'bg-emerald-500/40'
    }
  };
  
  const colorSet = colors[variant] || colors.blue;
  
  // Animation content
  const animationContent = (
    <div className="flex flex-col items-center">
      {/* Blockchain animation */}
      <div className="relative flex items-center mb-6 w-64">
        <div className={`w-12 h-12 ${colorSet.block1} rounded-lg flex items-center justify-center animate-pulse-glow`}>
          <FaCube className={`${colorSet.icon} text-lg`} />
        </div>
        <div className={`w-8 mx-1 h-0.5 ${colorSet.line}`}></div>
        <div className={`w-12 h-12 ${colorSet.block2} rounded-lg flex items-center justify-center animate-pulse-glow`} style={{ animationDelay: '0.2s' }}>
          <FaCube className={`${colorSet.icon} text-lg`} />
        </div>
        <div className={`w-8 mx-1 h-0.5 ${colorSet.line}`}></div>
        <div className={`w-12 h-12 ${colorSet.block3} rounded-lg flex items-center justify-center animate-pulse-glow`} style={{ animationDelay: '0.4s' }}>
          <FaCube className={`${colorSet.icon} text-lg`} />
        </div>
        <div className="absolute top-0 left-0 w-full flex justify-center -mt-6">
          <div className={`px-3 py-1 ${colorSet.link} rounded-full text-xs flex items-center`}>
            <FaLink className="mr-1" size={10} />
            <span>Transaction</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-gray-300 text-lg font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-1">{subMessage}</p>
      <div className="mt-4 text-xs text-gray-500 flex items-center animate-pulse">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span>Processing</span>
      </div>
    </div>
  );
  
  // Render different variants
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gray-900/80 p-10 rounded-xl border border-gray-800/50 shadow-xl">
          {animationContent}
        </div>
      </div>
    );
  }
  
  if (modal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div 
          className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden max-w-md w-full shadow-xl transform transition-all"
          onClick={e => e.stopPropagation()}
        >
          <div className={`absolute inset-0 ${variant === 'purple' ? 'bg-purple-500/20' : variant === 'green' ? 'bg-emerald-500/20' : 'bg-blue-500/20'} rounded-2xl blur-md -z-10`}></div>
          
          <div className="p-6">
            {onClose && (
              <div className="flex justify-end mb-4">
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="py-6">
              {animationContent}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default inline version
  return (
    <div className="py-6">
      {animationContent}
    </div>
  );
};

export default BlockchainLoader; 