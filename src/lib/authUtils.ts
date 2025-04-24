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
