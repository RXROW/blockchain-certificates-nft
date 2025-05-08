import React from 'react';
import { useMintingAnimation } from './AnimationContext';
import { ANIMATION_STAGES } from './AnimationContext';

const CertificateReveal = () => {
  const { stage, certificateData, allowReducedMotion } = useMintingAnimation();
  
  // Determine if certificate should be visible
  const isVisible = [
    ANIMATION_STAGES.CERTIFICATE_REVEAL,
    ANIMATION_STAGES.COMPLETE
  ].includes(stage);
  
  // Certificate image (fallback to placeholder if no data)
  const certificateImage = certificateData?.imageUrl;
  const certificateTitle = certificateData?.title || 'Certificate Generated';
  const certificateId = certificateData?.id || '#000000';
  
  // Simplified version for reduced motion
  if (allowReducedMotion) {
    return (
      <div className={`
        absolute inset-0 z-30 flex items-center justify-center
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="bg-slate-800/80 p-4 rounded-lg border border-blue-500/30 backdrop-blur-sm max-w-lg">
          {certificateImage ? (
            <img 
              src={certificateImage} 
              alt="Your Certificate" 
              className="w-full h-auto rounded"
            />
          ) : (
            <div className="w-full aspect-video bg-slate-700 rounded flex items-center justify-center">
              <span className="text-blue-200 font-mono">Certificate Generated</span>
            </div>
          )}
          <div className="mt-4 text-center text-blue-200">
            <h3 className="font-bold text-lg">{certificateTitle}</h3>
            <p className="text-sm text-blue-300/70">ID: {certificateId}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Full animation version
  return (
    <div className={`
      absolute inset-0 z-30 flex items-center justify-center
      transition-all duration-1000
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
    `}>
      {/* Certificate Container */}
      <div className="
        bg-gradient-to-b from-blue-900/20 to-purple-900/20 
        p-1 rounded-lg shadow-xl 
        backdrop-blur-sm 
        border border-blue-500/30
        animate-glow
      ">
        <div className="relative">
          {/* Certificate Image */}
          {certificateImage ? (
            <img 
              src={certificateImage} 
              alt="Your Certificate" 
              className="w-96 h-auto rounded shadow-inner"
            />
          ) : (
            <div className="
              w-96 h-64 
              bg-gradient-to-br from-blue-800/50 to-indigo-900/50 
              rounded 
              flex items-center justify-center
            ">
              <span className="text-blue-200 font-mono">{certificateTitle}</span>
            </div>
          )}
          
          {/* Reflection overlay */}
          <div className="
            absolute inset-0 
            rounded 
            pointer-events-none 
            bg-gradient-to-tr from-transparent via-blue-400/10 to-transparent
          "></div>
          
          {/* Scanning effect */}
          <div className="
            absolute inset-0 
            overflow-hidden 
            rounded 
            pointer-events-none
          ">
            <div className="
              absolute left-0 right-0 h-4 
              bg-gradient-to-b from-blue-400/30 to-transparent 
              animate-scan-line
            "></div>
          </div>
        </div>
        
        {/* Certificate Info */}
        <div className="mt-4 text-center text-blue-200 px-4 pb-4">
          <h3 className="font-bold text-lg tracking-wide">{certificateTitle}</h3>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <p className="text-sm text-blue-300/70 font-mono">ID: {certificateId}</p>
          </div>
          <div className="mt-2 text-xs text-blue-400/50">
            Successfully minted and secured on blockchain
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Radial light rays */}
        <div className="
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[200%] h-[200%]
          bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]
        "></div>
        
        {/* Corner accents */}
        <div className="absolute top-10 left-10 w-20 h-1 bg-blue-500/20 rotate-45"></div>
        <div className="absolute top-10 right-10 w-20 h-1 bg-blue-500/20 -rotate-45"></div>
        <div className="absolute bottom-10 left-10 w-20 h-1 bg-blue-500/20 -rotate-45"></div>
        <div className="absolute bottom-10 right-10 w-20 h-1 bg-blue-500/20 rotate-45"></div>
      </div>
    </div>
  );
};

export default CertificateReveal; 