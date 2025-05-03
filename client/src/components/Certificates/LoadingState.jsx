import React from 'react';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';

const LoadingState = () => {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <div className="relative mb-6">
        <FuturisticSpinner size="xl" color="violet" />
      </div>
      <span className="text-xl text-gray-300">Loading certificates...</span>
      <p className="text-gray-500 mt-2">Please wait while we retrieve your certificates</p>
    </div>
  );
};

export default LoadingState; 