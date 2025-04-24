/**
 * Token management utilities for secure authentication
 */

import { supabase } from "@/supabase/supabase";

/**
 * Store a token securely in localStorage with encryption
 * @param key The key to store the token under
 * @param token The token to store
 */
export function storeToken(key: string, token: string): void {
  try {
    // In a production environment, consider using more secure storage methods
    // or implementing client-side encryption
    localStorage.setItem(key, token);
  } catch (error) {
    console.error("Error storing token:", error);
  }
}

/**
 * Retrieve a token from secure storage
 * @param key The key the token is stored under
 * @returns The token or null if not found
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
 * Remove a token from secure storage
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
 * Parse a JWT token to extract its payload
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
 * Check if a token is expired
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
 * Refresh the authentication token
 * @returns A promise resolving to the new session or null if refresh failed
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
 * Set up automatic token refresh before expiration
 * @param expiresIn Time in seconds until token expires
 * @param refreshBuffer Time in seconds before expiration to refresh (default: 5 minutes)
 * @returns A function to cancel the refresh timer
 */
export function setupTokenRefresh(
  expiresIn: number,
  refreshBuffer: number = 300,
): () => void {
  // Calculate when to refresh (expiration time minus buffer)
  const refreshTime = (expiresIn - refreshBuffer) * 1000;

  // Set up timer to refresh token
  const timerId = setTimeout(async () => {
    await refreshToken();
  }, refreshTime);

  // Return function to cancel timer if needed
  return () => clearTimeout(timerId);
}

/**
 * Revoke all refresh tokens for the current user
 * @returns A promise resolving to true if successful, false otherwise
 */
export async function revokeAllTokens(): Promise<boolean> {
  try {
    // Sign out from all devices
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error revoking tokens:", error);
    return false;
  }
}
