import { useEffect } from "react";
import { useAwardToast } from "@/hooks/useAwardToast";

interface AwardEventDetail {
  points: number;
  title: string;
  description: string;
  variant?: "default" | "achievement" | "streak" | "level" | "feedback";
  metadata?: any;
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
        } = event.detail;
        showAwardToast({
          points,
          title,
          description,
          variant,
          metadata,
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
