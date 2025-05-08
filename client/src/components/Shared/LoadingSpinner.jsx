import React from 'react';

/**
 * Loading spinner component with customizable size and text
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner: 'small', 'medium', or 'large'
 * @param {string} props.text - Optional loading text to display
 * @param {string} props.color - Optional color for the spinner
 * @param {string} props.className - Optional additional CSS classes
 */
const LoadingSpinner = ({ size = 'medium', text, color = 'text-blue-500', className = '' }) => {
  // Determine spinner size based on the prop
  let spinnerSize;
  switch (size) {
    case 'small':
      spinnerSize = 'w-4 h-4 border-2';
      break;
    case 'large':
      spinnerSize = 'w-12 h-12 border-4';
      break;
    case 'medium':
    default:
      spinnerSize = 'w-8 h-8 border-3';
      break;
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${spinnerSize} ${color} border-t-transparent border-solid rounded-full animate-spin`}
        role="status" 
        aria-label="Loading"
      />
      {text && (
        <span className="ml-3 text-gray-300">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
