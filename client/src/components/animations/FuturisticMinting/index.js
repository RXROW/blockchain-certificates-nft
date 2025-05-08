import { MintingAnimationProvider, useMintingAnimation, ANIMATION_STAGES } from './AnimationContext';
import MintingOverlay from './MintingOverlay';
import { soundManager, playSoundForStage } from './SoundEffects';

// Create a convenient export for easier usage
const FuturisticMinting = {
  Provider: MintingAnimationProvider,
  Overlay: MintingOverlay,
  useAnimation: useMintingAnimation,
  Stages: ANIMATION_STAGES
};

export default FuturisticMinting;

// Also export individual components for more granular usage
export {
  MintingAnimationProvider,
  useMintingAnimation,
  ANIMATION_STAGES,
  MintingOverlay
}; 