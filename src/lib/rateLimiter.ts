/**
 * Rate limiting utilities for authentication and API requests
 */

// Store failed attempts in memory (in a real app, this would be in a database)
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpires?: number;
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

// Configuration
const MAX_ATTEMPTS = 5; // Maximum number of failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes block

/**
 * Check if an action is rate limited
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @returns True if the action is blocked, false otherwise
 */
export function isRateLimited(key: string): boolean {
  const entry = rateLimitStore[key];

  // If no entry exists, not rate limited
  if (!entry) return false;

  // If blocked and block hasn't expired, rate limited
  if (entry.blocked && entry.blockExpires && Date.now() < entry.blockExpires) {
    return true;
  }

  // If blocked but block has expired, clear the block
  if (entry.blocked && entry.blockExpires && Date.now() >= entry.blockExpires) {
    delete rateLimitStore[key];
    return false;
  }

  // If window has expired, reset the entry
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    delete rateLimitStore[key];
    return false;
  }

  // If too many attempts within window, rate limited
  return entry.count >= MAX_ATTEMPTS;
}

/**
 * Record a failed attempt for rate limiting
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @returns Information about the rate limit status
 */
export function recordFailedAttempt(key: string): {
  blocked: boolean;
  attemptsRemaining: number;
  blockExpires?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore[key] || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    blocked: false,
  };

  // If window has expired, reset the entry
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.count = 1;
    entry.firstAttempt = now;
    entry.lastAttempt = now;
    entry.blocked = false;
    delete entry.blockExpires;
  } else {
    // Increment attempt count
    entry.count += 1;
    entry.lastAttempt = now;

    // If max attempts reached, block
    if (entry.count >= MAX_ATTEMPTS) {
      entry.blocked = true;
      entry.blockExpires = now + BLOCK_DURATION_MS;
    }
  }

  // Update store
  rateLimitStore[key] = entry;

  return {
    blocked: entry.blocked,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    blockExpires: entry.blockExpires,
  };
}

/**
 * Reset rate limiting for a key
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 */
export function resetRateLimit(key: string): void {
  delete rateLimitStore[key];
}

/**
 * Get time remaining until rate limit expires
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @returns Time in milliseconds until rate limit expires, or 0 if not rate limited
 */
export function getRateLimitTimeRemaining(key: string): number {
  const entry = rateLimitStore[key];

  if (!entry) return 0;

  if (entry.blocked && entry.blockExpires) {
    return Math.max(0, entry.blockExpires - Date.now());
  }

  return Math.max(0, WINDOW_MS - (Date.now() - entry.firstAttempt));
}

/**
 * Format rate limit time remaining as a human-readable string
 * @param ms Time in milliseconds
 * @returns Formatted time string (e.g., "5 minutes")
 */
export function formatRateLimitTimeRemaining(ms: number): string {
  if (ms <= 0) return "0 seconds";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}
