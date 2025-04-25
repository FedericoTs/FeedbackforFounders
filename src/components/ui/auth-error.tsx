import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ServerOff,
  WifiOff,
  UserX,
  RefreshCw,
} from "lucide-react";
import {
  StandardError,
  ErrorSeverity,
  ErrorCategory,
  getErrorSeverityClass,
  getUserFriendlyErrorMessage,
  getSuggestedAction,
} from "@/lib/errorHandler";
import { Button } from "./button";

interface AuthErrorProps {
  error: StandardError | null;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
  showSuggestion?: boolean;
  compact?: boolean;
}

/**
 * A standardized component for displaying authentication and other errors
 */
export function AuthError({
  error,
  onRetry,
  className = "",
  showIcon = true,
  showSuggestion = true,
  compact = false,
}: AuthErrorProps) {
  // If no error or empty error message, don't render anything
  if (!error || !error.message) {
    return null;
  }

  // Get the appropriate icon based on error category
  const getIcon = () => {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return <UserX className="h-5 w-5" />;
      case ErrorCategory.AUTHORIZATION:
        return <ShieldAlert className="h-5 w-5" />;
      case ErrorCategory.NETWORK:
        return <WifiOff className="h-5 w-5" />;
      case ErrorCategory.SERVER:
        return <ServerOff className="h-5 w-5" />;
      case ErrorCategory.VALIDATION:
        return <AlertCircle className="h-5 w-5" />;
      default:
        return error.severity === ErrorSeverity.CRITICAL ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        );
    }
  };

  // Get the user-friendly error message
  const errorMessage = getUserFriendlyErrorMessage(error);

  // Get the suggested action
  const suggestion = showSuggestion ? getSuggestedAction(error) : null;

  // Get the appropriate CSS class based on error severity
  const severityClass = getErrorSeverityClass(error);

  // For compact mode, render a simpler version
  if (compact) {
    return (
      <div
        className={`text-sm ${severityClass} px-3 py-2 rounded-md ${className}`}
      >
        <div className="flex items-center gap-2">
          {showIcon && getIcon()}
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }

  // For full mode, render a more detailed version
  return (
    <div className={`rounded-lg border p-4 ${severityClass} ${className}`}>
      <div className="flex">
        {showIcon && <div className="flex-shrink-0 mr-3">{getIcon()}</div>}
        <div className="flex-1">
          <h3 className="text-sm font-medium">{errorMessage}</h3>
          {suggestion && <p className="mt-2 text-sm">{suggestion}</p>}
          {error.retryable && onRetry && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthError;
