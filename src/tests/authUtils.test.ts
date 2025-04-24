import { describe, it, expect } from "vitest";
import {
  validatePassword,
  formatAuthError,
  parseJwt,
  isTokenExpired,
  securelyStoreToken,
  getSecurelyStoredToken,
  removeSecurelyStoredToken,
} from "../lib/authUtils";

describe("Authentication Utilities", () => {
  describe("validatePassword", () => {
    it("rejects passwords that are too short", () => {
      const result = validatePassword("short");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("at least 8 characters");
    });

    it("rejects passwords without uppercase letters", () => {
      const result = validatePassword("password123!");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("uppercase letter");
    });

    it("rejects passwords without lowercase letters", () => {
      const result = validatePassword("PASSWORD123!");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("lowercase letter");
    });

    it("rejects passwords without numbers", () => {
      const result = validatePassword("Password!");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("number");
    });

    it("rejects passwords without special characters", () => {
      const result = validatePassword("Password123");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("special character");
    });

    it("accepts strong passwords", () => {
      const result = validatePassword("StrongP@ssw0rd");
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe("formatAuthError", () => {
    it("formats known error codes", () => {
      expect(formatAuthError({ code: "auth/invalid-email" })).toContain(
        "email address is not valid",
      );
      expect(formatAuthError({ code: "auth/user-disabled" })).toContain(
        "account has been disabled",
      );
      expect(formatAuthError({ code: "auth/user-not-found" })).toContain(
        "Invalid email or password",
      );
      expect(formatAuthError({ code: "auth/wrong-password" })).toContain(
        "Invalid email or password",
      );
      expect(formatAuthError({ code: "auth/email-already-in-use" })).toContain(
        "email is already in use",
      );
      expect(formatAuthError({ code: "auth/weak-password" })).toContain(
        "password is too weak",
      );
      expect(formatAuthError({ code: "auth/too-many-requests" })).toContain(
        "Too many unsuccessful login attempts",
      );
    });

    it("uses error message when available", () => {
      const customMessage = "Custom error message";
      expect(formatAuthError({ message: customMessage })).toBe(customMessage);
    });

    it("returns generic message for unknown errors", () => {
      expect(formatAuthError({ code: "unknown-code" })).toContain(
        "unexpected authentication error",
      );
      expect(formatAuthError({})).toContain("unexpected authentication error");
    });

    it("returns empty string for null error", () => {
      expect(formatAuthError(null)).toBe("");
    });
  });

  describe("parseJwt", () => {
    it("parses a valid JWT token", () => {
      // This is a sample JWT token with payload { "sub": "1234", "name": "Test User", "exp": 1716239022 }
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6MTcxNjIzOTAyMn0.7fKXAkUrYlN7xB9WQQUFTyxP7CUZhcwC9GT-J6vUeik";

      // Mock atob function
      global.atob = vi.fn((str) => {
        return Buffer.from(str, "base64").toString("binary");
      });

      const payload = parseJwt(token);
      expect(payload).toEqual({
        sub: "1234",
        name: "Test User",
        exp: 1716239022,
      });
    });

    it("returns null for invalid token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const invalidToken = "invalid-token";

      const payload = parseJwt(invalidToken);
      expect(payload).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("isTokenExpired", () => {
    it("returns true for expired token", () => {
      // Mock parseJwt to return an expired token payload
      vi.spyOn(global, "parseJwt").mockImplementation(() => ({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }));

      const isExpired = isTokenExpired("expired-token");
      expect(isExpired).toBe(true);
    });

    it("returns false for valid token", () => {
      // Mock parseJwt to return a valid token payload
      vi.spyOn(global, "parseJwt").mockImplementation(() => ({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future
      }));

      const isExpired = isTokenExpired("valid-token");
      expect(isExpired).toBe(false);
    });

    it("returns true for token without expiration", () => {
      // Mock parseJwt to return a token payload without exp
      vi.spyOn(global, "parseJwt").mockImplementation(() => ({
        sub: "1234",
      }));

      const isExpired = isTokenExpired("no-exp-token");
      expect(isExpired).toBe(true);
    });

    it("returns true for invalid token", () => {
      // Mock parseJwt to return null for invalid token
      vi.spyOn(global, "parseJwt").mockImplementation(() => null);

      const isExpired = isTokenExpired("invalid-token");
      expect(isExpired).toBe(true);
    });
  });

  describe("Token Storage Functions", () => {
    beforeEach(() => {
      // Setup localStorage mock
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: vi.fn((key: string) => store[key] || null),
          setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
          }),
          removeItem: vi.fn((key: string) => {
            delete store[key];
          }),
          clear: vi.fn(() => {
            store = {};
          }),
        };
      })();

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });
    });

    it("securely stores token", () => {
      securelyStoreToken("auth_token", "test-token-value");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "test-token-value",
      );
    });

    it("retrieves securely stored token", () => {
      localStorage.setItem("auth_token", "test-token-value");
      const token = getSecurelyStoredToken("auth_token");
      expect(token).toBe("test-token-value");
      expect(localStorage.getItem).toHaveBeenCalledWith("auth_token");
    });

    it("removes securely stored token", () => {
      localStorage.setItem("auth_token", "test-token-value");
      removeSecurelyStoredToken("auth_token");
      expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
    });

    it("handles errors when storing token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw error;
      });

      securelyStoreToken("auth_token", "test-token-value");
      expect(consoleSpy).toHaveBeenCalledWith("Error storing token:", error);

      consoleSpy.mockRestore();
    });

    it("handles errors when retrieving token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw error;
      });

      const token = getSecurelyStoredToken("auth_token");
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error retrieving token:", error);

      consoleSpy.mockRestore();
    });

    it("handles errors when removing token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
        throw error;
      });

      removeSecurelyStoredToken("auth_token");
      expect(consoleSpy).toHaveBeenCalledWith("Error removing token:", error);

      consoleSpy.mockRestore();
    });
  });
});
