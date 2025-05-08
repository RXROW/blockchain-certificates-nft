import React, { useEffect } from 'react';
import { useMintingAnimation } from './AnimationContext';
import { ANIMATION_STAGES } from './AnimationContext';

const DoorSystem = () => {
  const { stage, allowReducedMotion } = useMintingAnimation();

  // Determine door states based on animation stage
  const isClosing = stage === ANIMATION_STAGES.DOORS_CLOSING;
  const isClosed = [ANIMATION_STAGES.MINTING, ANIMATION_STAGES.MINTING_COMPLETE].includes(stage);
  const isOpening = [ANIMATION_STAGES.DOORS_OPENING, ANIMATION_STAGES.CERTIFICATE_REVEAL].includes(stage);
  const isOpen = stage === ANIMATION_STAGES.COMPLETE;

  // Basic transition without animation for reduced motion
  if (allowReducedMotion) {
    const doorVisibility = isClosed ? 'opacity-100' : 'opacity-0';
    
    return (
      <div className="absolute inset-0 z-20 transition-opacity duration-500 overflow-hidden">
        <div className={`flex w-full h-full ${doorVisibility}`}>
          <div className="w-1/2 h-full bg-slate-800" />
          <div className="w-1/2 h-full bg-slate-800" />
        </div>
      </div>
    );
  }

  // Full animation version
  return (
    <div className="absolute inset-0 z-20 overflow-hidden">
      <div className="flex w-full h-full">
        {/* Left Door */}
        <div 
          className={`
            w-1/2 h-full relative
            bg-gradient-to-br from-slate-700 to-slate-900 
            border-r border-blue-900/30
            shadow-[0_0_15px_rgba(0,100,255,0.2)]
            transition-transform duration-1500 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isClosing ? 'animate-door-close-left' : ''}
            ${isClosed ? 'translate-x-0' : ''}
            ${isOpening ? 'animate-door-open-left' : ''}
            ${isOpen ? '-translate-x-full' : ''}
          `}
        >
          {/* Door Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[20%] bottom-[20%] left-[10%] right-[10%] border border-blue-400/30 rounded-md" />
            <div className="absolute top-[30%] bottom-[30%] left-[20%] right-[20%] border border-blue-400/20 rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-blue-400/20" />
            </div>
          </div>
          
          {/* Glass Reflection Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          
          {/* Light Edge */}
          <div className="absolute top-0 bottom-0 right-0 w-px bg-blue-400/30" />
        </div>
        
        {/* Right Door */}
        <div 
          className={`
            w-1/2 h-full relative
            bg-gradient-to-bl from-slate-700 to-slate-900
            border-l border-blue-900/30
            shadow-[0_0_15px_rgba(0,100,255,0.2)]
            transition-transform duration-1500 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isClosing ? 'animate-door-close-right' : ''}
            ${isClosed ? 'translate-x-0' : ''}
            ${isOpening ? 'animate-door-open-right' : ''}
            ${isOpen ? 'translate-x-full' : ''}
          `}
        >
          {/* Door Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[20%] bottom-[20%] left-[10%] right-[10%] border border-blue-400/30 rounded-md" />
            <div className="absolute top-[30%] bottom-[30%] left-[20%] right-[20%] border border-blue-400/20 rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-blue-400/20" />
            </div>
          </div>
          
          {/* Glass Reflection Effect */}
          <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-transparent" />
          
          {/* Light Edge */}
          <div className="absolute top-0 bottom-0 left-0 w-px bg-blue-400/30" />
        </div>
      </div>
    </div>
  );
};

export default DoorSystem; 