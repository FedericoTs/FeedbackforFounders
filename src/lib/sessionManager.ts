/**
 * Session management utilities for handling session timeouts and warnings
 */

import { refreshToken, getSessionInfo } from "./tokenManager";

// Configuration
const DEFAULT_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const DEFAULT_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// Store session activity information
interface SessionActivityInfo {
  lastActivity: number;
  warningDisplayed: boolean;
  warningThreshold: number;
  idleTimeout: number;
  absoluteTimeout: number;
  sessionStartTime: number;
  activityEvents: string[];
}

// Global session activity state
let sessionActivity: SessionActivityInfo = {
  lastActivity: Date.now(),
  warningDisplayed: false,
  warningThreshold: DEFAULT_WARNING_THRESHOLD,
  idleTimeout: DEFAULT_IDLE_TIMEOUT,
  absoluteTimeout: DEFAULT_ABSOLUTE_TIMEOUT,
  sessionStartTime: Date.now(),
  activityEvents: ["click", "keypress", "mousemove", "scroll", "touchstart"],
};

// Event listeners for tracking user activity
type ActivityListener = () => void;
const activityListeners: ActivityListener[] = [];

// Event listeners for session timeout warnings
type TimeoutWarningListener = (
  timeRemaining: number,
  threshold: number,
) => void;
const timeoutWarningListeners: TimeoutWarningListener[] = [];

// Event listeners for session expiration
type SessionExpiredListener = () => void;
const sessionExpiredListeners: SessionExpiredListener[] = [];

/**
 * Initialize session activity tracking
 * @param options Configuration options for session management
 * @returns Function to clean up event listeners
 */
export function initSessionTracking(options?: {
  warningThreshold?: number;
  idleTimeout?: number;
  absoluteTimeout?: number;
  activityEvents?: string[];
}): () => void {
  // Update configuration with provided options
  if (options?.warningThreshold) {
    sessionActivity.warningThreshold = options.warningThreshold;
  }
  if (options?.idleTimeout) {
    sessionActivity.idleTimeout = options.idleTimeout;
  }
  if (options?.absoluteTimeout) {
    sessionActivity.absoluteTimeout = options.absoluteTimeout;
  }
  if (options?.activityEvents) {
    sessionActivity.activityEvents = options.activityEvents;
  }

  // Reset session start time
  sessionActivity.sessionStartTime = Date.now();
  sessionActivity.lastActivity = Date.now();

  // Function to update last activity timestamp
  const updateActivity = () => {
    const now = Date.now();
    sessionActivity.lastActivity = now;
    sessionActivity.warningDisplayed = false;

    // Notify activity listeners
    activityListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("Error in activity listener:", error);
      }
    });
  };

  // Add event listeners for user activity
  sessionActivity.activityEvents.forEach((eventType) => {
    document.addEventListener(eventType, updateActivity, { passive: true });
  });

  // Return cleanup function
  return () => {
    sessionActivity.activityEvents.forEach((eventType) => {
      document.removeEventListener(eventType, updateActivity);
    });
  };
}

/**
 * Check if the session has timed out due to inactivity or absolute timeout
 * @returns Object with timeout status and reason
 */
export function checkSessionTimeout(): {
  isTimedOut: boolean;
  reason: "idle" | "absolute" | "none";
  timeRemaining: number;
} {
  const now = Date.now();
  const idleTime = now - sessionActivity.lastActivity;
  const sessionDuration = now - sessionActivity.sessionStartTime;

  // Check absolute timeout first (takes precedence)
  if (sessionDuration >= sessionActivity.absoluteTimeout) {
    return {
      isTimedOut: true,
      reason: "absolute",
      timeRemaining: 0,
    };
  }

  // Then check idle timeout
  if (idleTime >= sessionActivity.idleTimeout) {
    return {
      isTimedOut: true,
      reason: "idle",
      timeRemaining: 0,
    };
  }

  // Calculate time remaining before idle timeout
  const idleTimeRemaining = Math.max(0, sessionActivity.idleTimeout - idleTime);
  const absoluteTimeRemaining = Math.max(
    0,
    sessionActivity.absoluteTimeout - sessionDuration,
  );

  // Return the smaller of the two remaining times
  const timeRemaining = Math.min(idleTimeRemaining, absoluteTimeRemaining);

  return {
    isTimedOut: false,
    reason: "none",
    timeRemaining,
  };
}

/**
 * Check if a session timeout warning should be displayed
 * @returns Object with warning status and time remaining
 */
export function checkSessionWarning(): {
  shouldWarn: boolean;
  timeRemaining: number;
  threshold: number;
} {
  const { isTimedOut, timeRemaining } = checkSessionTimeout();

  // Don't show warning if already timed out
  if (isTimedOut) {
    return {
      shouldWarn: false,
      timeRemaining: 0,
      threshold: sessionActivity.warningThreshold,
    };
  }

  // Show warning if time remaining is less than warning threshold
  const shouldWarn =
    timeRemaining > 0 &&
    timeRemaining <= sessionActivity.warningThreshold &&
    !sessionActivity.warningDisplayed;

  // Update warning displayed flag
  if (shouldWarn) {
    sessionActivity.warningDisplayed = true;

    // Notify timeout warning listeners
    timeoutWarningListeners.forEach((listener) => {
      try {
        listener(timeRemaining, sessionActivity.warningThreshold);
      } catch (error) {
        console.error("Error in timeout warning listener:", error);
      }
    });
  }

  return {
    shouldWarn,
    timeRemaining,
    threshold: sessionActivity.warningThreshold,
  };
}

/**
 * Extend the current session by refreshing the token and updating activity timestamp
 * @returns Promise resolving to true if session was successfully extended
 */
export async function extendSession(): Promise<boolean> {
  try {
    // Refresh the token
    const session = await refreshToken();
    if (!session) {
      return false;
    }

    // Update activity timestamp
    sessionActivity.lastActivity = Date.now();
    sessionActivity.warningDisplayed = false;

    // Notify activity listeners
    activityListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("Error in activity listener:", error);
      }
    });

    return true;
  } catch (error) {
    console.error("Error extending session:", error);
    return false;
  }
}

/**
 * Register a listener for user activity events
 * @param listener Function to call when user activity is detected
 * @returns Function to unregister the listener
 */
export function onUserActivity(listener: ActivityListener): () => void {
  activityListeners.push(listener);
  return () => {
    const index = activityListeners.indexOf(listener);
    if (index !== -1) {
      activityListeners.splice(index, 1);
    }
  };
}

/**
 * Register a listener for session timeout warnings
 * @param listener Function to call when a session timeout warning should be displayed
 * @returns Function to unregister the listener
 */
export function onSessionWarning(listener: TimeoutWarningListener): () => void {
  timeoutWarningListeners.push(listener);
  return () => {
    const index = timeoutWarningListeners.indexOf(listener);
    if (index !== -1) {
      timeoutWarningListeners.splice(index, 1);
    }
  };
}

/**
 * Register a listener for session expiration events
 * @param listener Function to call when the session has expired
 * @returns Function to unregister the listener
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.push(listener);
  return () => {
    const index = sessionExpiredListeners.indexOf(listener);
    if (index !== -1) {
      sessionExpiredListeners.splice(index, 1);
    }
  };
}

/**
 * Manually trigger a session expired event
 * This is useful for testing or for forcing a session expiration
 */
export function triggerSessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Error in session expired listener:", error);
    }
  });
}

/**
 * Get the current session activity information
 * @returns Copy of the current session activity state
 */
export function getSessionActivity(): SessionActivityInfo {
  return { ...sessionActivity };
}

/**
 * Update session timeout configuration
 * @param options New configuration options
 */
export function updateSessionConfig(options: {
  warningThreshold?: number;
  idleTimeout?: number;
  absoluteTimeout?: number;
}): void {
  if (options.warningThreshold !== undefined) {
    sessionActivity.warningThreshold = options.warningThreshold;
  }
  if (options.idleTimeout !== undefined) {
    sessionActivity.idleTimeout = options.idleTimeout;
  }
  if (options.absoluteTimeout !== undefined) {
    sessionActivity.absoluteTimeout = options.absoluteTimeout;
  }
}

/**
 * Reset the session activity tracking
 * This is useful after a user logs in or when you want to start fresh
 */
export function resetSessionActivity(): void {
  sessionActivity.lastActivity = Date.now();
  sessionActivity.sessionStartTime = Date.now();
  sessionActivity.warningDisplayed = false;
}
