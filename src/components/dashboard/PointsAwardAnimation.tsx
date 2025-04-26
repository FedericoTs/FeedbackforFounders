import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PointsAwardAnimationProps {
  points: number;
  message?: string;
  variant?: "default" | "level" | "achievement" | "streak";
  onComplete?: () => void;
}

const PointsAwardAnimation: React.FC<PointsAwardAnimationProps> = ({
  points,
  message,
  variant = "default",
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animation duration before calling onComplete
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300); // Allow exit animation to complete
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Determine color based on variant
  const getColor = () => {
    switch (variant) {
      case "achievement":
        return "bg-amber-500 text-white";
      case "level":
        return "bg-purple-500 text-white";
      case "streak":
        return "bg-blue-500 text-white";
      default:
        return "bg-teal-500 text-white";
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -50, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center">
            <motion.div
              className={`rounded-full px-4 py-2 font-bold shadow-lg ${getColor()}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">+{points}</span>
                <span className="text-sm uppercase">points</span>
              </div>
            </motion.div>
            {message && (
              <motion.div
                className="mt-2 text-center bg-white bg-opacity-90 px-3 py-1 rounded shadow text-sm max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {message}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointsAwardAnimation;
