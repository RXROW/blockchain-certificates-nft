import React from 'react';
import { useMintingAnimation } from './AnimationContext';
import { ANIMATION_STAGES } from './AnimationContext';

const SmokeEffect = () => {
  const { stage, allowReducedMotion } = useMintingAnimation();
  
  // Determine if smoke should be visible and its state
  const isVisible = [
    ANIMATION_STAGES.MINTING,
    ANIMATION_STAGES.MINTING_COMPLETE,
    ANIMATION_STAGES.DOORS_OPENING
  ].includes(stage);
  
  const isPulsing = stage === ANIMATION_STAGES.MINTING;
  const isRevealing = stage === ANIMATION_STAGES.MINTING_COMPLETE;
  
  // Skip effects for reduced motion
  if (allowReducedMotion) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Central glow effect - increased size and opacity */}
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-64 h-64 rounded-full 
          bg-blue-500/20 
          filter blur-xl 
          transition-all duration-1000 
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-70'}
          ${isPulsing ? 'animate-smoke-pulse' : ''}
          ${isRevealing ? 'animate-smoke-puff' : ''}
        `}
      />
      
      {/* Secondary inner glow - increased intensity */}
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-40 h-40 rounded-full 
          bg-indigo-500/25 
          filter blur-lg 
          transition-all duration-1000 
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-80'}
          ${isPulsing ? 'animate-smoke-pulse' : ''}
          ${isRevealing ? 'animate-smoke-puff' : ''}
        `}
      />
      
      {/* Core glow - brightest part */}
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-20 h-20 rounded-full 
          bg-indigo-400/30
          filter blur-md
          transition-all duration-1000 
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-90'}
          ${isPulsing ? 'animate-pulse' : ''}
          ${isRevealing ? 'animate-smoke-puff' : ''}
        `}
      />
      
      {/* Accent particles - top left */}
      <div 
        className={`
          absolute left-1/4 top-1/4
          w-12 h-12 rounded-full 
          bg-blue-400/40
          filter blur-md
          transition-all duration-1000 delay-100
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-70'}
          ${isPulsing ? 'animate-pulse' : ''}
        `}
      />
      
      {/* Accent particles - bottom right */}
      <div 
        className={`
          absolute right-1/4 bottom-1/4
          w-10 h-10 rounded-full 
          bg-indigo-400/40
          filter blur-md
          transition-all duration-1000 delay-200
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-70'}
          ${isPulsing ? 'animate-pulse' : ''}
        `}
      />

      {/* Accent particles - top right */}
      <div 
        className={`
          absolute right-1/3 top-1/3
          w-8 h-8 rounded-full 
          bg-purple-400/30
          filter blur-md
          transition-all duration-1000 delay-300
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-60'}
          ${isPulsing ? 'animate-pulse-fast' : ''}
        `}
      />

      {/* Accent particles - bottom left */}
      <div 
        className={`
          absolute left-1/3 bottom-1/3
          w-9 h-9 rounded-full 
          bg-blue-300/40
          filter blur-md
          transition-all duration-1000 delay-150
          ${!isVisible ? 'opacity-0 scale-0' : 'opacity-60'}
          ${isPulsing ? 'animate-pulse-fast' : ''}
        `}
      />
      
      {/* Small floating particles - more of them */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i}
            className={`
              absolute rounded-full 
              bg-blue-300/60
              filter blur-sm
              transition-all duration-1000 delay-${i % 5 * 100}
              ${!isVisible ? 'opacity-0' : 'opacity-60'}
              animate-float
            `}
            style={{
              width: `${Math.random() * 12 + 6}px`,
              height: `${Math.random() * 12 + 6}px`,
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SmokeEffect; 