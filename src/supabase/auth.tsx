import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
import {
  formatAuthError,
  withAuthRetry,
  trackOperationFailure,
  formatCooldownTime,
} from "../lib/authUtils";
import { hasPermission as checkPermission, ROLES } from "../lib/roles";
import {
  setupTokenRefresh,
  storeToken,
  removeToken,
  isTokenExpired,
  refreshToken,
  getSessionInfo,
  formatTimeDuration,
  revokeSession as revokeSessionToken,
  getAllSessions as getAllSessionsToken,
} from "../lib/tokenManager";
import {
  isRateLimited,
  recordFailedAttempt,
  resetRateLimit,
  getRateLimitTimeRemaining,
  formatRateLimitTimeRemaining,
} from "../lib/rateLimiter";

// Session information type definition
type SessionInfoType = {
  valid: boolean;
  expiresAt: Date | null;
  timeRemaining: number;
  issuedAt: Date | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  sessionValid: boolean;
  sessionInfo: SessionInfoType;
  signIn: (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  signOutAllDevices: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (password: string) => Promise<{ data: any; error: any }>;
  updateProfile: (profile: {
    fullName?: string;
    avatarUrl?: string;
  }) => Promise<{ data: any; error: any }>;
  getUserRole: () => string | null;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<boolean>;
  getSessionTimeRemaining: () => string;
  revokeSession: (sessionId: string) => Promise<boolean>;
  getAllSessions: () => Promise<any[] | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfoType>({
    valid: false,
    expiresAt: null,
    timeRemaining: 0,
    issuedAt: null,
  });

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (error: any) {
        console.error("Error retrieving session:", error);
        setAuthError(formatAuthError(error));
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Enhanced sign in with error handling and options
  const signIn = async (
    email: string,
    password: string,
    options?: { rememberMe?: boolean },
  ) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          ...(options?.rememberMe ? { expiresIn: 60 * 60 * 24 * 30 } : {}),
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { data: null, error };
    }
  };

  // Enhanced sign up with additional user metadata
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { data: null, error };
    }
  };

  // Enhanced sign out with error handling
  const signOut = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { error };
    }
  };

  // Sign out from all devices
  const signOutAllDevices = async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { error };
    }
  };

  // Password reset request
  const resetPassword = async (email: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { data: null, error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { data: null, error };
    }
  };

  // Update user profile
  const updateProfile = async (profile: {
    fullName?: string;
    avatarUrl?: string;
  }) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { data: null, error };
    }
  };

  // Get user role from metadata or database
  const getUserRole = () => {
    if (!user) return null;
    // Extract role from user metadata
    const metadataRole = user.user_metadata?.role;
    if (metadataRole) return metadataRole;

    // If no role in metadata, use default role
    return ROLES.USER;
  };

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    const role = getUserRole();
    if (!role) return false;

    return checkPermission(role, permission);
  };

  // Refresh the session
  const refreshSession = async (): Promise<boolean> => {
    try {
      const session = await refreshToken();
      if (session) {
        // Update session info
        const info = await getSessionInfo();
        setSessionInfo(info);
        setSessionValid(info.valid);

        // Store the refreshed tokens securely
        if (session.access_token) {
          await storeToken("auth_access_token", session.access_token);
        }
        if (session.refresh_token) {
          await storeToken("auth_refresh_token", session.refresh_token);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
  };

  // Get formatted session time remaining
  const getSessionTimeRemaining = (): string => {
    return formatTimeDuration(sessionInfo.timeRemaining);
  };

  // Update session info periodically and handle auto-refresh with enhanced logic
  useEffect(() => {
    let refreshCancelFn: (() => void) | null = null;

    const updateSessionInfo = async () => {
      if (user) {
        const info = await getSessionInfo();
        setSessionInfo(info);
        setSessionValid(info.valid);

        // If session is valid, set up automatic refresh
        if (info.valid) {
          // Calculate seconds until expiration
          const secondsUntilExpiration = Math.floor(info.timeRemaining / 1000);

          // If we already have a refresh timer, cancel it to avoid duplicates
          if (refreshCancelFn) {
            refreshCancelFn();
            refreshCancelFn = null;
          }

          // Set up a new refresh timer with dynamic buffer calculation
          if (secondsUntilExpiration > 0) {
            refreshCancelFn = setupTokenRefresh(secondsUntilExpiration);
          } else {
            // If token is already expired or about to expire, refresh immediately
            console.log(
              "Session expired or about to expire, refreshing immediately",
            );
            await refreshSession();
          }
        }
      }
    };

    // Update session info immediately
    updateSessionInfo();

    // Set up interval to update session info - more frequently when session is close to expiry
    const getCheckInterval = () => {
      // If less than 5 minutes remaining, check every 15 seconds
      if (sessionInfo.timeRemaining < 5 * 60 * 1000) {
        return 15000;
      }
      // If less than 10 minutes remaining, check every 30 seconds
      if (sessionInfo.timeRemaining < 10 * 60 * 1000) {
        return 30000;
      }
      // If less than 30 minutes remaining, check every minute
      if (sessionInfo.timeRemaining < 30 * 60 * 1000) {
        return 60000;
      }
      // Otherwise check every 5 minutes
      return 5 * 60 * 1000;
    };

    const interval = setInterval(updateSessionInfo, getCheckInterval());

    // Enhanced visibility change handling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        // When tab becomes visible again, update session info immediately
        updateSessionInfo();
      }
    };

    // Enhanced online/offline handling
    const handleOnline = () => {
      if (user) {
        console.log("Device came online, checking session status");
        updateSessionInfo();
      }
    };

    const handleOffline = () => {
      console.log(
        "Device went offline, session refresh will resume when online",
      );
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      // Clean up all timers and event listeners
      clearInterval(interval);
      if (refreshCancelFn) refreshCancelFn();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, sessionInfo.timeRemaining]);

  // Revoke a specific session
  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      return await revokeSessionToken(sessionId);
    } catch (error) {
      console.error("Error revoking session:", error);
      return false;
    }
  };

  // Get all active sessions
  const getAllSessions = async (): Promise<any[] | null> => {
    try {
      return await getAllSessionsToken();
    } catch (error) {
      console.error("Error getting all sessions:", error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    authError,
    sessionValid,
    sessionInfo,
    signIn,
    signUp,
    signOut,
    signOutAllDevices,
    revokeSession,
    getAllSessions,
    resetPassword,
    updatePassword,
    updateProfile,
    getUserRole,
    hasPermission,
    refreshSession,
    getSessionTimeRemaining,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a separate context hook for better Fast Refresh compatibility
const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export the hook as a named export
export const useAuth = useAuthContext;

// Helper function to check if a user is authenticated
export function useIsAuthenticated() {
  const { user, loading } = useAuth();
  return { isAuthenticated: !!user, loading };
}
