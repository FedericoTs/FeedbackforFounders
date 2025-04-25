import { useEffect } from "react";
import { useAwardToast } from "@/hooks/useAwardToast";

interface AwardEventDetail {
  points: number;
  title: string;
  description: string;
  variant?: "default" | "achievement" | "streak" | "level" | "feedback";
  metadata?: any;
  priority?: number;
  sound?: boolean;
}

export function AwardToastListener() {
  const { showAwardToast } = useAwardToast();

  useEffect(() => {
    const handleAwardEvent = (event: CustomEvent<AwardEventDetail>) => {
      console.log("Award event received:", event.detail);
      try {
        const {
          points,
          title,
          description,
          variant = "default",
          metadata,
          priority,
          sound,
        } = event.detail;

        // Determine priority based on variant if not explicitly set
        let calculatedPriority = priority;
        if (calculatedPriority === undefined) {
          switch (variant) {
            case "achievement":
              calculatedPriority = 30;
              break;
            case "level":
              calculatedPriority = 20;
              break;
            case "streak":
              calculatedPriority = 15;
              break;
            case "feedback":
              calculatedPriority = 10;
              break;
            default:
              calculatedPriority = 0;
          }

          // Adjust priority based on points
          if (points >= 100) calculatedPriority += 10;
          else if (points >= 50) calculatedPriority += 5;
          else if (points >= 25) calculatedPriority += 2;
        }

        // Enrich metadata with additional context if needed
        const enrichedMetadata = { ...metadata };

        // For achievements, add context about what was achieved
        if (variant === "achievement" && !enrichedMetadata.context) {
          enrichedMetadata.context =
            "Achievement unlocked! Keep up the great work.";
        }

        // For level ups, add context about new features or benefits
        if (variant === "level" && !enrichedMetadata.context) {
          enrichedMetadata.context = `You've reached level ${metadata?.level || "up"}! New features unlocked.`;
        }

        showAwardToast({
          points,
          title,
          description,
          variant,
          metadata: enrichedMetadata,
          priority: calculatedPriority,
          sound,
        });
      } catch (error) {
        console.error("Error showing award toast:", error);
      }
    };

    // Define the event listener function that can be properly typed for both add and remove
    const typedEventListener = handleAwardEvent as EventListener;

    // Listen on both window and document to ensure we catch all events
    window.addEventListener("award:received", typedEventListener);
    document.addEventListener("award:received", typedEventListener);

    // Log that the listeners have been attached
    console.log(
      "AwardToastListener: Event listeners attached for award:received",
    );

    return () => {
      window.removeEventListener("award:received", typedEventListener);
      document.removeEventListener("award:received", typedEventListener);
      console.log("AwardToastListener: Event listeners removed");
    };
  }, [showAwardToast]);

  return null; // This component doesn't render anything
}
