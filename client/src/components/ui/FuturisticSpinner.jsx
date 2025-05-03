import React from 'react';

const FuturisticSpinner = ({ size = 'md', color = 'violet', className = '' }) => {
  // Size mapping
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Color mapping
  const colorMap = {
    violet: 'text-violet-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    white: 'text-white'
  };

  const sizeClass = sizeMap[size] || sizeMap.md;
  const colorClass = colorMap[color] || colorMap.violet;

  return (
    <div className={`${sizeClass} ${className} relative`} role="status" aria-label="Loading">
      {/* Outer ring */}
      <div className={`absolute inset-0 ${colorClass} opacity-20 rounded-full border-4 border-current`}></div>
      
      {/* Spinning middle ring with glow effect */}
      <div className={`absolute inset-0 ${colorClass} rounded-full border-4 border-current border-t-transparent animate-spin`} 
           style={{ filter: 'drop-shadow(0 0 2px currentColor)' }}></div>
      
      {/* Inner pulsing dot */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={`${colorClass} rounded-full animate-pulse-fast`} 
             style={{ width: '30%', height: '30%', filter: 'drop-shadow(0 0 3px currentColor)' }}></div>
      </div>
      
      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-orbit">
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${colorClass} rounded-full`} 
             style={{ width: '12%', height: '12%', filter: 'drop-shadow(0 0 2px currentColor)' }}></div>
      </div>
      
      <div className="absolute inset-0 animate-orbit-delayed-1">
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${colorClass} rounded-full`}
             style={{ width: '10%', height: '10%', filter: 'drop-shadow(0 0 2px currentColor)' }}></div>
      </div>
      
      <div className="absolute inset-0 animate-orbit-delayed-2">
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${colorClass} rounded-full`}
             style={{ width: '8%', height: '8%', filter: 'drop-shadow(0 0 2px currentColor)' }}></div>
      </div>
      
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default FuturisticSpinner; 