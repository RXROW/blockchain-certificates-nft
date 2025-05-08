import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const BurningEffect = ({ 
  children, 
  isActive = false, 
  onBurnComplete = () => {}, 
  duration = 3500,
  className = ''
}) => {
  const [burning, setBurning] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [burnProgress, setBurnProgress] = useState(0);
  const [transactionDone, setTransactionDone] = useState(false);
  const animationRef = useRef(null);
  
  // Listen for transaction completion event
  useEffect(() => {
    // Add listener for transaction completion from parent
    const completionHandler = () => {
      setTransactionDone(true);
    };
    
    // Clean up
    return () => {
      // Remove listener if needed
    };
  }, []);
  
  // Function to animate the burn progress
  const animateBurning = (timestamp) => {
    if (!animationRef.current) {
      animationRef.current = timestamp;
    }
    
    const elapsed = timestamp - animationRef.current;
    
    // If transaction is done, accelerate to completion
    // Otherwise, burn slowly until transaction completes
    const progress = transactionDone 
      ? Math.min(elapsed / 1000, 1) // Faster completion after transaction 
      : Math.min(elapsed / 10000, 0.6); // Slower burn during transaction, max 60%
    
    setBurnProgress(progress);
    
    // Start fading out after transaction completion and 80% animation progress
    if (transactionDone && progress > 0.8 && opacity === 1) {
      setOpacity(0);
    }
    
    if (progress < 1) {
      requestAnimationFrame(animateBurning);
    } else {
      // Animation complete
      setTimeout(() => {
        onBurnComplete();
      }, 500); // Delay before callback to ensure visual effect completes
    }
  };
  
  useEffect(() => {
    if (isActive && !burning) {
      setBurning(true);
      
      // Start the animation frame loop
      requestAnimationFrame(animateBurning);
      
      return () => {
        // Cleanup if component unmounts
        animationRef.current = null;
      };
    }
  }, [isActive, burning, duration, onBurnComplete]);
  
  // When transaction completes, update the animation state
  useEffect(() => {
    if (burning && !transactionDone) {
      // Subscribe to transaction completion event here if needed
    }
  }, [burning, transactionDone]);
  
  // Manually trigger transaction complete (for testing)
  // In real usage, this would be triggered by the transaction complete event
  useEffect(() => {
    // This is a mock setup - in real usage, would be triggered by an event
    let timer;
    if (burning && !transactionDone) {
      timer = setTimeout(() => {
        // Mock transaction complete after 2-4 seconds
        setTransactionDone(true);
        
        // Restart animation reference for smooth transition
        animationRef.current = null;
      }, 2000 + Math.random() * 2000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [burning, transactionDone]);
  
  if (!burning) {
    return <div className={className}>{children}</div>;
  }
  
  // Calculate edge progress for non-uniform burning effect (edges burn faster)
  const topProgress = burnProgress * 1.2; // Top burns faster
  const leftProgress = burnProgress * 1.1;
  const rightProgress = burnProgress * 1.15;
  const bottomProgress = burnProgress * 0.9; // Bottom burns slower
  
  // Determine if we're in the initial burn phase (transaction processing)
  // or final burn phase (transaction complete)
  const initialPhase = !transactionDone;
  const finalPhase = transactionDone;
  
  return (
    <div
      className={`relative transition-opacity duration-1000 ${className}`}
      style={{ 
        opacity,
        transform: `scale(${initialPhase ? '1.02' : '1'})`,
        transition: 'transform 0.5s ease-out, opacity 1s ease-out'
      }}
    >
      {/* Original content - with blur effect during burning */}
      <div style={{ 
        filter: `blur(${initialPhase ? 1 : burnProgress * 3}px)`,
        transition: 'filter 0.5s ease-out'
      }}>
        {children}
      </div>
      
      {/* Burning overlay effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pulsing halo effect during transaction */}
        {initialPhase && (
          <div className="absolute inset-0 animate-pulse" style={{
            boxShadow: 'inset 0 0 30px rgba(255, 69, 0, 0.5)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        )}
        
        {/* Glowing edges - use CSS variables for dynamic positioning */}
        <div 
          className="absolute top-0 left-0 right-0 overflow-hidden"
          style={{ 
            height: `${Math.min(topProgress * 100, 100)}%`,
            transition: 'height 500ms ease-out'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/70 to-transparent" style={{ filter: 'blur(6px)' }} />
        </div>
        
        <div 
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ 
            height: `${Math.min(bottomProgress * 100, 100)}%`,
            transition: 'height 500ms ease-out'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-orange-600/70 to-transparent" style={{ filter: 'blur(6px)' }} />
        </div>
        
        <div 
          className="absolute top-0 bottom-0 left-0 overflow-hidden"
          style={{ 
            width: `${Math.min(leftProgress * 100, 100)}%`,
            transition: 'width 500ms ease-out'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/70 to-transparent" style={{ filter: 'blur(6px)' }} />
        </div>
        
        <div 
          className="absolute top-0 bottom-0 right-0 overflow-hidden"
          style={{ 
            width: `${Math.min(rightProgress * 100, 100)}%`,
            transition: 'width 500ms ease-out'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-orange-500/70 to-transparent" style={{ filter: 'blur(6px)' }} />
        </div>
        
        {/* Top fire layer */}
        <div className="absolute -top-10 left-0 right-0 h-40 animate-burn-top">
          {[...Array(25)].map((_, i) => (
            <div
              key={`flame-top-${i}`}
              className="absolute bottom-0 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${10 + Math.random() * 30}px`,
                height: `${30 + Math.random() * 60}px`,
                background: `linear-gradient(to top, rgba(255,69,0,0.9), rgba(255,165,0,0.8) 60%, rgba(255,255,0,0.4) 90%, transparent)`,
                opacity: 0.7 + Math.random() * 0.3,
                filter: 'blur(4px)',
                animation: `flicker ${0.5 + Math.random() * 1}s infinite alternate`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Bottom to top fire effect */}
        <div className="absolute bottom-0 left-0 right-0 h-full animate-burn-bottom">
          {[...Array(20)].map((_, i) => (
            <div
              key={`flame-bottom-${i}`}
              className="absolute bottom-0 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${5 + Math.random() * 20}px`,
                height: `${20 + Math.random() * 40}px`,
                background: `linear-gradient(to top, rgba(255,0,0,0.8), rgba(255,165,0,0.8) 50%, rgba(255,255,0,0.4) 90%, transparent)`,
                opacity: 0.6 + Math.random() * 0.4,
                filter: 'blur(3px)',
                animation: `flameRise ${1 + Math.random() * 2}s infinite`,
                animationDelay: `${Math.random() * 1}s`
              }}
            />
          ))}
        </div>
        
        {/* Ember particles */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={`ember-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 20}%`,
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                background: Math.random() > 0.7 ? 'rgba(255,255,255,0.9)' : 'rgba(255,165,0,0.9)',
                opacity: 0.6 + Math.random() * 0.4,
                animation: `float ${2 + Math.random() * 3}s infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Transaction waiting indicator */}
        {initialPhase && (
          <div className="absolute top-4 right-4 flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse" />
            <span className="text-white text-xs font-medium">Processing...</span>
          </div>
        )}
        
        {/* Charring effect - darkening from edges inward */}
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" style={{ opacity: burnProgress }} />
        
        {/* Paper curl/crumple effect */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cfilter id=\'noise\' x=\'0%25\' y=\'0%25\' width=\'100%25\' height=\'100%25\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeDisplacementMap in=\'SourceGraphic\' scale=\'15\'/%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' fill=\'none\'/%3E%3C/svg%3E")',
            transform: `scale(${1 - burnProgress * 0.1})`,
            opacity: burnProgress * 0.8
          }}
        />
      </div>
    </div>
  );
};

BurningEffect.propTypes = {
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool,
  onBurnComplete: PropTypes.func,
  duration: PropTypes.number,
  className: PropTypes.string
};

export default BurningEffect; 