import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

interface AwardToastProps {
  points: number;
  title: string;
  description: string;
  variant?: "default" | "achievement" | "streak" | "level" | "feedback";
  metadata?: Record<string, any>;
  priority?: number;
  sound?: boolean;
}

interface AwardToastContextType {
  showAwardToast: (props: AwardToastProps) => void;
  clearToasts: () => void;
  toastHistory: AwardToastProps[];
}

const AwardToastContext = createContext<AwardToastContextType | null>(null);

export function useAwardToast() {
  const context = useContext(AwardToastContext);
  if (!context) {
    throw new Error("useAwardToast must be used within an AwardToastProvider");
  }
  return context;
}

interface AwardToastProviderProps {
  children: React.ReactNode;
}

export function AwardToastProvider({ children }: AwardToastProviderProps) {
  const { toast } = useToast();
  const [toastHistory, setToastHistory] = useState<AwardToastProps[]>([]);
  const toastQueue = useRef<AwardToastProps[]>([]);
  const isProcessingQueue = useRef(false);

  // Process the next toast in the queue
  const processQueue = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    isProcessingQueue.current = true;
    const nextToast = toastQueue.current.shift();
    if (nextToast) {
      // Show the toast
      toast({
        title: nextToast.title,
        description: nextToast.description,
        variant: nextToast.variant as any,
      });

      // Play sound if enabled
      if (nextToast.sound !== false) {
        const soundFile = getSoundFileForVariant(nextToast.variant);
        playSound(soundFile);
      }

      // Add to history
      setToastHistory((prev) => [nextToast, ...prev].slice(0, 50)); // Keep last 50 toasts

      // Process next toast after a delay
      setTimeout(() => {
        processQueue();
      }, 3000); // Wait 3 seconds between toasts
    }
  }, [toast]);

  // Get the appropriate sound file based on the variant
  const getSoundFileForVariant = (variant?: string) => {
    switch (variant) {
      case "achievement":
        return "/sounds/reward-achievement.mp3";
      case "streak":
        return "/sounds/reward-streak.mp3";
      case "level":
        return "/sounds/reward-level.mp3";
      case "feedback":
        return "/sounds/reward-feedback.mp3";
      default:
        return "/sounds/reward-default.mp3";
    }
  };

  // Play a sound file
  const playSound = (soundFile: string) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch((error) => {
        console.error("Error playing sound:", error);
      });
    } catch (error) {
      console.error("Error creating audio:", error);
    }
  };

  // Show an award toast
  const showAwardToast = useCallback(
    (props: AwardToastProps) => {
      // Add to queue based on priority
      if (props.priority && props.priority > 0) {
        // Find the right position in the queue based on priority
        const index = toastQueue.current.findIndex(
          (item) => (item.priority || 0) < props.priority!,
        );
        if (index >= 0) {
          toastQueue.current.splice(index, 0, props);
        } else {
          toastQueue.current.push(props);
        }
      } else {
        toastQueue.current.push(props);
      }

      // Start processing the queue if not already processing
      if (!isProcessingQueue.current) {
        processQueue();
      }
    },
    [processQueue],
  );

  // Clear all toasts
  const clearToasts = useCallback(() => {
    toastQueue.current = [];
  }, []);

  return (
    <AwardToastContext.Provider
      value={{
        showAwardToast,
        clearToasts,
        toastHistory,
      }}
    >
      {children}
    </AwardToastContext.Provider>
  );
}

// Export the context and provider as a default object
export default {
  useAwardToast,
  AwardToastProvider,
};
