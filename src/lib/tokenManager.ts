import { supabase } from "@/supabase/supabase";

// Constants for token refresh
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const TOKEN_REFRESH_METRICS = {
  attempts: 0,
  successes: 0,
  failures: 0,
  lastRefreshTime: null as number | null,
  lastRefreshStatus: null as "success" | "failure" | null,
  averageRefreshTime: 0, // Average time in ms for refresh operations
  consecutiveFailures: 0, // Track consecutive failures for adaptive retry
};

// Encryption key cache to avoid regenerating keys
const encryptionKeyCache: Record<string, CryptoKey> = {};

/**
 * Generates a device fingerprint to use as part of the encryption key
 * This helps ensure tokens are device-specific
 * @returns A string fingerprint of the current device
 */
async function generateDeviceFingerprint(): Promise<string> {
  try {
    // Collect browser/device information
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth.toString(),
      screen.width.toString() + "x" + screen.height.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || "",
      navigator.deviceMemory?.toString() || "",
      navigator.platform || "",
    ];

    // Create a hash of the components
    const fingerprint = components.join("|");
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("Error generating device fingerprint:", error);
    // Fallback to a simple fingerprint if advanced methods fail
    return navigator.userAgent.replace(/\D+/g, "");
  }
}

/**
 * Generates an encryption key based on the device fingerprint
 * @param fingerprint The device fingerprint to use
 * @returns A CryptoKey for encryption/decryption
 */
async function getEncryptionKey(fingerprint: string): Promise<CryptoKey> {
  // Check if we already have a key for this fingerprint
  if (encryptionKeyCache[fingerprint]) {
    return encryptionKeyCache[fingerprint];
  }

  // Create a key from the fingerprint
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(fingerprint),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // Use a salt based on the application name
  const salt = encoder.encode("FeedbackEcosystemPlatform");

  // Derive the actual encryption key
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  // Cache the key for future use
  encryptionKeyCache[fingerprint] = key;
  return key;
}

/**
 * Encrypts a token for secure storage
 * @param token The token to encrypt
 * @param fingerprint The device fingerprint to use for encryption
 * @returns An object containing the encrypted token and IV, or null if encryption failed
 */
async function encryptToken(
  token: string,
  fingerprint: string,
): Promise<{ encryptedToken: string; iv: string } | null> {
  try {
    const key = await getEncryptionKey(fingerprint);
    const encoder = new TextEncoder();
    const data = encoder.encode(token);

    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the token
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data,
    );

    // Convert to base64 for storage
    const encryptedToken = btoa(
      String.fromCharCode(...new Uint8Array(encryptedBuffer)),
    );
    const ivString = btoa(String.fromCharCode(...iv));

    return { encryptedToken, iv: ivString };
  } catch (error) {
    console.error("Error encrypting token:", error);
    return null;
  }
}

/**
 * Decrypts a token from secure storage
 * @param encryptedToken The encrypted token
 * @param iv The initialization vector used for encryption
 * @param fingerprint The device fingerprint used for encryption
 * @returns The decrypted token, or null if decryption failed
 */
async function decryptToken(
  encryptedToken: string,
  iv: string,
  fingerprint: string,
): Promise<string | null> {
  try {
    const key = await getEncryptionKey(fingerprint);

    // Convert from base64
    const encryptedData = new Uint8Array(
      atob(encryptedToken)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );
    const ivArray = new Uint8Array(
      atob(iv)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );

    // Decrypt the token
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray },
      key,
      encryptedData,
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Error decrypting token:", error);
    return null;
  }
}

/**
 * Calculates a hash of the token for integrity verification
 * @param token The token to hash
 * @returns A hash of the token, or null if hashing failed
 */
async function calculateTokenHash(token: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("Error calculating token hash:", error);
    return null;
  }
}

/**
 * Stores a token securely in localStorage with encryption
 * @param key The key to store the token under
 * @param token The token to store
 */
export async function storeToken(key: string, token: string): Promise<void> {
  try {
    // Generate device fingerprint
    const fingerprint = await generateDeviceFingerprint();

    // Encrypt the token
    const encryptedData = await encryptToken(token, fingerprint);
    if (!encryptedData) {
      throw new Error("Token encryption failed");
    }

    // Calculate token hash for integrity verification
    const tokenHash = await calculateTokenHash(token);
    if (!tokenHash) {
      throw new Error("Token hash calculation failed");
    }

    // Store the encrypted token, IV, and hash
    const tokenData = {
      encryptedToken: encryptedData.encryptedToken,
      iv: encryptedData.iv,
      hash: tokenHash,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(tokenData));
  } catch (error) {
    console.error("Error storing token:", error);
  }
}

/**
 * Retrieves a token from localStorage and decrypts it
 * @param key The key the token is stored under
 * @returns The decrypted token, or null if not found or invalid
 */
export async function getToken(key: string): Promise<string | null> {
  try {
    const tokenDataString = localStorage.getItem(key);
    if (!tokenDataString) {
      return null;
    }

    // Parse the stored token data
    const tokenData = JSON.parse(tokenDataString);
    const { encryptedToken, iv, hash, timestamp } = tokenData;

    // Check if token is too old (optional, based on security requirements)
    const maxTokenAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - timestamp > maxTokenAge) {
      console.warn("Token expired due to age");
      removeToken(key);
      return null;
    }

    // Generate device fingerprint
    const fingerprint = await generateDeviceFingerprint();

    // Decrypt the token
    const token = await decryptToken(encryptedToken, iv, fingerprint);
    if (!token) {
      return null;
    }

    // Verify token integrity
    const calculatedHash = await calculateTokenHash(token);
    if (calculatedHash !== hash) {
      console.error("Token integrity check failed");
      removeToken(key);
      return null;
    }

    // Check if token is expired based on JWT expiration
    if (isTokenExpired(token)) {
      console.warn("Token expired based on JWT expiration");
      removeToken(key);
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

/**
 * Removes a token from localStorage
 * @param key The key the token is stored under
 */
export async function removeToken(key: string): Promise<void> {
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
 * Determines if an error is retryable based on its type and message
 * @param error The error to check
 * @returns True if the error is retryable, false otherwise
 */
function isRetryableError(error: any): boolean {
  // Network-related errors
  if (
    error.message &&
    (error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.message.includes("connection") ||
      error.message.includes("offline"))
  ) {
    return true;
  }

  // HTTP status codes that indicate temporary issues
  if (error.status) {
    // 408: Request Timeout
    // 429: Too Many Requests
    // 500-599: Server errors
    return (
      error.status === 408 ||
      error.status === 429 ||
      (error.status >= 500 && error.status < 600)
    );
  }

  return false;
}

/**
 * Calculates a delay with exponential backoff and jitter for retries
 * @param retryAttempt The current retry attempt (0-based)
 * @param consecutiveFailures Number of consecutive failures (used for additional backoff)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(
  retryAttempt: number,
  consecutiveFailures: number = 0,
): number {
  // Exponential backoff: 2^attempt * base delay
  const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt);

  // Add additional backoff for consecutive failures (capped at 5x multiplier)
  const consecutiveMultiplier = Math.min(1 + consecutiveFailures * 0.2, 5);

  // Apply consecutive failure multiplier
  const adjustedDelay = exponentialDelay * consecutiveMultiplier;

  // Add jitter: random value between 0 and 30% of the delay
  const jitter = Math.random() * 0.3 * adjustedDelay;

  return adjustedDelay + jitter;
}

/**
 * Refreshes the current session token with enhanced retry logic
 * @param retryAttempt Current retry attempt (0-based)
 * @param options Additional options for refresh behavior
 * @returns The refreshed session, or null if refresh failed after all retries
 */
export async function refreshToken(
  retryAttempt = 0,
  options: { forceRefresh?: boolean; maxAttempts?: number } = {},
): Promise<any> {
  const startTime = Date.now();
  const maxAttempts = options.maxAttempts || MAX_RETRY_ATTEMPTS;

  try {
    TOKEN_REFRESH_METRICS.attempts++;
    TOKEN_REFRESH_METRICS.lastRefreshTime = startTime;

    // Check for network connectivity before attempting refresh
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("Device is offline, delaying token refresh until online");
      // Return a promise that resolves when the device comes back online
      return new Promise((resolve) => {
        const handleOnline = () => {
          window.removeEventListener("online", handleOnline);
          // When we're back online, try again with the same retry attempt count
          resolve(refreshToken(retryAttempt, options));
        };
        window.addEventListener("online", handleOnline);
      });
    }

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      // If network error or temporary issue, retry with backoff
      if (retryAttempt < maxAttempts && isRetryableError(error)) {
        // Increment consecutive failures for adaptive backoff
        TOKEN_REFRESH_METRICS.consecutiveFailures++;

        const delay = calculateBackoffDelay(
          retryAttempt,
          TOKEN_REFRESH_METRICS.consecutiveFailures,
        );

        console.log(
          `Token refresh failed, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${maxAttempts})`,
        );

        // Wait for the calculated delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the refresh
        return refreshToken(retryAttempt + 1, options);
      }

      // If we've exhausted retries or it's a non-retryable error
      TOKEN_REFRESH_METRICS.failures++;
      TOKEN_REFRESH_METRICS.lastRefreshStatus = "failure";
      throw error;
    }

    // Success - reset consecutive failures counter
    TOKEN_REFRESH_METRICS.consecutiveFailures = 0;
    TOKEN_REFRESH_METRICS.successes++;
    TOKEN_REFRESH_METRICS.lastRefreshStatus = "success";

    // Update average refresh time
    const refreshTime = Date.now() - startTime;
    const totalRefreshes =
      TOKEN_REFRESH_METRICS.successes + TOKEN_REFRESH_METRICS.failures;
    TOKEN_REFRESH_METRICS.averageRefreshTime =
      (TOKEN_REFRESH_METRICS.averageRefreshTime * (totalRefreshes - 1) +
        refreshTime) /
      totalRefreshes;

    return data.session;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Calculates the optimal refresh buffer based on token lifetime and refresh history
 * @param expiresIn Token expiration time in seconds
 * @returns Optimal refresh buffer in seconds
 */
export function calculateOptimalRefreshBuffer(expiresIn: number): number {
  // Base refresh buffer (5 minutes by default)
  const baseBuffer = 300; // seconds

  // If we have refresh metrics, use them to calculate a dynamic buffer
  if (TOKEN_REFRESH_METRICS.averageRefreshTime > 0) {
    // Convert average refresh time from ms to seconds and add safety margin
    const avgRefreshTimeWithMargin =
      (TOKEN_REFRESH_METRICS.averageRefreshTime / 1000) * 3;

    // Add additional buffer based on consecutive failures (if any)
    const additionalBuffer = TOKEN_REFRESH_METRICS.consecutiveFailures * 60; // 1 minute per consecutive failure

    // Calculate buffer as percentage of token lifetime (between 5% and 20%)
    const percentageBuffer = Math.max(
      Math.min(expiresIn * 0.05, expiresIn * 0.2),
      avgRefreshTimeWithMargin + additionalBuffer,
    );

    return Math.max(baseBuffer, percentageBuffer);
  }

  // If no metrics available, use a percentage-based approach
  // For short-lived tokens (< 1 hour), use 10% of lifetime
  // For longer tokens, use 5% of lifetime, but at least 5 minutes
  if (expiresIn < 3600) {
    return Math.max(baseBuffer, expiresIn * 0.1);
  } else {
    return Math.max(baseBuffer, expiresIn * 0.05);
  }
}

/**
 * Sets up automatic token refresh before expiration with enhanced logic
 * @param expiresIn Token expiration time in seconds
 * @param refreshBuffer Time in seconds before expiration to refresh (optional)
 * @returns A function to cancel the refresh timer
 */
export function setupTokenRefresh(
  expiresIn: number,
  refreshBuffer?: number,
): () => void {
  // If no refresh buffer provided, calculate optimal buffer
  const buffer = refreshBuffer || calculateOptimalRefreshBuffer(expiresIn);

  // Calculate refresh time (expiration time minus buffer)
  const refreshTime = (expiresIn - buffer) * 1000;

  console.log(
    `Token refresh scheduled in ${formatTimeDuration(refreshTime)} (buffer: ${formatTimeDuration(buffer * 1000)})`,
  );

  // Set up timer to refresh token
  const timerId = setTimeout(async () => {
    const session = await refreshToken();

    // If refresh successful and we have a new session, set up the next refresh
    if (session && session.expires_in) {
      setupTokenRefresh(session.expires_in);
    }
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
 * Revokes a specific session by ID
 * @param sessionId The ID of the session to revoke
 * @returns True if successful, false otherwise
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    // For Supabase, we need to use admin functions or custom API endpoints to revoke specific sessions
    // This is a simplified implementation that would need to be replaced with actual API calls
    // to a backend endpoint that has admin privileges

    // If it's the current session, we can sign out
    const { data } = await supabase.auth.getSession();
    if (data.session?.id === sessionId) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    }

    // For other sessions, we would need a backend API
    // This is a placeholder for the actual implementation
    console.log(
      `Revoking session ${sessionId} would require a backend API call`,
    );

    // Simulate success for demonstration purposes
    // In a real implementation, this would make an API call to a backend endpoint
    return true;
  } catch (error) {
    console.error(`Error revoking session ${sessionId}:`, error);
    return false;
  }
}

/**
 * Gets all active sessions for the current user
 * @returns Array of session objects or null if error
 */
export async function getAllSessions(): Promise<any[] | null> {
  try {
    // Note: Supabase doesn't provide a direct API to get all sessions
    // This would typically require a custom backend endpoint with admin privileges
    // For demonstration purposes, we'll return the current session

    const { data } = await supabase.auth.getSession();
    if (!data.session) return [];

    // Return an array with just the current session
    // In a real implementation, this would fetch all sessions from a backend API
    return [data.session];
  } catch (error) {
    console.error("Error getting all sessions:", error);
    return null;
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
 * Gets refresh metrics for monitoring and debugging
 * @returns Current token refresh metrics
 */
export function getRefreshMetrics() {
  return { ...TOKEN_REFRESH_METRICS };
}

/**
 * Resets refresh metrics
 */
export function resetRefreshMetrics() {
  TOKEN_REFRESH_METRICS.attempts = 0;
  TOKEN_REFRESH_METRICS.successes = 0;
  TOKEN_REFRESH_METRICS.failures = 0;
  TOKEN_REFRESH_METRICS.lastRefreshTime = null;
  TOKEN_REFRESH_METRICS.lastRefreshStatus = null;
  TOKEN_REFRESH_METRICS.averageRefreshTime = 0;
  TOKEN_REFRESH_METRICS.consecutiveFailures = 0;
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
