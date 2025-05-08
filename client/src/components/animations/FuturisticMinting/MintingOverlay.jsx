import React, { useEffect, useState } from 'react';
import { useMintingAnimation } from './AnimationContext';
import { ANIMATION_STAGES } from './AnimationContext';
import DoorSystem from './DoorSystem';
import SmokeEffect from './SmokeEffect';
import CertificateReveal from './CertificateReveal';
import HolographicUI from './HolographicUI';

const MintingOverlay = () => {
  const { stage, isActive, resetAnimation } = useMintingAnimation();
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Mark user interaction
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);
  
  // Don't render if not active
  if (!isActive) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-slate-900/90 to-slate-950/95 z-0"></div>
      
      {/* Content container */}
      <div className="relative w-full h-full max-w-6xl mx-auto">
        {/* Animation components */}
        <SmokeEffect />
        <DoorSystem />
        <CertificateReveal />
        <HolographicUI />
      </div>
      
      {/* User interaction notice - shown if no interaction yet */}
      {!hasInteracted && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm cursor-pointer"
             onClick={() => setHasInteracted(true)}>
          <div className="text-center p-8 bg-slate-800/80 rounded-lg border border-blue-500/30 max-w-md">
            <div className="text-blue-300 text-xl mb-4 font-bold">Click to Enable Animation</div>
            <p className="text-blue-200/70 mb-4">
              Click anywhere to continue with the animation
            </p>
            <button 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onClick={() => setHasInteracted(true)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Skip button (only visible after minting starts) */}
      {stage !== ANIMATION_STAGES.IDLE && stage !== ANIMATION_STAGES.COMPLETE && (
        <button 
          className="
            absolute bottom-6 right-6 z-50
            px-4 py-1.5
            bg-slate-800/50 hover:bg-slate-700/60
            text-blue-300 text-xs
            font-mono rounded
            border border-blue-500/20
            transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
          "
          onClick={resetAnimation}
        >
          SKIP
        </button>
      )}
    </div>
  );
};

export default MintingOverlay; 