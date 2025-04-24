import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  storeToken,
  getToken,
  removeToken,
  parseJwt,
  isTokenExpired,
  refreshToken,
  setupTokenRefresh,
  revokeAllTokens,
} from "../lib/tokenManager";

// Mock localStorage
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

// Mock supabase
vi.mock("../supabase/supabase", () => ({
  supabase: {
    auth: {
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe("Token Management Utilities", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("storeToken", () => {
    it("stores token in localStorage", () => {
      storeToken("auth_token", "test-token-value");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "test-token-value",
      );
    });

    it("handles errors when storing token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw error;
      });

      storeToken("auth_token", "test-token-value");
      expect(consoleSpy).toHaveBeenCalledWith("Error storing token:", error);

      consoleSpy.mockRestore();
    });
  });

  describe("getToken", () => {
    it("retrieves token from localStorage", () => {
      localStorage.setItem("auth_token", "test-token-value");
      const token = getToken("auth_token");
      expect(token).toBe("test-token-value");
      expect(localStorage.getItem).toHaveBeenCalledWith("auth_token");
    });

    it("returns null if token not found", () => {
      const token = getToken("non_existent_token");
      expect(token).toBeNull();
    });

    it("handles errors when retrieving token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw error;
      });

      const token = getToken("auth_token");
      expect(token).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error retrieving token:", error);

      consoleSpy.mockRestore();
    });
  });

  describe("removeToken", () => {
    it("removes token from localStorage", () => {
      localStorage.setItem("auth_token", "test-token-value");
      removeToken("auth_token");
      expect(localStorage.removeItem).toHaveBeenCalledWith("auth_token");
    });

    it("handles errors when removing token", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Storage error");
      vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
        throw error;
      });

      removeToken("auth_token");
      expect(consoleSpy).toHaveBeenCalledWith("Error removing token:", error);

      consoleSpy.mockRestore();
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

  describe("refreshToken", () => {
    it("successfully refreshes token", async () => {
      const mockSession = { accessToken: "new-token" };
      const mockRefreshSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.spyOn(require("../supabase/supabase"), "supabase").mockImplementation({
        auth: {
          refreshSession: mockRefreshSession,
        },
      });

      const result = await refreshToken();
      expect(result).toBe(mockSession);
      expect(mockRefreshSession).toHaveBeenCalled();
    });

    it("returns null on refresh error", async () => {
      const mockRefreshSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: new Error("Refresh failed"),
      });

      vi.spyOn(require("../supabase/supabase"), "supabase").mockImplementation({
        auth: {
          refreshSession: mockRefreshSession,
        },
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const result = await refreshToken();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("setupTokenRefresh", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("sets up a timer to refresh token", () => {
      const mockRefreshToken = vi.fn();
      vi.spyOn(global, "refreshToken").mockImplementation(mockRefreshToken);
      vi.spyOn(global, "setTimeout").mockImplementation((callback) => {
        callback();
        return 123 as any;
      });

      const cancelRefresh = setupTokenRefresh(3600, 300);
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3300000); // (3600 - 300) * 1000
      expect(mockRefreshToken).toHaveBeenCalled();
      expect(cancelRefresh).toBeInstanceOf(Function);
    });

    it("cancels the refresh timer when cancel function is called", () => {
      vi.spyOn(global, "setTimeout").mockReturnValue(123 as any);
      vi.spyOn(global, "clearTimeout").mockImplementation(() => {});

      const cancelRefresh = setupTokenRefresh(3600);
      cancelRefresh();
      expect(clearTimeout).toHaveBeenCalledWith(123);
    });
  });

  describe("revokeAllTokens", () => {
    it("successfully revokes all tokens", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.spyOn(require("../supabase/supabase"), "supabase").mockImplementation({
        auth: {
          signOut: mockSignOut,
        },
      });

      const result = await revokeAllTokens();
      expect(result).toBe(true);
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "global" });
    });

    it("returns false on revocation error", async () => {
      const mockSignOut = vi.fn().mockResolvedValue({
        error: new Error("Revocation failed"),
      });

      vi.spyOn(require("../supabase/supabase"), "supabase").mockImplementation({
        auth: {
          signOut: mockSignOut,
        },
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const result = await revokeAllTokens();
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
