import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { formatRateLimitTimeRemaining } from "@/lib/rateLimiter";

interface RateLimitAlertProps {
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Optional message to display */
  message?: string;
  /** Optional title */
  title?: string;
  /** Optional callback when time expires */
  onExpired?: () => void;
  /** Optional variant */
  variant?: "default" | "compact";
  /** Optional className */
  className?: string;
}

/**
 * A component to display rate limit information to users
 *
 * @example
 * // Basic usage
 * <RateLimitAlert timeRemaining={60000} />
 *
 * @example
 * // With custom message
 * <RateLimitAlert
 *   timeRemaining={120000}
 *   message="Too many login attempts. Please try again later."
 *   title="Account temporarily locked"
 * />
 *
 * @example
 * // Compact variant
 * <RateLimitAlert
 *   timeRemaining={30000}
 *   variant="compact"
 * />
 */
export function RateLimitAlert({
  timeRemaining,
  message = "Too many attempts. Please try again later.",
  title = "Rate limited",
  onExpired,
  variant = "default",
  className,
}: RateLimitAlertProps) {
  const [remainingTime, setRemainingTime] = useState(timeRemaining);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setRemainingTime(timeRemaining);
    // Calculate initial progress
    setProgress(100);
  }, [timeRemaining]);

  useEffect(() => {
    if (remainingTime <= 0) {
      if (onExpired) onExpired();
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          if (onExpired) onExpired();
          return 0;
        }
        return newTime;
      });

      // Update progress based on remaining time
      setProgress((remainingTime / timeRemaining) * 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime, timeRemaining, onExpired]);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-amber-600", className)}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">
          {formatRateLimitTimeRemaining(remainingTime)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md",
        className,
      )}
    >
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-amber-500" />
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm mt-1">{message}</p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Time remaining</span>
              <span className="font-medium">
                {formatRateLimitTimeRemaining(remainingTime)}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 bg-amber-100"
              indicatorClassName="bg-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RateLimitAlert;
