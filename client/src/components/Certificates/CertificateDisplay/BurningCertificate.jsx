import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import BurningEffect from '../../ui/BurningEffect';

const BurningCertificate = ({ 
  children, 
  certificate, 
  isBurning = false, 
  onBurnComplete = () => {},
  onBurnCancel = () => {},
  className = ''
}) => {
  const [burnAnimationActive, setBurnAnimationActive] = useState(isBurning);
  const animationCompleted = useRef(false);
  
  // Update the burning state when the isBurning prop changes
  useEffect(() => {
    if (isBurning && !burnAnimationActive) {
      console.log(`Setting burn animation active for certificate #${certificate.id}`);
      setBurnAnimationActive(true);
      animationCompleted.current = false;
    } else if (!isBurning && burnAnimationActive) {
      // Handle cancellation
      console.log(`Cancelling burn animation for certificate #${certificate.id}`);
      setBurnAnimationActive(false);
      animationCompleted.current = false;
      onBurnCancel(certificate);
    }
  }, [isBurning, burnAnimationActive, certificate, onBurnCancel]);
  
  const handleBurnComplete = () => {
    // Prevent calling burn complete multiple times
    if (animationCompleted.current) return;
    
    console.log(`Burn animation completing for certificate #${certificate.id}`);
    animationCompleted.current = true;
    
    // Call the parent's completion handler
    onBurnComplete(certificate);
    
    // Reset animation state after a delay to ensure smooth transitions
    setTimeout(() => {
      setBurnAnimationActive(false);
    }, 500);
  };
  
  // Return the burning effect wrapper if burning is active
  if (burnAnimationActive) {
    return (
      <div className="transform-gpu">
        <BurningEffect 
          isActive={true}
          onBurnComplete={handleBurnComplete}
          duration={3500}
          className={className}
        >
          {children}
        </BurningEffect>
      </div>
    );
  }
  
  // Otherwise, just return the children
  return <div className={className}>{children}</div>;
};

BurningCertificate.propTypes = {
  children: PropTypes.node.isRequired,
  certificate: PropTypes.object.isRequired,
  isBurning: PropTypes.bool,
  onBurnComplete: PropTypes.func,
  onBurnCancel: PropTypes.func,
  className: PropTypes.string
};

export default BurningCertificate; 