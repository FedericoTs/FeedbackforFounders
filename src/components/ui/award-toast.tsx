import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, Zap, Trophy } from "lucide-react";
import { cva } from "class-variance-authority";

interface AwardToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  points: number;
  variant?: "default" | "achievement" | "streak" | "level";
}

const toastVariants = cva(
  "fixed z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg border overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-500 to-emerald-500 border-teal-600 text-white",
        achievement:
          "bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-600 text-white",
        streak:
          "bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-600 text-white",
        level:
          "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-600 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconMap = {
  default: Zap,
  achievement: Trophy,
  streak: Star,
  level: Award,
};

const AwardToast = ({
  open,
  onOpenChange,
  title,
  description,
  points,
  variant = "default",
}: AwardToastProps) => {
  console.log("AwardToast rendered with props:", {
    open,
    title,
    description,
    points,
    variant,
  });
  const IconComponent = iconMap[variant];

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={toastVariants({ variant })}
          style={{ top: "1rem", right: "1rem", maxWidth: "calc(100% - 2rem)" }}
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-2 rounded-full bg-white/20"
            >
              <IconComponent className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center text-teal-600"
            >
              +{points}
            </motion.div>
          </div>

          <div className="flex-1">
            <motion.h3
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="font-bold text-white"
            >
              {title}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-white/90"
            >
              {description}
            </motion.p>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenChange(false)}
            className="text-white/80 hover:text-white p-1 rounded-full"
            aria-label="Close toast"
          >
            ×
          </motion.button>

          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 bg-white/30"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { AwardToast };
