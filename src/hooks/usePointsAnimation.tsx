import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PointsAwardAnimation from "@/components/dashboard/PointsAwardAnimation";

interface PointsAward {
  id: string;
  points: number;
  message?: string;
  variant?: "default" | "level" | "achievement" | "streak";
}

export const usePointsAnimation = () => {
  const [awards, setAwards] = useState<PointsAward[]>([]);

  // Listen for award:received events
  useEffect(() => {
    const handleAwardReceived = (event: CustomEvent) => {
      const { points, title, description, variant } = event.detail;

      // Add new award to the queue
      setAwards((prev) => [
        ...prev,
        {
          id: `award-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          points,
          message: description || title,
          variant: variant || "default",
        },
      ]);
    };

    // Add event listener
    window.addEventListener(
      "award:received" as any,
      handleAwardReceived as EventListener,
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "award:received" as any,
        handleAwardReceived as EventListener,
      );
    };
  }, []);

  // Handle removing awards after they complete
  const handleAwardComplete = (id: string) => {
    setAwards((prev) => prev.filter((award) => award.id !== id));
  };

  // Render the awards
  const renderAwards = () => {
    if (typeof document === "undefined") return null;

    // Only show the first award in the queue
    const currentAward = awards[0];
    if (!currentAward) return null;

    return createPortal(
      <PointsAwardAnimation
        key={currentAward.id}
        points={currentAward.points}
        message={currentAward.message}
        variant={currentAward.variant}
        onComplete={() => handleAwardComplete(currentAward.id)}
      />,
      document.body,
    );
  };

  // Manually trigger an award animation
  const showAward = ({
    points,
    message,
    variant = "default",
  }: {
    points: number;
    message?: string;
    variant?: "default" | "level" | "achievement" | "streak";
  }) => {
    setAwards((prev) => [
      ...prev,
      {
        id: `award-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points,
        message,
        variant,
      },
    ]);
  };

  return { renderAwards, showAward };
};
