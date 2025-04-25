/**
 * Centralized error handling system for authentication and other errors
 */

import { formatAuthError } from "./authUtils";

// Error severity levels
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Error categories for better organization and handling
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NETWORK = "network",
  SERVER = "server",
  CLIENT = "client",
  UNKNOWN = "unknown",
}

// Standardized error object structure
export interface StandardError {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code?: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
}

/**
 * Creates a standardized error object from various error types
 * @param error The error to standardize
 * @param category Optional category override
 * @param severity Optional severity override
 * @returns A standardized error object
 */
export function createStandardError(
  error: any,
  category?: ErrorCategory,
  severity?: ErrorSeverity,
): StandardError {
  // Default values
  const defaultCategory = ErrorCategory.UNKNOWN;
  const defaultSeverity = ErrorSeverity.ERROR;
  const timestamp = Date.now();

  // Handle null or undefined errors
  if (!error) {
    return {
      message: "An unknown error occurred",
      severity: severity || defaultSeverity,
      category: category || defaultCategory,
      timestamp,
      retryable: false,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
      severity: severity || defaultSeverity,
      category: category || defaultCategory,
      timestamp,
      retryable: false,
    };
  }

  // Determine error category based on error properties
  let determinedCategory = category || defaultCategory;
  let determinedSeverity = severity || defaultSeverity;
  let isRetryable = false;

  // Authentication errors
  if (
    error.code?.startsWith("auth/") ||
    error.message?.includes("auth") ||
    error.message?.includes("authentication") ||
    error.message?.includes("login") ||
    error.message?.includes("password") ||
    error.message?.includes("email")
  ) {
    determinedCategory = ErrorCategory.AUTHENTICATION;
  }

  // Authorization errors
  else if (
    error.code?.includes("permission") ||
    error.code?.includes("access") ||
    error.message?.includes("permission") ||
    error.message?.includes("access") ||
    error.message?.includes("authorization") ||
    error.message?.includes("forbidden") ||
    error.status === 403
  ) {
    determinedCategory = ErrorCategory.AUTHORIZATION;
  }

  // Network errors
  else if (
    error.message?.includes("network") ||
    error.message?.includes("connection") ||
    error.message?.includes("offline") ||
    error.message?.includes("timeout") ||
    error.code === "NETWORK_ERROR" ||
    error.status === 408 // Request Timeout
  ) {
    determinedCategory = ErrorCategory.NETWORK;
    isRetryable = true; // Network errors are typically retryable
  }

  // Server errors
  else if (
    error.status >= 500 ||
    error.message?.includes("server") ||
    error.code?.includes("server")
  ) {
    determinedCategory = ErrorCategory.SERVER;
    isRetryable = true; // Server errors are often retryable
  }

  // Validation errors
  else if (
    error.message?.includes("validation") ||
    error.message?.includes("invalid") ||
    error.message?.includes("required") ||
    error.status === 400 ||
    error.status === 422
  ) {
    determinedCategory = ErrorCategory.VALIDATION;
  }

  // Determine severity based on category and status code
  if (error.status >= 500 || determinedCategory === ErrorCategory.SERVER) {
    determinedSeverity = ErrorSeverity.ERROR;
  } else if (determinedCategory === ErrorCategory.NETWORK) {
    determinedSeverity = ErrorSeverity.WARNING;
  } else if (determinedCategory === ErrorCategory.VALIDATION) {
    determinedSeverity = ErrorSeverity.INFO;
  }

  // Rate limiting or too many requests should be retryable
  if (error.status === 429 || error.code?.includes("too-many-requests")) {
    isRetryable = true;
    determinedSeverity = ErrorSeverity.WARNING;
  }

  // Create the standardized error
  return {
    message: formatErrorMessage(error),
    severity: determinedSeverity,
    category: determinedCategory,
    code: error.code || error.status?.toString(),
    details: extractErrorDetails(error),
    timestamp,
    retryable: isRetryable,
  };
}

/**
 * Formats an error message from various error types
 * @param error The error to format
 * @returns A formatted error message string
 */
export function formatErrorMessage(error: any): string {
  // For authentication errors, use the existing formatAuthError function
  if (
    error.code?.startsWith("auth/") ||
    error.message?.includes("auth") ||
    error.message?.includes("authentication")
  ) {
    return formatAuthError(error);
  }

  // For other errors, extract the message in a standardized way
  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error_description) {
    return error.error_description;
  }

  if (error.error) {
    return typeof error.error === "string"
      ? error.error
      : formatErrorMessage(error.error);
  }

  return "An unexpected error occurred";
}

/**
 * Extracts detailed information from an error object
 * @param error The error to extract details from
 * @returns An object with error details
 */
function extractErrorDetails(error: any): any {
  const details: any = {};

  // Extract common error properties
  if (error.code) details.code = error.code;
  if (error.status) details.status = error.status;
  if (error.path) details.path = error.path;
  if (error.name) details.name = error.name;
  if (error.stack) details.stack = error.stack;

  // Extract Supabase-specific error details
  if (error.statusCode) details.statusCode = error.statusCode;
  if (error.hint) details.hint = error.hint;
  if (error.details) details.errorDetails = error.details;

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Logs an error with appropriate level based on severity
 * @param error The standardized error to log
 */
export function logError(error: StandardError): void {
  const { severity, message, category, code, details } = error;
  const logData = { message, category, code, details };

  switch (severity) {
    case ErrorSeverity.INFO:
      console.info(`[${category}]`, message, logData);
      break;
    case ErrorSeverity.WARNING:
      console.warn(`[${category}]`, message, logData);
      break;
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      console.error(`[${category}]`, message, logData);
      break;
    default:
      console.log(`[${category}]`, message, logData);
  }

  // In a production environment, you might want to send critical errors to a monitoring service
  if (severity === ErrorSeverity.CRITICAL) {
    // Example: sendToErrorMonitoring(error);
  }
}

/**
 * Determines if an error should be displayed to the user
 * @param error The standardized error
 * @returns True if the error should be displayed to the user
 */
export function shouldDisplayError(error: StandardError): boolean {
  // Don't show INFO level errors unless they're validation errors
  if (
    error.severity === ErrorSeverity.INFO &&
    error.category !== ErrorCategory.VALIDATION
  ) {
    return false;
  }

  // Always show ERROR and CRITICAL errors
  if (
    error.severity === ErrorSeverity.ERROR ||
    error.severity === ErrorSeverity.CRITICAL
  ) {
    return true;
  }

  // Show WARNING errors for authentication and authorization
  if (
    error.severity === ErrorSeverity.WARNING &&
    (error.category === ErrorCategory.AUTHENTICATION ||
      error.category === ErrorCategory.AUTHORIZATION)
  ) {
    return true;
  }

  // For other cases, show based on category
  return [
    ErrorCategory.AUTHENTICATION,
    ErrorCategory.AUTHORIZATION,
    ErrorCategory.VALIDATION,
  ].includes(error.category);
}

/**
 * Gets a user-friendly error message based on the standardized error
 * @param error The standardized error
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: StandardError): string {
  // For authentication errors, the formatted message is already user-friendly
  if (error.category === ErrorCategory.AUTHENTICATION) {
    return error.message;
  }

  // For network errors, provide a more helpful message
  if (error.category === ErrorCategory.NETWORK) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  // For server errors, provide a generic message
  if (error.category === ErrorCategory.SERVER) {
    return "The server encountered an error. Please try again later.";
  }

  // For validation errors, the message is usually already user-friendly
  if (error.category === ErrorCategory.VALIDATION) {
    return error.message;
  }

  // For authorization errors
  if (error.category === ErrorCategory.AUTHORIZATION) {
    return "You don't have permission to perform this action.";
  }

  // For other errors, use the original message or a generic one
  return error.message || "An unexpected error occurred. Please try again.";
}

/**
 * Gets a suggested action based on the error type
 * @param error The standardized error
 * @returns A suggested action for the user
 */
export function getSuggestedAction(error: StandardError): string | null {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      if (error.message.includes("password")) {
        return "Please check your password and try again.";
      }
      if (error.message.includes("email")) {
        return "Please check your email address and try again.";
      }
      if (error.message.includes("not found")) {
        return "The account doesn't exist. Please sign up first.";
      }
      if (error.message.includes("already in use")) {
        return "Try signing in instead, or use a different email address.";
      }
      if (
        error.message.includes("too many") ||
        error.message.includes("rate limit")
      ) {
        return "Please wait a moment before trying again.";
      }
      return "Please check your credentials and try again.";

    case ErrorCategory.NETWORK:
      return "Check your internet connection and try again.";

    case ErrorCategory.SERVER:
      return "Please try again later or contact support if the problem persists.";

    case ErrorCategory.VALIDATION:
      return "Please review the information you provided and try again.";

    case ErrorCategory.AUTHORIZATION:
      return "Contact your administrator if you need access to this feature.";

    default:
      return error.retryable ? "Please try again." : null;
  }
}

/**
 * Gets an appropriate icon name for the error type (for use with lucide-react icons)
 * @param error The standardized error
 * @returns An icon name string
 */
export function getErrorIcon(error: StandardError): string {
  switch (error.category) {
    case ErrorCategory.AUTHENTICATION:
      return "user-x";
    case ErrorCategory.AUTHORIZATION:
      return "shield-alert";
    case ErrorCategory.VALIDATION:
      return "alert-circle";
    case ErrorCategory.NETWORK:
      return "wifi-off";
    case ErrorCategory.SERVER:
      return "server-off";
    default:
      return error.severity === ErrorSeverity.CRITICAL
        ? "alert-triangle"
        : "alert-circle";
  }
}

/**
 * Gets a CSS class name for styling based on error severity
 * @param error The standardized error
 * @returns A CSS class name string
 */
export function getErrorSeverityClass(error: StandardError): string {
  switch (error.severity) {
    case ErrorSeverity.INFO:
      return "text-blue-500 bg-blue-50 border-blue-200";
    case ErrorSeverity.WARNING:
      return "text-amber-600 bg-amber-50 border-amber-200";
    case ErrorSeverity.ERROR:
      return "text-rose-600 bg-rose-50 border-rose-200";
    case ErrorSeverity.CRITICAL:
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}
