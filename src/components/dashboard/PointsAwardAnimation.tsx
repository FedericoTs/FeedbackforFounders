import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Award, Trophy } from "lucide-react";

interface PointsAwardAnimationProps {
  points: number;
  message?: string;
  variant?: "default" | "level" | "achievement" | "streak";
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

const PointsAwardAnimation: React.FC<PointsAwardAnimationProps> = ({
  points,
  message = "Points Awarded!",
  variant = "default",
  onComplete,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getIcon = () => {
    switch (variant) {
      case "level":
        return <Trophy className="h-8 w-8 text-amber-500" />;
      case "achievement":
        return <Award className="h-8 w-8 text-teal-500" />;
      case "streak":
        return <Star className="h-8 w-8 text-blue-500" />;
      default:
        return <Star className="h-8 w-8 text-amber-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "level":
        return "bg-gradient-to-r from-purple-100 to-pink-100";
      case "achievement":
        return "bg-gradient-to-r from-amber-100 to-yellow-100";
      case "streak":
        return "bg-gradient-to-r from-blue-100 to-indigo-100";
      default:
        return "bg-gradient-to-r from-teal-100 to-cyan-100";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "level":
        return "text-purple-700";
      case "achievement":
        return "text-amber-700";
      case "streak":
        return "text-blue-700";
      default:
        return "text-teal-700";
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${getBackgroundColor()} ${getTextColor()} flex items-center gap-3 max-w-xs`}
        >
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            {getIcon()}
          </motion.div>
          <div>
            <motion.div
              className="text-lg font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {points > 0 ? `+${points}` : points} points
            </motion.div>
            <motion.div
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.div>
          </div>
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
            style={{ width: "100%" }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PointsAwardAnimation;
