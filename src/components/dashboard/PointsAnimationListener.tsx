import React, { useEffect } from "react";
import { usePointsAnimation } from "@/hooks/usePointsAnimation";

/**
 * Component that listens for award events and displays points animations
 * This component doesn't render anything visible but handles the animation logic
 */
const PointsAnimationListener: React.FC = () => {
  const { renderAwards } = usePointsAnimation();

  // Render the animations when they are available
  return renderAwards();
};

export default PointsAnimationListener;
