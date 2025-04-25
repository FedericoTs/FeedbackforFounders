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
  lockoutLevel: number; // Tracks escalating lockout severity
  lockoutUntil: number | null; // Timestamp when lockout expires
  failedAttempts: number[]; // Array of timestamps of failed attempts
  ipAddress?: string; // Optional IP address for additional tracking
  userAgent?: string; // Optional user agent for additional tracking
  notificationSent?: boolean; // Whether a notification has been sent for this lockout
}

const rateLimitStore: Record<string, RateLimitEntry> = {};

// Configuration
const MAX_ATTEMPTS = 5; // Maximum number of failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes block

// Account lockout configuration
const LOCKOUT_THRESHOLDS = [
  { attempts: 5, duration: 15 * 60 * 1000 }, // Level 1: 5 attempts, 15 min lockout
  { attempts: 10, duration: 60 * 60 * 1000 }, // Level 2: 10 attempts, 1 hour lockout
  { attempts: 15, duration: 24 * 60 * 60 * 1000 }, // Level 3: 15 attempts, 24 hour lockout
  { attempts: 20, duration: 7 * 24 * 60 * 60 * 1000 }, // Level 4: 20 attempts, 7 day lockout
];

// Time window for tracking repeated failures (24 hours)
const ACCOUNT_LOCKOUT_TRACKING_WINDOW = 24 * 60 * 60 * 1000;

// Event listeners for lockout events
type LockoutEventListener = (identifier: string, level: number) => void;
const lockoutEventListeners: LockoutEventListener[] = [];

/**
 * Register a listener for lockout events
 * @param listener Function to call when a lockout occurs
 * @returns Function to unregister the listener
 */
export function onAccountLockout(listener: LockoutEventListener): () => void {
  lockoutEventListeners.push(listener);
  return () => {
    const index = lockoutEventListeners.indexOf(listener);
    if (index !== -1) {
      lockoutEventListeners.splice(index, 1);
    }
  };
}

/**
 * Trigger lockout event listeners
 * @param identifier The identifier that was locked out
 * @param level The lockout level
 */
function triggerLockoutEvent(identifier: string, level: number): void {
  for (const listener of lockoutEventListeners) {
    try {
      listener(identifier, level);
    } catch (error) {
      console.error("Error in lockout event listener:", error);
    }
  }
}

/**
 * Check if an action is rate limited
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @returns True if the action is blocked, false otherwise
 */
export function isRateLimited(key: string): boolean {
  const entry = rateLimitStore[key];

  // If no entry exists, not rate limited
  if (!entry) return false;

  // Check for account lockout first (more severe than rate limiting)
  if (entry.lockoutUntil && Date.now() < entry.lockoutUntil) {
    return true;
  }

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
 * @param metadata Optional metadata about the attempt (IP, user agent, etc.)
 * @returns Information about the rate limit status
 */
export function recordFailedAttempt(
  key: string,
  metadata?: { ipAddress?: string; userAgent?: string },
): {
  blocked: boolean;
  attemptsRemaining: number;
  blockExpires?: number;
  lockoutLevel: number;
  lockoutUntil: number | null;
} {
  const now = Date.now();
  const entry = rateLimitStore[key] || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    blocked: false,
    lockoutLevel: 0,
    lockoutUntil: null,
    failedAttempts: [],
    notificationSent: false,
  };

  // Add this attempt to the failed attempts array
  entry.failedAttempts = entry.failedAttempts || [];
  entry.failedAttempts.push(now);

  // Update metadata if provided
  if (metadata) {
    if (metadata.ipAddress) entry.ipAddress = metadata.ipAddress;
    if (metadata.userAgent) entry.userAgent = metadata.userAgent;
  }

  // Clean up old attempts outside the tracking window
  entry.failedAttempts = entry.failedAttempts.filter(
    (timestamp) => now - timestamp < ACCOUNT_LOCKOUT_TRACKING_WINDOW,
  );

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

  // Check for account lockout conditions based on total attempts in tracking window
  const totalRecentAttempts = entry.failedAttempts.length;

  // Determine appropriate lockout level based on number of attempts
  let newLockoutLevel = 0;
  for (let i = LOCKOUT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalRecentAttempts >= LOCKOUT_THRESHOLDS[i].attempts) {
      newLockoutLevel = i + 1;
      break;
    }
  }

  // If lockout level increased, apply the lockout
  if (newLockoutLevel > (entry.lockoutLevel || 0)) {
    const previousLevel = entry.lockoutLevel || 0;
    entry.lockoutLevel = newLockoutLevel;
    const lockoutDuration = LOCKOUT_THRESHOLDS[newLockoutLevel - 1].duration;
    entry.lockoutUntil = now + lockoutDuration;
    entry.notificationSent = false; // Reset notification flag for new lockout level

    // Trigger lockout event for listeners
    triggerLockoutEvent(key, newLockoutLevel);

    console.log(
      `Account ${key} lockout level increased from ${previousLevel} to ${newLockoutLevel}. ` +
        `Locked until ${new Date(entry.lockoutUntil).toLocaleString()}`,
    );
  }

  // Update store
  rateLimitStore[key] = entry;

  return {
    blocked: entry.blocked,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    blockExpires: entry.blockExpires,
    lockoutLevel: entry.lockoutLevel,
    lockoutUntil: entry.lockoutUntil,
  };
}

/**
 * Reset rate limiting for a key
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @param resetLockout Whether to also reset account lockout (defaults to false)
 * @returns Information about the reset operation
 */
export function resetRateLimit(
  key: string,
  resetLockout: boolean = false,
): { success: boolean; previousLockoutLevel?: number } {
  const record = rateLimitStore[key];
  if (!record) {
    return { success: false };
  }

  const previousLockoutLevel = record.lockoutLevel;

  if (resetLockout) {
    // Completely remove the record
    delete rateLimitStore[key];
    console.log(`Rate limit and lockout completely reset for ${key}`);
    return { success: true, previousLockoutLevel };
  } else {
    // Only reset the rate limiting, keep lockout status
    record.count = 0;
    record.blocked = false;
    record.firstAttempt = Date.now();
    record.lastAttempt = Date.now();
    delete record.blockExpires;
    console.log(`Rate limit reset for ${key}, lockout status preserved`);
    return { success: true, previousLockoutLevel };
  }
}

/**
 * Get time remaining until rate limit expires
 * @param key Unique identifier for the rate limited action (e.g., email or IP)
 * @returns Time in milliseconds until rate limit expires, or 0 if not rate limited
 */
export function getRateLimitTimeRemaining(key: string): number {
  const now = Date.now();
  const record = rateLimitStore[key];

  if (!record) return 0;

  // Check account lockout first (takes precedence)
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return record.lockoutUntil - now;
  }

  // Then check rate limiting
  if (record.blocked) {
    return Math.max(0, WINDOW_MS - (now - record.firstAttempt));
  }

  return 0;
}

/**
 * Checks if an account is locked out (more severe than rate limited)
 * @param identifier The identifier to check (usually email or IP)
 * @returns Whether the account is locked out
 */
export function isAccountLocked(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore[identifier];

  if (!record || !record.lockoutUntil) return false;

  return now < record.lockoutUntil;
}

/**
 * Gets information about an account's lockout status
 * @param identifier The identifier to check (usually email or IP)
 * @returns Lockout information including level, duration, and remaining time
 */
export function getAccountLockoutInfo(identifier: string): {
  isLocked: boolean;
  level: number;
  remainingTime: number;
  totalDuration: number;
  recentAttempts: number;
} {
  const now = Date.now();
  const record = rateLimitStore[identifier];

  if (!record) {
    return {
      isLocked: false,
      level: 0,
      remainingTime: 0,
      totalDuration: 0,
      recentAttempts: 0,
    };
  }

  const isLocked = record.lockoutUntil ? now < record.lockoutUntil : false;
  const remainingTime = record.lockoutUntil
    ? Math.max(0, record.lockoutUntil - now)
    : 0;
  const totalDuration =
    record.lockoutLevel > 0
      ? LOCKOUT_THRESHOLDS[record.lockoutLevel - 1].duration
      : 0;

  return {
    isLocked,
    level: record.lockoutLevel || 0,
    remainingTime,
    totalDuration,
    recentAttempts: record.failedAttempts ? record.failedAttempts.length : 0,
  };
}

/**
 * Manually unlocks an account (admin function)
 * @param identifier The identifier to unlock (usually email or IP)
 * @param adminId Optional ID of the admin performing the unlock
 * @returns Information about the unlock operation
 */
export function unlockAccount(
  identifier: string,
  adminId?: string,
): { success: boolean; previousLockoutLevel?: number } {
  const record = rateLimitStore[identifier];

  if (!record) {
    return { success: false };
  }

  const previousLockoutLevel = record.lockoutLevel;

  // Reset lockout but keep attempt history for tracking purposes
  record.lockoutLevel = 0;
  record.lockoutUntil = null;
  record.blocked = false;
  record.count = 0;

  // Log the unlock action
  console.log(
    `Account ${identifier} manually unlocked${adminId ? ` by admin ${adminId}` : ""}. ` +
      `Previous lockout level: ${previousLockoutLevel}`,
  );

  return { success: true, previousLockoutLevel };
}

/**
 * Gets a list of all currently locked accounts
 * @param includeMetadata Whether to include additional metadata in the results
 * @returns Array of locked account identifiers with their lockout information
 */
export function getLockedAccounts(includeMetadata: boolean = false): Array<{
  identifier: string;
  lockoutLevel: number;
  lockoutUntil: number;
  remainingTime: number;
  recentAttempts: number;
  ipAddress?: string;
  userAgent?: string;
  firstAttempt?: number;
  lastAttempt?: number;
}> {
  const now = Date.now();
  const lockedAccounts = [];

  for (const [identifier, record] of Object.entries(rateLimitStore)) {
    if (record.lockoutUntil && now < record.lockoutUntil) {
      const accountInfo: any = {
        identifier,
        lockoutLevel: record.lockoutLevel || 0,
        lockoutUntil: record.lockoutUntil,
        remainingTime: record.lockoutUntil - now,
        recentAttempts: record.failedAttempts
          ? record.failedAttempts.length
          : 0,
      };

      // Include additional metadata if requested
      if (includeMetadata) {
        if (record.ipAddress) accountInfo.ipAddress = record.ipAddress;
        if (record.userAgent) accountInfo.userAgent = record.userAgent;
        accountInfo.firstAttempt = record.firstAttempt;
        accountInfo.lastAttempt = record.lastAttempt;
      }

      lockedAccounts.push(accountInfo);
    }
  }

  // Sort by lockout level (highest first) and then by remaining time (lowest first)
  return lockedAccounts.sort((a, b) => {
    if (b.lockoutLevel !== a.lockoutLevel) {
      return b.lockoutLevel - a.lockoutLevel; // Highest level first
    }
    return a.remainingTime - b.remainingTime; // Lowest remaining time first
  });
}

/**
 * Gets statistics about account lockouts
 * @returns Statistics about account lockouts
 */
export function getLockoutStatistics(): {
  totalLockedAccounts: number;
  byLevel: Record<number, number>;
  recentLockouts: number; // In the last hour
} {
  const now = Date.now();
  const lockedAccounts = getLockedAccounts();
  const byLevel: Record<number, number> = {};
  let recentLockouts = 0;

  for (const account of lockedAccounts) {
    // Count by level
    byLevel[account.lockoutLevel] = (byLevel[account.lockoutLevel] || 0) + 1;

    // Count recent lockouts (within the last hour)
    const lockoutTime = account.lockoutUntil - account.remainingTime;
    if (now - lockoutTime < 60 * 60 * 1000) {
      recentLockouts++;
    }
  }

  return {
    totalLockedAccounts: lockedAccounts.length,
    byLevel,
    recentLockouts,
  };
}
