import { supabase } from "@/supabase/supabase";

/**
 * Stores a token in localStorage
 * @param key The key to store the token under
 * @param token The token to store
 */
export function storeToken(key: string, token: string): void {
  try {
    localStorage.setItem(key, token);
  } catch (error) {
    console.error("Error storing token:", error);
  }
}

/**
 * Retrieves a token from localStorage
 * @param key The key the token is stored under
 * @returns The token, or null if not found
 */
export function getToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

/**
 * Removes a token from localStorage
 * @param key The key the token is stored under
 */
export function removeToken(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing token:", error);
  }
}

/**
 * Parses a JWT token to extract its payload
 * @param token The JWT token to parse
 * @returns The parsed payload, or null if invalid
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
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
 * @param token The token to check
 * @returns True if the token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

/**
 * Refreshes the current session token
 * @returns The refreshed session, or null if refresh failed
 */
export async function refreshToken() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Sets up automatic token refresh before expiration
 * @param expiresIn Token expiration time in seconds
 * @param refreshBuffer Time in seconds before expiration to refresh (default: 5 minutes)
 * @returns A function to cancel the refresh timer
 */
export function setupTokenRefresh(
  expiresIn: number,
  refreshBuffer: number = 300,
): () => void {
  // Calculate refresh time (expiration time minus buffer)
  const refreshTime = (expiresIn - refreshBuffer) * 1000;

  // Set up timer to refresh token
  const timerId = setTimeout(async () => {
    await refreshToken();
  }, refreshTime);

  // Return function to cancel timer
  return () => clearTimeout(timerId);
}

/**
 * Revokes all tokens for the current user (signs out from all devices)
 * @returns True if successful, false otherwise
 */
export async function revokeAllTokens(): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error revoking tokens:", error);
    return false;
  }
}

/**
 * Gets information about the current session
 * @returns Session information including validity and time remaining
 */
export async function getSessionInfo() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      return {
        valid: false,
        expiresAt: null,
        timeRemaining: 0,
        issuedAt: null,
      };
    }

    const expiresAt = new Date(session.expires_at || "");
    const issuedAt = new Date(session.created_at || "");
    const now = new Date();
    const timeRemaining = expiresAt.getTime() - now.getTime();

    return {
      valid: timeRemaining > 0,
      expiresAt,
      timeRemaining: Math.max(0, timeRemaining),
      issuedAt,
    };
  } catch (error) {
    console.error("Error getting session info:", error);
    return {
      valid: false,
      expiresAt: null,
      timeRemaining: 0,
      issuedAt: null,
    };
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
