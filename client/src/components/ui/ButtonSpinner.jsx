import React from 'react';

const ButtonSpinner = ({ color = 'white', size = 'sm' }) => {
  // Map colors to Tailwind classes
  const colorClasses = {
    white: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400'
  };
  
  // Sizing
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const colorClass = colorClasses[color] || colorClasses.white;
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  
  return (
    <div className={`${sizeClass} relative`}>
      {/* Outer glowing ring */}
      <div 
        className={`absolute inset-0 rounded-full border border-current opacity-80 animate-spin-reverse ${colorClass}`}
        style={{ boxShadow: '0 0 5px currentColor', filter: 'blur(0.3px)' }}
      ></div>
      
      {/* Inner ring */}
      <div 
        className={`absolute inset-[2px] rounded-full border border-current border-t-transparent animate-spin ${colorClass}`}
      ></div>
      
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${colorClass}`}
          style={{ boxShadow: '0 0 4px currentColor' }}
        ></div>
      </div>
      
      <span className="sr-only">Loading...</span>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          to { transform: rotate(-360deg); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.6s linear infinite;
        }
        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default ButtonSpinner; 