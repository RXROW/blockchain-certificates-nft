import React, { useEffect, useState } from 'react';
import { useMintingAnimation } from './AnimationContext';
import { ANIMATION_STAGES } from './AnimationContext';

const HolographicUI = () => {
  const { stage, allowReducedMotion } = useMintingAnimation();
  const [mintingProgress, setMintingProgress] = useState(0);
  
  // Update progress during minting
  useEffect(() => {
    if (stage === ANIMATION_STAGES.MINTING) {
      const interval = setInterval(() => {
        setMintingProgress(prev => {
          const next = prev + (Math.random() * 5);
          return next >= 100 ? 99 : next;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else if (stage === ANIMATION_STAGES.MINTING_COMPLETE) {
      setMintingProgress(100);
    } else if (stage === ANIMATION_STAGES.IDLE) {
      setMintingProgress(0);
    }
  }, [stage]);

  // Skip for reduced motion
  if (allowReducedMotion) {
    return (
      <div className={`
        absolute inset-0 z-40 pointer-events-none flex items-center justify-center
        transition-opacity duration-500
        ${stage === ANIMATION_STAGES.MINTING || stage === ANIMATION_STAGES.MINTING_COMPLETE ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="text-center text-blue-300 bg-slate-800/50 rounded px-4 py-2">
          <div className="font-mono text-sm">
            {stage === ANIMATION_STAGES.MINTING_COMPLETE 
              ? 'Certificate Ready' 
              : 'Minting Certificate...'}
          </div>
          {stage === ANIMATION_STAGES.MINTING && (
            <div className="mt-2 h-1 bg-slate-700 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${mintingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full animation version
  return (
    <>
      {/* Minting status */}
      <div className={`
        absolute inset-0 z-40 pointer-events-none flex items-center justify-center
        transition-all duration-500
        ${(stage === ANIMATION_STAGES.MINTING || stage === ANIMATION_STAGES.MINTING_COMPLETE) 
          ? 'opacity-100' 
          : 'opacity-0 translate-y-10'}
      `}>
        <div className="text-center">
          <div className="font-mono tracking-wider text-blue-300 text-2xl filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            {stage === ANIMATION_STAGES.MINTING_COMPLETE 
              ? 'CERTIFICATE SECURED' 
              : 'MINTING IN PROGRESS'}
          </div>
          
          {stage === ANIMATION_STAGES.MINTING && (
            <div className="mt-4 relative w-64 mx-auto">
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${mintingProgress}%` }}
                ></div>
              </div>
              
              {/* Progress percentage */}
              <div className="absolute -right-8 top-0 text-sm text-blue-300 font-mono">
                {Math.floor(mintingProgress)}%
              </div>
              
              {/* Processing text */}
              <div className="mt-2 text-xs text-blue-400/70 font-mono animate-pulse">
                Securing on blockchain...
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative HUD elements */}
      <div className={`
        absolute inset-0 z-35 pointer-events-none
        transition-opacity duration-500
        ${stage !== ANIMATION_STAGES.IDLE && stage !== ANIMATION_STAGES.COMPLETE ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Top left corner */}
        <div className="absolute top-5 left-5 flex items-center">
          <div className="h-4 w-4 rounded-full border border-blue-400/50 flex items-center justify-center">
            <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-2 text-xs font-mono text-blue-300/80">
            SYSTEM-01
          </div>
        </div>
        
        {/* Top right corner */}
        <div className="absolute top-5 right-5 text-xs font-mono text-blue-300/80 text-right">
          <div className="flex items-center justify-end space-x-2">
            <div>STATUS:</div>
            <div className="text-blue-400 animate-pulse">
              {stage === ANIMATION_STAGES.DOORS_CLOSING && 'INITIALIZING'}
              {stage === ANIMATION_STAGES.MINTING && 'PROCESSING'}
              {stage === ANIMATION_STAGES.MINTING_COMPLETE && 'COMPLETE'}
              {stage === ANIMATION_STAGES.DOORS_OPENING && 'FINALIZING'}
              {stage === ANIMATION_STAGES.CERTIFICATE_REVEAL && 'READY'}
            </div>
          </div>
          <div className="mt-1">
            SEC LEVEL: A7
          </div>
        </div>
        
        {/* Bottom scanning line - only during minting */}
        {stage === ANIMATION_STAGES.MINTING && (
          <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-20">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-blue-500/10"></div>
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scanline"></div>
          </div>
        )}
        
        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-blue-400/30"></div>
        <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-blue-400/30"></div>
        <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-blue-400/30"></div>
        <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-blue-400/30"></div>
      </div>
    </>
  );
};

export default HolographicUI; 