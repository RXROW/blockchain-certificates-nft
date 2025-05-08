import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Animation stages
export const ANIMATION_STAGES = {
  IDLE: 'idle',
  DOORS_CLOSING: 'doorsClosing',
  MINTING: 'minting',
  MINTING_COMPLETE: 'mintingComplete',
  DOORS_OPENING: 'doorsOpening',
  CERTIFICATE_REVEAL: 'certificateReveal',
  COMPLETE: 'complete'
};

const AnimationContext = createContext(null);

export const MintingAnimationProvider = ({ children }) => {
  const [stage, setStage] = useState(ANIMATION_STAGES.IDLE);
  const [isActive, setIsActive] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  const [allowReducedMotion, setAllowReducedMotion] = useState(false);

  // Check user's motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAllowReducedMotion(prefersReducedMotion);
  }, []);

  // Start the animation sequence
  const startAnimation = useCallback((certData = null) => {
    // If certData is provided, we're in reveal mode
    if (certData) {
      // Update certificate data
      setCertificateData(certData);
      
      // If already in minting stage, skip to reveal
      if (stage === ANIMATION_STAGES.MINTING || stage === ANIMATION_STAGES.MINTING_COMPLETE) {
        // Trigger reveal sequence
        setStage(ANIMATION_STAGES.DOORS_OPENING);
        
        // Schedule final stages
        const revealDelay = 1500;
        const completeDelay = revealDelay + 2000;
        
        setTimeout(() => setStage(ANIMATION_STAGES.CERTIFICATE_REVEAL), revealDelay);
        setTimeout(() => setStage(ANIMATION_STAGES.COMPLETE), completeDelay);
        
        // Auto-reset after full sequence
        setTimeout(() => {
          resetAnimation();
        }, completeDelay + 3000);
      } else {
        // Start from the beginning if not already in minting
        setCertificateData(certData);
        setIsActive(true);
        setStage(ANIMATION_STAGES.DOORS_CLOSING);
        
        // Full sequence with certificate data
        const transitions = [
          { stage: ANIMATION_STAGES.MINTING, delay: 1500 },
          { stage: ANIMATION_STAGES.MINTING_COMPLETE, delay: 2000 },
          { stage: ANIMATION_STAGES.DOORS_OPENING, delay: 1000 },
          { stage: ANIMATION_STAGES.CERTIFICATE_REVEAL, delay: 1500 },
          { stage: ANIMATION_STAGES.COMPLETE, delay: 2000 }
        ];
        
        let cumulativeDelay = 0;
        transitions.forEach(({ stage, delay }) => {
          cumulativeDelay += delay;
          setTimeout(() => setStage(stage), cumulativeDelay);
        });
        
        // Auto-reset after full sequence
        setTimeout(() => {
          resetAnimation();
        }, cumulativeDelay + 3000);
      }
      
      return;
    }
    
    // Don't restart if already active in minting state
    if (isActive && (stage === ANIMATION_STAGES.MINTING || stage === ANIMATION_STAGES.DOORS_CLOSING)) {
      return;
    }
    
    // Regular animation start (no certificate data yet)
    setCertificateData(null);
    setIsActive(true);
    setStage(ANIMATION_STAGES.DOORS_CLOSING);
    
    // Only schedule transition to minting state - let the blockchain transaction 
    // determine when to move to next stages
    setTimeout(() => setStage(ANIMATION_STAGES.MINTING), 1500);
  }, [stage, isActive]);

  // Reset animation state
  const resetAnimation = useCallback(() => {
    setStage(ANIMATION_STAGES.IDLE);
    setIsActive(false);
  }, []);

  return (
    <AnimationContext.Provider 
      value={{ 
        stage, 
        isActive, 
        certificateData, 
        allowReducedMotion,
        startAnimation, 
        resetAnimation
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useMintingAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useMintingAnimation must be used within a MintingAnimationProvider');
  }
  return context;
}; 