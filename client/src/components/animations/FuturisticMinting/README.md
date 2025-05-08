# Futuristic Minting Animation

A reusable animation system for creating dramatic certificate minting experiences with door animations, smoke effects, and holographic UI elements.

## Features

- ✨ Dramatic door animations with metallic textures
- 💨 Smoke effects for visual interest
- 🎖️ Certificate reveal with lighting effects
- 🔮 Holographic UI with progress indicators
- 🎵 Sound effects for each animation stage
- ♿ Accessibility features (reduced motion support)
- 📱 Responsive and works across browsers

## Installation

The animation system is already included in your project, with all necessary dependencies installed:

- GSAP for advanced animations
- Framer Motion for physics-based animations
- Lottie Web for complex pre-rendered animations
- Howler for sound management

## Usage

### Basic Implementation

```jsx
import React from 'react';
import FuturisticMinting from '../../components/animations/FuturisticMinting';

const MintingPage = () => {
  const handleMintCertificate = async () => {
    // Get access to the animation controller
    const { startAnimation } = FuturisticMinting.useAnimation();
    
    try {
      // Start the animation before minting
      startAnimation();
      
      // Your actual blockchain minting logic here
      // const result = await contract.issueCertificate(...);
      
      // Certificate data to display
      const certificateData = {
        imageUrl: '/path/to/certificate.png',
        title: 'Certificate of Completion',
        id: '123456'
      };
      
      // Update animation with certificate data
      startAnimation(certificateData);
      
    } catch (error) {
      console.error('Minting failed:', error);
      // You can handle error states here
    }
  };
  
  return (
    <FuturisticMinting.Provider>
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-8">Certificate Minting</h1>
        
        <button 
          onClick={handleMintCertificate}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
        >
          Mint Certificate
        </button>
        
        {/* The animation overlay */}
        <FuturisticMinting.Overlay />
      </div>
    </FuturisticMinting.Provider>
  );
};

export default MintingPage;
```

### Advanced Usage with Manual Stage Control

```jsx
import React, { useEffect } from 'react';
import FuturisticMinting from '../../components/animations/FuturisticMinting';

const AdvancedMintingPage = () => {
  const { 
    stage, 
    startAnimation, 
    resetAnimation, 
    enableSound,
    toggleSound
  } = FuturisticMinting.useAnimation();
  
  // Example of reacting to stage changes
  useEffect(() => {
    if (stage === FuturisticMinting.Stages.MINTING_COMPLETE) {
      console.log('Minting animation completed!');
      // You could trigger additional actions here
    }
  }, [stage]);
  
  return (
    <div className="container mx-auto p-8">
      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => startAnimation()}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Start Animation
        </button>
        
        <button 
          onClick={resetAnimation}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Reset Animation
        </button>
        
        <button 
          onClick={toggleSound}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {enableSound ? 'Mute Sounds' : 'Enable Sounds'}
        </button>
      </div>
      
      <div className="p-4 bg-slate-800 text-white rounded">
        <p>Current animation stage: <strong>{stage}</strong></p>
      </div>
      
      {/* The animation overlay */}
      <FuturisticMinting.Overlay />
    </div>
  );
};
```

## Sound Effects

For the best experience, add sound effects to your `/public/sounds/` directory:

- `door-close.mp3`
- `minting-hum.mp3`
- `complete.mp3`
- `door-open.mp3`
- `reveal.mp3`

## Browser Compatibility

This animation system is compatible with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS/Android)

## Performance Considerations

The animation uses CSS transforms and opacity for smooth performance. For devices with limited capabilities, the animation automatically switches to a simplified version when the user has "prefers-reduced-motion" enabled. 