import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, RefreshCw } from "lucide-react";
import { formatTimeDuration } from "@/lib/authUtils";

interface SessionTimeoutWarningProps {
  timeRemaining: number;
  warningThreshold: number;
  onExtendSession: () => Promise<boolean>;
  onSessionExpired?: () => void;
  autoExtend?: boolean;
}

/**
 * A component that displays a warning when the user's session is about to expire
 * and provides options to extend the session.
 */
export default function SessionTimeoutWarning({
  timeRemaining,
  warningThreshold,
  onExtendSession,
  onSessionExpired,
  autoExtend = false,
}: SessionTimeoutWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [progress, setProgress] = useState(100);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  // Calculate if warning should be shown based on time remaining and threshold
  useEffect(() => {
    setLocalTimeRemaining(timeRemaining);
    const shouldShow = timeRemaining > 0 && timeRemaining <= warningThreshold;
    setIsVisible(shouldShow);

    // Calculate progress percentage
    if (timeRemaining <= warningThreshold) {
      const progressValue = (timeRemaining / warningThreshold) * 100;
      setProgress(Math.max(0, Math.min(100, progressValue)));
    } else {
      setProgress(100);
    }

    // Auto-extend if enabled and time is critically low (less than 20% of threshold)
    if (
      autoExtend &&
      timeRemaining > 0 &&
      timeRemaining < warningThreshold * 0.2 &&
      !isExtending
    ) {
      handleExtendSession();
    }

    // Call onSessionExpired when time reaches zero
    if (timeRemaining <= 0 && onSessionExpired) {
      onSessionExpired();
    }
  }, [timeRemaining, warningThreshold, autoExtend, onSessionExpired]);

  // Update local time remaining every second for smoother countdown
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1000);
        // Update progress
        const progressValue = (newTime / warningThreshold) * 100;
        setProgress(Math.max(0, Math.min(100, progressValue)));
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, warningThreshold]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await onExtendSession();
      if (!success) {
        console.error("Failed to extend session");
      }
    } catch (error) {
      console.error("Error extending session:", error);
    } finally {
      setIsExtending(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-amber-200 p-4 z-50 animate-in slide-in-from-right-5">
      <div className="flex items-start mb-3">
        <Clock className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
        <div>
          <h3 className="font-medium text-slate-900">Session Expiring Soon</h3>
          <p className="text-sm text-slate-600 mt-1">
            Your session will expire in{" "}
            <span className="font-medium">
              {formatTimeDuration(localTimeRemaining)}
            </span>
            .
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-1.5 mb-3" />

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-xs h-8"
        >
          Dismiss
        </Button>
        <Button
          onClick={handleExtendSession}
          disabled={isExtending}
          size="sm"
          className="text-xs h-8"
        >
          {isExtending ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Extending...
            </>
          ) : (
            "Extend Session"
          )}
        </Button>
      </div>
    </div>
  );
}
