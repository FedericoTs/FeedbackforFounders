import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
} from "react";
import { AwardToast } from "@/components/ui/award-toast";

type AwardToastVariant =
  | "default"
  | "achievement"
  | "streak"
  | "level"
  | "feedback";

interface AwardToastOptions {
  title: string;
  description: string;
  points: number;
  variant?: AwardToastVariant;
  metadata?: Record<string, any>;
  priority?: number; // Higher number = higher priority
  sound?: boolean; // Whether to play sound
  timestamp?: string; // ISO string timestamp
}

interface AwardToastContextValue {
  showAwardToast: (options: AwardToastOptions) => void;
  clearToasts: () => void;
  toastHistory: AwardToastOptions[];
  isSoundEnabled: boolean;
  toggleSound: () => void;
}

const AwardToastContext = createContext<AwardToastContextValue | undefined>(
  undefined,
);

// Maximum number of toasts to keep in history
const MAX_HISTORY_SIZE = 50;

// Sound effects for different reward types
const SOUND_EFFECTS = {
  default: "/sounds/reward-default.mp3",
  achievement: "/sounds/reward-achievement.mp3",
  streak: "/sounds/reward-streak.mp3",
  level: "/sounds/reward-level.mp3",
  feedback: "/sounds/reward-feedback.mp3",
};

export const AwardToastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [toastData, setToastData] = useState<AwardToastOptions>({
    title: "",
    description: "",
    points: 0,
  });
  const [toastHistory, setToastHistory] = useState<AwardToastOptions[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true); // Default to enabled

  // Use a queue to handle multiple toasts
  const toastQueue = useRef<AwardToastOptions[]>([]);
  const isProcessing = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();

      // Load user preference for sound from localStorage if available
      const storedSoundPreference = localStorage.getItem("rewardSoundEnabled");
      if (storedSoundPreference !== null) {
        setSoundEnabled(storedSoundPreference === "true");
      }

      // Try to preload sound effects
      try {
        Object.values(SOUND_EFFECTS).forEach((path) => {
          const audio = new Audio();
          audio.src = path;
          audio.preload = "auto";
        });
      } catch (error) {
        console.error("Error preloading sounds:", error);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play sound effect based on variant with enhanced experience
  const playSound = useCallback(
    (variant: AwardToastVariant = "default") => {
      if (!soundEnabled || !audioRef.current) return;

      try {
        const soundPath = SOUND_EFFECTS[variant] || SOUND_EFFECTS.default;

        // Stop any currently playing sound
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Set up new sound
        audioRef.current.src = soundPath;
        audioRef.current.volume = 0.5; // Set volume to 50%

        // Add a slight delay for better user experience when multiple sounds would play
        setTimeout(() => {
          audioRef.current?.play().catch((err) => {
            console.error("Error playing sound:", err);
          });
        }, 50);
      } catch (error) {
        console.error("Error setting up sound:", error);
      }
    },
    [soundEnabled],
  );

  // Toggle sound setting
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("rewardSoundEnabled", String(newValue));
      return newValue;
    });
  }, []);

  const processNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;

    // Sort queue by priority if needed
    if (toastQueue.current.length > 1) {
      toastQueue.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    const nextToast = toastQueue.current.shift();
    if (nextToast) {
      setToastData(nextToast);
      setOpen(true);

      // Play sound if enabled
      if (nextToast.sound !== false) {
        // Play sound unless explicitly disabled
        playSound(nextToast.variant);
      }

      // Add to history with timestamp if not already present
      setToastHistory((prev) => {
        const enrichedToast = {
          ...nextToast,
          timestamp: nextToast.timestamp || new Date().toISOString(),
        };
        const newHistory = [enrichedToast, ...prev].slice(0, MAX_HISTORY_SIZE);
        return newHistory;
      });
    }
  }, [playSound]);

  const showAwardToast = useCallback(
    (options: AwardToastOptions) => {
      console.log("showAwardToast called with options:", options);

      // Add to queue with default priority if not specified
      const enrichedOptions = {
        ...options,
        priority: options.priority || 0,
        timestamp: options.timestamp || new Date().toISOString(),
      };

      toastQueue.current.push(enrichedOptions);

      // If not currently processing a toast, start processing
      if (!isProcessing.current) {
        processNextToast();
      }
    },
    [processNextToast],
  );

  const clearToasts = useCallback(() => {
    toastQueue.current = [];
    setOpen(false);
    isProcessing.current = false;
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);

      // When toast is closed, process the next one in queue
      if (!open) {
        setTimeout(processNextToast, 300); // Small delay before showing next toast
      }
    },
    [processNextToast],
  );

  return (
    <AwardToastContext.Provider
      value={{
        showAwardToast,
        clearToasts,
        toastHistory,
        isSoundEnabled: soundEnabled,
        toggleSound,
      }}
    >
      {children}
      <AwardToast
        open={open}
        onOpenChange={handleOpenChange}
        title={toastData.title}
        description={toastData.description}
        points={toastData.points}
        variant={toastData.variant}
        metadata={toastData.metadata}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    </AwardToastContext.Provider>
  );
};

export const useAwardToast = () => {
  const context = useContext(AwardToastContext);
  if (context === undefined) {
    throw new Error("useAwardToast must be used within an AwardToastProvider");
  }
  return context;
};
