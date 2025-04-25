/**
 * Authentication utility functions for the FeedbackLoop platform
 */

/**
 * Validates password strength
 * @param password The password to validate
 * @returns An object containing validation result and error message
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { valid: true };
}

/**
 * Formats authentication errors for display
 * @param error The error object from Supabase
 * @returns A user-friendly error message
 */
export function formatAuthError(error: any): string {
  if (!error) return "";

  // Handle Supabase error messages directly
  if (error.message) {
    // Common Supabase error messages that need better formatting
    if (error.message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please check your credentials and try again.";
    }
    if (error.message.includes("Email not confirmed")) {
      return "Please verify your email address before signing in.";
    }
    if (error.message.includes("User already registered")) {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (error.message.includes("Password should be")) {
      return "Password is too weak. It should be at least 8 characters long with a mix of letters, numbers, and symbols.";
    }
    if (
      error.message.includes("rate limit") ||
      error.message.includes("too many requests")
    ) {
      return "Too many attempts. Please wait a moment before trying again.";
    }
  }

  // Handle known Supabase error codes
  switch (error.code) {
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/weak-password":
      return "The password is too weak.";
    case "auth/too-many-requests":
      return "Too many unsuccessful login attempts. Please try again later.";
    case "auth/requires-recent-login":
      return "This action requires you to re-authenticate. Please sign in again.";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled. Please try again.";
    case "auth/network-request-failed":
      return "A network error occurred. Please check your connection and try again.";
    case "auth/expired-action-code":
      return "This link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "This link is invalid. It may have been used already or was incorrectly formatted.";
    default:
      // If we have a message, use it, otherwise use a generic message
      return error.message || "An unexpected authentication error occurred.";
  }
}

/**
 * Parses JWT token to extract payload
 * @param token The JWT token
 * @returns The decoded payload or null if invalid
 */
export function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
}

/**
 * Checks if a token is expired
 * @param token The JWT token
 * @returns True if the token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Securely stores a token in localStorage with encryption
 * @param key The key to store the token under
 * @param token The token to store
 */
export function securelyStoreToken(key: string, token: string): void {
  try {
    // In a real implementation, we would encrypt the token before storing
    // For now, we'll just store it directly
    localStorage.setItem(key, token);
  } catch (error) {
    console.error("Error storing token:", error);
  }
}

/**
 * Retrieves a securely stored token from localStorage
 * @param key The key the token is stored under
 * @returns The token or null if not found
 */
export function getSecurelyStoredToken(key: string): string | null {
  try {
    // In a real implementation, we would decrypt the token after retrieving
    // For now, we'll just retrieve it directly
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

/**
 * Removes a securely stored token from localStorage
 * @param key The key the token is stored under
 */
export function removeSecurelyStoredToken(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing token:", error);
  }
}

/**
 * Configuration options for the retry function
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds before the first retry */
  initialDelay?: number;
  /** Maximum delay in milliseconds between retries */
  maxDelay?: number;
  /** Factor by which the delay increases with each retry */
  backoffFactor?: number;
  /** Whether to add jitter to the delay to prevent synchronized retries */
  jitter?: boolean;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: any) => boolean;
  /** Callback function to execute before each retry */
  onRetry?: (error: any, attempt: number, delay: number) => void;
  /** Callback function to execute on final failure */
  onFailure?: (error: any, attempts: number) => void;
  /** Whether to show UI feedback for retry attempts */
  showFeedback?: boolean;
  /** Context information for better error reporting */
  context?: Record<string, any>;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  isRetryable: (error) => {
    // Default implementation considers network errors and server errors as retryable
    if (!error) return false;

    // Check for network-related errors
    if (
      error.message &&
      (error.message.includes("network") ||
        error.message.includes("timeout") ||
        error.message.includes("connection") ||
        error.message.includes("offline"))
    ) {
      return true;
    }

    // Check for rate limiting or server errors
    if (error.status) {
      return (
        error.status === 429 || // Too Many Requests
        error.status === 408 || // Request Timeout
        (error.status >= 500 && error.status < 600)
      ); // Server errors
    }

    // Check for Supabase-specific errors that might be retryable
    if (
      error.code === "PGRST301" || // Timeout
      error.message?.includes("rate limit") ||
      error.message?.includes("timeout")
    ) {
      return true;
    }

    return false;
  },
  onRetry: (error, attempt, delay) => {
    console.log(`Retry attempt ${attempt} after ${delay}ms due to:`, error);
  },
  onFailure: (error, attempts) => {
    console.error(`Failed after ${attempts} attempts:`, error);
  },
  showFeedback: false,
  context: {},
};

/**
 * Calculates the delay for the next retry attempt with exponential backoff
 * @param attempt Current retry attempt (0-based)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  options: Required<RetryOptions>,
): number {
  // Calculate exponential backoff: initialDelay * backoffFactor^attempt
  let delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);

  // Apply maximum delay limit
  delay = Math.min(delay, options.maxDelay);

  // Add jitter if enabled (±25% randomness)
  if (options.jitter) {
    const jitterFactor = 0.5 + Math.random();
    delay = Math.floor(delay * jitterFactor);
  }

  return delay;
}

/**
 * Executes a function with automatic retry on failure
 * @param fn The function to execute and potentially retry
 * @param options Retry configuration options
 * @returns A promise that resolves with the function result or rejects after all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  // Merge provided options with defaults
  const retryOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: any;
  let attempts = 0;

  // Try the initial attempt plus retries
  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // For the first attempt (attempt=0), execute immediately
      if (attempt > 0) {
        attempts = attempt;
        // Calculate delay for this retry attempt
        const delay = calculateBackoffDelay(attempt - 1, retryOptions);

        // Execute onRetry callback if provided
        if (retryOptions.onRetry) {
          retryOptions.onRetry(lastError, attempt, delay);
        }

        // Wait for the calculated delay
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // If this was the last attempt or the error is not retryable, don't retry
      if (
        attempt >= retryOptions.maxRetries ||
        !retryOptions.isRetryable(error)
      ) {
        break;
      }
    }
  }

  // Call the onFailure callback if provided
  if (retryOptions.onFailure) {
    retryOptions.onFailure(lastError, attempts);
  }

  // If we've exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Specialized retry function for authentication operations
 * @param fn The authentication function to execute and potentially retry
 * @param options Retry configuration options
 * @returns A promise that resolves with the function result or rejects after all retries fail
 */
export async function withAuthRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  // Default options specifically tuned for authentication operations
  const authRetryOptions: Partial<RetryOptions> = {
    maxRetries: 2, // Fewer retries for auth to prevent account lockouts
    initialDelay: 1500, // Slightly longer initial delay
    showFeedback: true, // Show UI feedback by default for auth operations
    context: { operation: "authentication" },
    isRetryable: (error) => {
      // Don't retry certain auth errors like invalid credentials
      if (!error) return false;

      // Don't retry invalid credentials to prevent account lockouts
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("Invalid email") ||
        error.message?.includes("Invalid password") ||
        error.code === "auth/invalid-email" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        return false;
      }

      // Use the default isRetryable for other errors
      return DEFAULT_RETRY_OPTIONS.isRetryable(error);
    },
  };

  // Merge with any user-provided options
  return withRetry(fn, { ...authRetryOptions, ...options });
}

/**
 * Tracks consecutive failures for the same operation
 */
interface FailureTracker {
  operation: string;
  count: number;
  lastFailure: number;
  cooldownUntil: number | null;
}

// In-memory storage of failure trackers
const failureTrackers: Record<string, FailureTracker> = {};

/**
 * Tracks consecutive failures and implements adaptive retry strategies
 * @param operation Unique identifier for the operation
 * @param success Whether the operation was successful
 * @returns Information about the current failure state
 */
export function trackOperationFailure(
  operation: string,
  success: boolean,
): { inCooldown: boolean; remainingCooldown: number; failureCount: number } {
  const now = Date.now();
  const tracker = failureTrackers[operation] || {
    operation,
    count: 0,
    lastFailure: 0,
    cooldownUntil: null,
  };

  // Reset on success
  if (success) {
    tracker.count = 0;
    tracker.cooldownUntil = null;
    failureTrackers[operation] = tracker;
    return { inCooldown: false, remainingCooldown: 0, failureCount: 0 };
  }

  // Check if in cooldown
  if (tracker.cooldownUntil && now < tracker.cooldownUntil) {
    return {
      inCooldown: true,
      remainingCooldown: tracker.cooldownUntil - now,
      failureCount: tracker.count,
    };
  }

  // Increment failure count
  tracker.count += 1;
  tracker.lastFailure = now;

  // Implement exponential cooldown after threshold
  if (tracker.count >= 5) {
    // Calculate cooldown: 30 seconds after 5 failures, doubles each additional failure
    const cooldownDuration = Math.min(
      30000 * Math.pow(2, tracker.count - 5),
      24 * 60 * 60 * 1000, // Max 24 hours
    );
    tracker.cooldownUntil = now + cooldownDuration;
  }

  failureTrackers[operation] = tracker;

  return {
    inCooldown: !!tracker.cooldownUntil && now < tracker.cooldownUntil,
    remainingCooldown: tracker.cooldownUntil
      ? Math.max(0, tracker.cooldownUntil - now)
      : 0,
    failureCount: tracker.count,
  };
}

/**
 * Formats the remaining cooldown time in a human-readable format
 * @param ms Cooldown time in milliseconds
 * @returns Formatted cooldown time string
 */
export function formatCooldownTime(ms: number): string {
  if (ms < 60000) {
    // Less than a minute
    return `${Math.ceil(ms / 1000)} seconds`;
  } else if (ms < 3600000) {
    // Less than an hour
    return `${Math.ceil(ms / 60000)} minutes`;
  } else if (ms < 86400000) {
    // Less than a day
    return `${Math.ceil(ms / 3600000)} hours`;
  } else {
    // Days
    return `${Math.ceil(ms / 86400000)} days`;
  }
}

/**
 * Formats a time duration in milliseconds to a human-readable string
 * @param milliseconds Time in milliseconds
 * @returns Formatted time string
 */
export function formatTimeDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Expired";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
