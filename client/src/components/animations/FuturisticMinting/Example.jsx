import React, { useState } from 'react';
import FuturisticMinting from './index';

const MintingExample = () => {
  const [isMinting, setIsMinting] = useState(false);
  
  // Get animation controller
  const { startAnimation, resetAnimation } = FuturisticMinting.useAnimation();
  
  // Example minting function
  const handleMintCertificate = async () => {
    try {
      setIsMinting(true);
      
      // Start the animation
      startAnimation();
      
      // Simulate blockchain minting delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Mock certificate data
      const certificateData = {
        imageUrl: 'https://placehold.co/400x300/3b82f6/ffffff?text=Certificate',
        title: 'Certificate of Achievement',
        id: `CERT-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      };
      
      // Update animation with certificate data
      startAnimation(certificateData);
      
    } catch (error) {
      console.error('Minting failed:', error);
      resetAnimation();
    } finally {
      setIsMinting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Certificate Minting</h1>
        <p className="text-blue-300 mb-10">Experience our futuristic minting system that securely stores your certificates on the blockchain.</p>
        
        <button 
          onClick={handleMintCertificate}
          disabled={isMinting}
          className={`
            px-8 py-4 rounded-lg text-lg font-bold
            transition-all duration-300
            border-2 border-blue-500
            ${isMinting 
              ? 'bg-blue-800/30 text-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
            }
          `}
        >
          {isMinting ? 'Minting in Progress...' : 'Mint New Certificate'}
        </button>
        
        <div className="mt-6 text-sm text-blue-400/60">
          Click the button above to see the animation in action
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-blue-400/40">
        Futuristic Minting Animation System
      </div>
    </div>
  );
};

// Wrap the component with the provider
const MintingExampleWithProvider = () => (
  <FuturisticMinting.Provider>
    <MintingExample />
    <FuturisticMinting.Overlay />
  </FuturisticMinting.Provider>
);

export default MintingExampleWithProvider; 