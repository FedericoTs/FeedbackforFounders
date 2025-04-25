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
  DATABASE = "database",
  STORAGE = "storage",
  RATE_LIMIT = "rate_limit",
  SESSION = "session",
  TOKEN = "token",
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
  userFriendlyMessage?: string;
  suggestedAction?: string | null;
  errorId?: string; // Unique identifier for tracking errors
  source?: string; // Component or function where error occurred
  context?: Record<string, any>; // Additional context information
}

/**
 * Creates a standardized error object from various error types
 * @param error The error to standardize
 * @param category Optional category override
 * @param severity Optional severity override
 * @param context Optional context information
 * @returns A standardized error object
 */
export function createStandardError(
  error: any,
  category?: ErrorCategory,
  severity?: ErrorSeverity,
  context?: Record<string, any>,
): StandardError {
  // Default values
  const defaultCategory = ErrorCategory.UNKNOWN;
  const defaultSeverity = ErrorSeverity.ERROR;
  const timestamp = Date.now();
  const errorId = generateErrorId();

  // Handle null or undefined errors
  if (!error) {
    return {
      message: "An unknown error occurred",
      severity: severity || defaultSeverity,
      category: category || defaultCategory,
      timestamp,
      retryable: false,
      errorId,
      context,
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
      errorId,
      context,
    };
  }

  // Determine error category based on error properties
  let determinedCategory = category || defaultCategory;
  let determinedSeverity = severity || defaultSeverity;
  let isRetryable = false;
  let source = error.source || context?.source || undefined;

  // Authentication errors
  if (
    error.code?.startsWith("auth/") ||
    error.message?.includes("auth") ||
    error.message?.includes("authentication") ||
    error.message?.includes("login") ||
    error.message?.includes("password") ||
    error.message?.includes("email") ||
    error.message?.includes("sign in") ||
    error.message?.includes("sign up")
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

  // Database errors
  else if (
    error.code?.includes("db") ||
    error.code?.includes("database") ||
    error.code?.includes("sql") ||
    error.code?.includes("query") ||
    error.message?.includes("database") ||
    error.message?.includes("sql") ||
    error.message?.includes("query failed")
  ) {
    determinedCategory = ErrorCategory.DATABASE;
    isRetryable =
      error.code?.includes("timeout") || error.code?.includes("connection");
  }

  // Storage errors
  else if (
    error.code?.includes("storage") ||
    error.message?.includes("storage") ||
    error.message?.includes("upload") ||
    error.message?.includes("download") ||
    error.message?.includes("file")
  ) {
    determinedCategory = ErrorCategory.STORAGE;
    isRetryable = !error.message?.includes("not found");
  }

  // Rate limit errors
  else if (
    error.status === 429 ||
    error.code?.includes("too-many-requests") ||
    error.message?.includes("rate limit") ||
    error.message?.includes("too many requests")
  ) {
    determinedCategory = ErrorCategory.RATE_LIMIT;
    isRetryable = true;
    determinedSeverity = ErrorSeverity.WARNING;
  }

  // Session errors
  else if (
    error.message?.includes("session") ||
    error.code?.includes("session") ||
    error.message?.includes("expired session")
  ) {
    determinedCategory = ErrorCategory.SESSION;
    isRetryable = true;
  }

  // Token errors
  else if (
    error.message?.includes("token") ||
    error.code?.includes("token") ||
    error.message?.includes("jwt") ||
    error.message?.includes("expired token")
  ) {
    determinedCategory = ErrorCategory.TOKEN;
    isRetryable = true;
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
  } else if (determinedCategory === ErrorCategory.RATE_LIMIT) {
    determinedSeverity = ErrorSeverity.WARNING;
  } else if (
    determinedCategory === ErrorCategory.SESSION ||
    determinedCategory === ErrorCategory.TOKEN
  ) {
    determinedSeverity = ErrorSeverity.WARNING;
  }

  // Extract formatted message and details
  const formattedMessage = formatErrorMessage(error);
  const details = extractErrorDetails(error);

  // Get user-friendly message and suggested action
  const standardError: StandardError = {
    message: formattedMessage,
    severity: determinedSeverity,
    category: determinedCategory,
    code: error.code || error.status?.toString(),
    details,
    timestamp,
    retryable: isRetryable,
    errorId,
    source,
    context,
  };

  // Add user-friendly message and suggested action
  standardError.userFriendlyMessage =
    getUserFriendlyErrorMessage(standardError);
  standardError.suggestedAction = getSuggestedAction(standardError);

  return standardError;
}

/**
 * Generates a unique error ID for tracking
 * @returns A unique error ID string
 */
function generateErrorId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
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

  // Extract additional context if available
  if (error.context) details.context = error.context;
  if (error.source) details.source = error.source;
  if (error.request)
    details.request = {
      url: error.request.url,
      method: error.request.method,
    };

  return Object.keys(details).length > 0 ? details : undefined;
}

/**
 * Logs an error with appropriate level based on severity
 * @param error The standardized error to log
 * @param additionalContext Optional additional context to include in the log
 */
export function logError(
  error: StandardError,
  additionalContext?: Record<string, any>,
): void {
  const { severity, message, category, code, details, errorId, source } = error;
  const logData = {
    errorId,
    message,
    category,
    code,
    details,
    source,
    ...additionalContext,
  };

  switch (severity) {
    case ErrorSeverity.INFO:
      console.info(`[${category}] [${errorId}]`, message, logData);
      break;
    case ErrorSeverity.WARNING:
      console.warn(`[${category}] [${errorId}]`, message, logData);
      break;
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      console.error(`[${category}] [${errorId}]`, message, logData);
      break;
    default:
      console.log(`[${category}] [${errorId}]`, message, logData);
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
      error.category === ErrorCategory.AUTHORIZATION ||
      error.category === ErrorCategory.SESSION ||
      error.category === ErrorCategory.TOKEN)
  ) {
    return true;
  }

  // For other cases, show based on category
  return [
    ErrorCategory.AUTHENTICATION,
    ErrorCategory.AUTHORIZATION,
    ErrorCategory.VALIDATION,
    ErrorCategory.SESSION,
    ErrorCategory.TOKEN,
    ErrorCategory.RATE_LIMIT,
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

  // For database errors
  if (error.category === ErrorCategory.DATABASE) {
    return "There was a problem accessing the database. Please try again later.";
  }

  // For storage errors
  if (error.category === ErrorCategory.STORAGE) {
    return "There was a problem with file storage. Please try again later.";
  }

  // For rate limit errors
  if (error.category === ErrorCategory.RATE_LIMIT) {
    return "You've made too many requests. Please wait a moment before trying again.";
  }

  // For session errors
  if (error.category === ErrorCategory.SESSION) {
    return "Your session has expired or is invalid. Please sign in again.";
  }

  // For token errors
  if (error.category === ErrorCategory.TOKEN) {
    return "Your authentication token has expired. Please sign in again.";
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

    case ErrorCategory.DATABASE:
      return "Please try again later. If the problem persists, contact support.";

    case ErrorCategory.STORAGE:
      if (error.message.includes("not found")) {
        return "The requested file could not be found. Please check the file path.";
      }
      return "Please try uploading the file again.";

    case ErrorCategory.RATE_LIMIT:
      return "Please wait a few moments before trying again.";

    case ErrorCategory.SESSION:
      return "Please sign in again to continue.";

    case ErrorCategory.TOKEN:
      return "Please sign in again to refresh your authentication.";

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
    case ErrorCategory.DATABASE:
      return "database";
    case ErrorCategory.STORAGE:
      return "file-x";
    case ErrorCategory.RATE_LIMIT:
      return "timer";
    case ErrorCategory.SESSION:
      return "log-out";
    case ErrorCategory.TOKEN:
      return "key-off";
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

/**
 * Creates a retry function with exponential backoff
 * @param fn The function to retry
 * @param options Retry options
 * @returns A function that will retry the original function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (error: any, attempt: number) => void;
  },
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry = () => {},
  } = options || {};

  let attempt = 0;
  let lastError: any;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay,
      );

      // Add jitter to prevent synchronized retries
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);

      // Call onRetry callback
      onRetry(error, attempt);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError;
}

/**
 * Tracks error occurrences to implement circuit breaker pattern
 */
const errorTracker: Record<
  string,
  { count: number; lastError: number; cooldownUntil: number | null }
> = {};

/**
 * Checks if an operation should be attempted based on previous errors
 * @param operationKey A unique key identifying the operation
 * @returns Whether the operation should be attempted
 */
export function shouldAttemptOperation(operationKey: string): boolean {
  const tracker = errorTracker[operationKey];
  if (!tracker) return true;

  const now = Date.now();
  if (tracker.cooldownUntil && now < tracker.cooldownUntil) {
    return false;
  }

  return true;
}

/**
 * Records an error occurrence for circuit breaker pattern
 * @param operationKey A unique key identifying the operation
 * @param success Whether the operation was successful
 */
export function recordOperationResult(
  operationKey: string,
  success: boolean,
): void {
  const now = Date.now();
  const tracker = errorTracker[operationKey] || {
    count: 0,
    lastError: 0,
    cooldownUntil: null,
  };

  if (success) {
    // Reset on success
    tracker.count = 0;
    tracker.cooldownUntil = null;
  } else {
    // Increment failure count
    tracker.count += 1;
    tracker.lastError = now;

    // Implement circuit breaker after threshold
    if (tracker.count >= 5) {
      // Exponential cooldown: 5s, 10s, 20s, etc. up to 5 minutes
      const cooldownDuration = Math.min(
        5000 * Math.pow(2, tracker.count - 5),
        5 * 60 * 1000,
      );
      tracker.cooldownUntil = now + cooldownDuration;
    }
  }

  errorTracker[operationKey] = tracker;
}

/**
 * Gets the remaining cooldown time for an operation
 * @param operationKey A unique key identifying the operation
 * @returns The remaining cooldown time in milliseconds, or 0 if not in cooldown
 */
export function getOperationCooldownTime(operationKey: string): number {
  const tracker = errorTracker[operationKey];
  if (!tracker || !tracker.cooldownUntil) return 0;

  const now = Date.now();
  return Math.max(0, tracker.cooldownUntil - now);
}

/**
 * Formats a cooldown time in a human-readable format
 * @param ms Cooldown time in milliseconds
 * @returns Formatted cooldown time string
 */
export function formatCooldownTime(ms: number): string {
  if (ms < 1000) return "less than a second";
  if (ms < 60000) return `${Math.ceil(ms / 1000)} seconds`;
  if (ms < 3600000) return `${Math.ceil(ms / 60000)} minutes`;
  return `${Math.ceil(ms / 3600000)} hours`;
}
