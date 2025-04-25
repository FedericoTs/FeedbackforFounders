import React from "react";
import { AlertTriangle, Clock, Shield, Unlock } from "lucide-react";
import { Button } from "./button";
import { Progress } from "./progress";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { formatCooldownTime } from "@/lib/authUtils";

interface AccountLockoutAlertProps {
  /** The lockout level (1-4) */
  level: number;
  /** The remaining time in milliseconds */
  remainingTime: number;
  /** The total lockout duration in milliseconds */
  totalDuration: number;
  /** Number of recent failed attempts */
  recentAttempts: number;
  /** Whether to show a compact version */
  compact?: boolean;
  /** Optional callback for when the user requests to contact support */
  onContactSupport?: () => void;
  /** Optional callback for when an admin unlocks the account */
  onAdminUnlock?: () => void;
  /** Whether the current user has admin privileges */
  isAdmin?: boolean;
}

/**
 * Alert component that displays information about an account lockout
 * with appropriate messaging based on the lockout level
 */
export function AccountLockoutAlert({
  level,
  remainingTime,
  totalDuration,
  recentAttempts,
  compact = false,
  onContactSupport,
  onAdminUnlock,
  isAdmin = false,
}: AccountLockoutAlertProps) {
  // Calculate progress percentage
  const progressPercentage =
    totalDuration > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((totalDuration - remainingTime) / totalDuration) * 100,
          ),
        )
      : 0;

  // Get appropriate messaging based on lockout level
  const getLockoutMessage = () => {
    switch (level) {
      case 1:
        return "Your account has been temporarily locked due to multiple failed login attempts.";
      case 2:
        return "Your account has been locked for security reasons due to repeated failed login attempts.";
      case 3:
        return "Your account has been locked for an extended period due to numerous failed login attempts.";
      case 4:
        return "Your account has been locked for a significant period due to excessive failed login attempts. Please contact support if you believe this is an error.";
      default:
        return "Your account has been temporarily locked due to security concerns.";
    }
  };

  // Compact version for inline display
  if (compact) {
    return (
      <div className="flex items-center p-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
        <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
        <span className="text-sm">
          Account locked for {formatCooldownTime(remainingTime)}
        </span>
      </div>
    );
  }

  // Full alert version
  return (
    <Alert
      variant="destructive"
      className="bg-amber-50 border-amber-200 text-amber-800"
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-amber-800 font-semibold">
        Account Locked - Security Measure
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{getLockoutMessage()}</p>

        <div className="flex items-center gap-2 text-sm mb-3">
          <Clock className="h-4 w-4" />
          <span>
            Lockout expires in{" "}
            <strong>{formatCooldownTime(remainingTime)}</strong>
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Lockout progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="text-sm mb-3">
          <p>
            <Shield className="h-4 w-4 inline-block mr-1" />
            <span>Security level: </span>
            <span className="font-medium">
              {level === 1 && "Low"}
              {level === 2 && "Medium"}
              {level === 3 && "High"}
              {level === 4 && "Critical"}
            </span>
          </p>
          <p className="mt-1">
            <span>Recent failed attempts: </span>
            <span className="font-medium">{recentAttempts}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {isAdmin && onAdminUnlock && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdminUnlock}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Admin Override
            </Button>
          )}

          {onContactSupport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onContactSupport}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              Contact Support
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default AccountLockoutAlert;
