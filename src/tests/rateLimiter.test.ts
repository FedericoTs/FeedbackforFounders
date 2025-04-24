import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRateLimited,
  recordFailedAttempt,
  resetRateLimit,
  getRateLimitTimeRemaining,
  formatRateLimitTimeRemaining,
} from "../lib/rateLimiter";

describe("Rate Limiter Utilities", () => {
  beforeEach(() => {
    // Reset rate limiter state between tests
    vi.spyOn(global, "resetRateLimit").mockImplementation((key: string) => {
      // This will reset the rate limiter for the given key
    });
    resetRateLimit("test-key");
    resetRateLimit("test-ip");
    vi.restoreAllMocks();
  });

  describe("isRateLimited", () => {
    it("returns false for a new key", () => {
      expect(isRateLimited("new-key")).toBe(false);
    });

    it("returns false for a key with few attempts", () => {
      // Record a few failed attempts, but not enough to trigger rate limiting
      recordFailedAttempt("test-key");
      recordFailedAttempt("test-key");
      expect(isRateLimited("test-key")).toBe(false);
    });

    it("returns true after max attempts", () => {
      // Record enough failed attempts to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt("test-key");
      }
      expect(isRateLimited("test-key")).toBe(true);
    });

    it("returns false after reset", () => {
      // Record enough failed attempts to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt("test-key");
      }
      expect(isRateLimited("test-key")).toBe(true);

      // Reset the rate limit
      resetRateLimit("test-key");
      expect(isRateLimited("test-key")).toBe(false);
    });
  });

  describe("recordFailedAttempt", () => {
    it("increments attempt count", () => {
      const result1 = recordFailedAttempt("test-key");
      expect(result1.attemptsRemaining).toBe(4); // 5 max attempts - 1 recorded
      expect(result1.blocked).toBe(false);

      const result2 = recordFailedAttempt("test-key");
      expect(result2.attemptsRemaining).toBe(3); // 5 max attempts - 2 recorded
      expect(result2.blocked).toBe(false);
    });

    it("blocks after max attempts", () => {
      // Record 4 attempts
      for (let i = 0; i < 4; i++) {
        recordFailedAttempt("test-key");
      }

      // Record the 5th attempt, which should trigger blocking
      const result = recordFailedAttempt("test-key");
      expect(result.attemptsRemaining).toBe(0);
      expect(result.blocked).toBe(true);
      expect(result.blockExpires).toBeDefined();
    });

    it("resets count after window expires", () => {
      // Record a failed attempt
      recordFailedAttempt("test-key");

      // Mock Date.now to return a time after the window expires
      const realDateNow = Date.now;
      const mockNow = realDateNow() + 16 * 60 * 1000; // 16 minutes later (window is 15 minutes)
      vi.spyOn(Date, "now").mockImplementation(() => mockNow);

      // Record another attempt, which should reset the count
      const result = recordFailedAttempt("test-key");
      expect(result.attemptsRemaining).toBe(4); // 5 max attempts - 1 recorded (reset)
      expect(result.blocked).toBe(false);

      // Restore Date.now
      vi.spyOn(Date, "now").mockImplementation(() => realDateNow());
    });
  });

  describe("resetRateLimit", () => {
    it("resets rate limit for a key", () => {
      // Record enough failed attempts to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt("test-key");
      }
      expect(isRateLimited("test-key")).toBe(true);

      // Reset the rate limit
      resetRateLimit("test-key");
      expect(isRateLimited("test-key")).toBe(false);
    });
  });

  describe("getRateLimitTimeRemaining", () => {
    it("returns 0 for a new key", () => {
      expect(getRateLimitTimeRemaining("new-key")).toBe(0);
    });

    it("returns time remaining for a blocked key", () => {
      // Record enough failed attempts to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt("test-key");
      }

      // Check that there is time remaining
      const timeRemaining = getRateLimitTimeRemaining("test-key");
      expect(timeRemaining).toBeGreaterThan(0);
    });

    it("returns window time for a key with attempts", () => {
      // Record a failed attempt
      recordFailedAttempt("test-key");

      // Check that there is time remaining (window time)
      const timeRemaining = getRateLimitTimeRemaining("test-key");
      expect(timeRemaining).toBeGreaterThan(0);
    });
  });

  describe("formatRateLimitTimeRemaining", () => {
    it("formats seconds correctly", () => {
      expect(formatRateLimitTimeRemaining(1000)).toBe("1 second");
      expect(formatRateLimitTimeRemaining(30000)).toBe("30 seconds");
    });

    it("formats minutes correctly", () => {
      expect(formatRateLimitTimeRemaining(60000)).toBe("1 minute");
      expect(formatRateLimitTimeRemaining(120000)).toBe("2 minutes");
    });

    it("returns 0 seconds for non-positive values", () => {
      expect(formatRateLimitTimeRemaining(0)).toBe("0 seconds");
      expect(formatRateLimitTimeRemaining(-1000)).toBe("0 seconds");
    });
  });
});
