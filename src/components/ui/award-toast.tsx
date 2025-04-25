import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Star,
  Zap,
  Trophy,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cva } from "class-variance-authority";

interface AwardToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  points: number;
  variant?: "default" | "achievement" | "streak" | "level" | "feedback";
  metadata?: Record<string, any>;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
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
        feedback:
          "bg-gradient-to-r from-green-500 to-teal-500 border-green-600 text-white",
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
  feedback: MessageSquare,
};

// Confetti animation component
const Confetti = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {active && (
        <>
          {Array.from({ length: 30 }).map((_, i) => {
            const size = Math.random() * 8 + 5;
            const color = [
              "bg-red-500",
              "bg-blue-500",
              "bg-green-500",
              "bg-yellow-500",
              "bg-purple-500",
              "bg-pink-500",
              "bg-indigo-500",
            ][Math.floor(Math.random() * 7)];
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 3 + 2;
            const delay = Math.random() * 0.5;

            return (
              <motion.div
                key={i}
                className={`absolute ${color} rounded-sm z-50`}
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  top: "-20px",
                }}
                initial={{ y: -20, opacity: 0, rotate: 0 }}
                animate={{
                  y: [null, Math.random() * 400 + 100],
                  opacity: [0, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: animationDuration,
                  delay: delay,
                  ease: [0.1, 0.4, 0.8, 0.7],
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

const AwardToast = ({
  open,
  onOpenChange,
  title,
  description,
  points,
  variant = "default",
  metadata,
  soundEnabled = true,
  onToggleSound,
}: AwardToastProps) => {
  console.log("AwardToast rendered with props:", {
    open,
    title,
    description,
    points,
    variant,
    metadata,
  });

  const IconComponent = iconMap[variant];
  const isSignificant =
    variant === "achievement" || variant === "level" || points >= 50;
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      // Show confetti for significant rewards
      if (isSignificant) {
        setShowConfetti(true);
        const confettiTimer = setTimeout(() => {
          setShowConfetti(false);
        }, 2500);
        return () => clearTimeout(confettiTimer);
      }

      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, onOpenChange, isSignificant]);

  // Get background shine effect for significant rewards
  const getShineEffect = () => {
    if (!isSignificant) return {};

    return {
      backgroundImage:
        "linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
      backgroundSize: "200% 100%",
      backgroundRepeat: "no-repeat",
      animation: "shine 2s infinite",
    };
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shine {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            className={toastVariants({ variant })}
            style={{
              top: "1rem",
              right: "1rem",
              maxWidth: "calc(100% - 2rem)",
              boxShadow: isSignificant
                ? "0 0 15px rgba(255, 255, 255, 0.5)"
                : undefined,
              animation: isSignificant ? "pulse 2s infinite" : undefined,
              ...getShineEffect(),
            }}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Confetti effect for significant rewards */}
            <Confetti active={showConfetti} />

            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`p-2 rounded-full bg-white/20 ${isSignificant ? "ring-2 ring-white/50" : ""}`}
              >
                <IconComponent
                  className={`h-6 w-6 text-white ${isSignificant ? "animate-pulse" : ""}`}
                />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: isSignificant ? [1, 1.8, 1] : [1, 1.5, 1],
                  rotate: isSignificant ? [0, 15, -15, 0] : [0, 10, -10, 0],
                }}
                transition={{
                  delay: 0.3,
                  duration: isSignificant ? 0.8 : 0.5,
                  repeat: isSignificant ? 1 : 0,
                  repeatDelay: 1,
                }}
                className={`absolute -top-1 -right-1 ${isSignificant ? "bg-yellow-300 text-yellow-800" : "bg-white text-teal-600"} text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}
              >
                +{points}
              </motion.div>
            </div>

            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`font-bold text-white ${isSignificant ? "text-lg" : ""}`}
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

              {/* Show additional context for significant rewards */}
              {isSignificant && metadata?.context && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.4 }}
                  className="mt-1 text-xs bg-white/10 rounded px-2 py-1 text-white/80"
                >
                  {metadata.context}
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {/* Sound toggle button */}
              {onToggleSound && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSound();
                  }}
                  className="text-white/80 hover:text-white p-1 rounded-full"
                  aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </motion.button>
              )}

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onOpenChange(false)}
                className="text-white/80 hover:text-white p-1 rounded-full"
                aria-label="Close toast"
              >
                ×
              </motion.button>
            </div>

            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-white/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export { AwardToast };
