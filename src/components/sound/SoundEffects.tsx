import React, { useEffect } from "react";
import { useSoundManager } from "./SoundManager";

// Define sound effects used throughout the application
const SOUND_EFFECTS = [
  {
    id: "achievement",
    src: "/sounds/reward-achievement.mp3",
    category: "achievement",
    volume: 0.8,
  },
  {
    id: "level-up",
    src: "/sounds/reward-level.mp3",
    category: "achievement",
    volume: 0.8,
  },
  {
    id: "streak",
    src: "/sounds/reward-streak.mp3",
    category: "achievement",
    volume: 0.7,
  },
  {
    id: "feedback",
    src: "/sounds/reward-feedback.mp3",
    category: "feedback",
    volume: 0.7,
  },
  {
    id: "notification",
    src: "/sounds/reward-default.mp3",
    category: "notification",
    volume: 0.6,
  },
  // Add more sound effects as needed
];

/**
 * Component that registers all sound effects and listens for sound events
 */
const SoundEffects: React.FC = () => {
  const { registerSound, playSound } = useSoundManager();

  // Register all sound effects
  useEffect(() => {
    SOUND_EFFECTS.forEach((sound) => {
      registerSound({
        id: sound.id,
        src: sound.src,
        category: sound.category as any,
        volume: sound.volume,
      });
    });

    // Clean up function to unregister sounds if needed
    return () => {
      // Unregister could be implemented if needed
    };
  }, [registerSound]);

  // Listen for award events
  useEffect(() => {
    const handleAwardEvent = (event: CustomEvent) => {
      const { variant = "default", sound = true } = event.detail;

      if (!sound) return;

      // Map variant to sound ID
      let soundId;
      switch (variant) {
        case "achievement":
          soundId = "achievement";
          break;
        case "level":
          soundId = "level-up";
          break;
        case "streak":
          soundId = "streak";
          break;
        case "feedback":
          soundId = "feedback";
          break;
        default:
          soundId = "notification";
      }

      playSound(soundId);
    };

    // Define the event listener function that can be properly typed for both add and remove
    const typedEventListener = handleAwardEvent as EventListener;

    // Listen on both window and document to ensure we catch all events
    window.addEventListener("award:received", typedEventListener);
    document.addEventListener("award:received", typedEventListener);

    return () => {
      window.removeEventListener("award:received", typedEventListener);
      document.removeEventListener("award:received", typedEventListener);
    };
  }, [playSound]);

  return null; // This component doesn't render anything
};

export default SoundEffects;
