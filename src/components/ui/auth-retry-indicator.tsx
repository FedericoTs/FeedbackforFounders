import React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface AuthRetryIndicatorProps {
  /** Current retry attempt (1-based) */
  attempt: number;
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a compact version */
  compact?: boolean;
  /** Callback function when retry is manually triggered */
  onManualRetry?: () => void;
}

/**
 * A component to display retry status for authentication operations
 *
 * @example
 * // Basic usage
 * <AuthRetryIndicator attempt={2} maxAttempts={3} />
 *
 * @example
 * // With custom message
 * <AuthRetryIndicator
 *   attempt={1}
 *   maxAttempts={3}
 *   message="Retrying connection..."
 * />
 *
 * @example
 * // With manual retry button
 * <AuthRetryIndicator
 *   attempt={3}
 *   maxAttempts={3}
 *   onManualRetry={() => retryFunction()}
 * />
 */
export function AuthRetryIndicator({
  attempt,
  maxAttempts,
  message = "Retrying...",
  className,
  compact = false,
  onManualRetry,
}: AuthRetryIndicatorProps) {
  // Calculate progress percentage
  const progress = Math.min(100, (attempt / maxAttempts) * 100);

  // For compact mode, render a simpler version
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>{message}</span>
        <span className="text-slate-500">
          {attempt}/{maxAttempts}
        </span>
      </div>
    );
  }

  // For full mode, render a more detailed version
  return (
    <div
      className={cn(
        "rounded-md border p-3 bg-amber-50 border-amber-200",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-amber-600 animate-spin" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">{message}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-amber-700">
              Attempt {attempt} of {maxAttempts}
            </span>
          </div>
        </div>

        {onManualRetry && attempt === maxAttempts && (
          <button
            onClick={onManualRetry}
            className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthRetryIndicator;
