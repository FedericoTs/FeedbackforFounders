import React from "react";
import { usePointsAnimation } from "@/hooks/usePointsAnimation";

const PointsAnimationListener: React.FC = () => {
  const { renderAwards } = usePointsAnimation();

  return <>{renderAwards()}</>;
};

export default PointsAnimationListener;
