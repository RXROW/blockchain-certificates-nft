import { ANIMATION_STAGES } from './AnimationContext';

// Empty sound manager that does nothing
class SoundManager {
  constructor() {
    this.enabled = false;
  }

  setUserInteraction() {}
  setEnabled() {}
  play() {}
  startLooping() {}
  stopLooping() {}
  playForStage() {}
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Utility function that does nothing
export const playSoundForStage = () => {}; 