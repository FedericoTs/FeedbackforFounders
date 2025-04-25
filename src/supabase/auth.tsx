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
} from "../lib/rateLimiter";
import {
  initSessionTracking,
  extendSession as extendSessionUtil,
  updateSessionConfig,
} from "../lib/sessionManager";

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
  sessionTimeoutWarning: {
    visible: boolean;
    threshold: number;
  };
  extendSession: () => Promise<boolean>;
  configureSessionTimeout: (options: {
    warningThreshold?: number;
    idleTimeout?: number;
    absoluteTimeout?: number;
  }) => void;
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
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState({
    visible: false,
    threshold: 0,
  });

  useEffect(() => {
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

  const getUserRole = () => {
    if (!user) return null;
    const metadataRole = user.user_metadata?.role;
    if (metadataRole) return metadataRole;
    return ROLES.USER;
  };

  const hasPermission = (permission: string) => {
    const role = getUserRole();
    if (!role) return false;
    return checkPermission(role, permission);
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const session = await refreshToken();
      if (session) {
        const info = await getSessionInfo();
        setSessionInfo(info);
        setSessionValid(info.valid);
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

  const getSessionTimeRemaining = (): string => {
    return formatTimeDuration(sessionInfo.timeRemaining);
  };

  useEffect(() => {
    let refreshCancelFn: (() => void) | null = null;

    const updateSessionInfo = async () => {
      if (user) {
        const info = await getSessionInfo();
        setSessionInfo(info);
        setSessionValid(info.valid);
        if (info.valid) {
          const secondsUntilExpiration = Math.floor(info.timeRemaining / 1000);
          if (refreshCancelFn) {
            refreshCancelFn();
            refreshCancelFn = null;
          }
          if (secondsUntilExpiration > 0) {
            refreshCancelFn = setupTokenRefresh(secondsUntilExpiration);
          } else {
            console.log(
              "Session expired or about to expire, refreshing immediately",
            );
            await refreshSession();
          }
        }
      }
    };

    updateSessionInfo();

    const getCheckInterval = () => {
      if (sessionInfo.timeRemaining < 5 * 60 * 1000) {
        return 15000;
      }
      if (sessionInfo.timeRemaining < 10 * 60 * 1000) {
        return 30000;
      }
      if (sessionInfo.timeRemaining < 30 * 60 * 1000) {
        return 60000;
      }
      return 5 * 60 * 1000;
    };

    const interval = setInterval(updateSessionInfo, getCheckInterval());

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        updateSessionInfo();
      }
    };

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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      if (refreshCancelFn) refreshCancelFn();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user, sessionInfo.timeRemaining]);

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      return await revokeSessionToken(sessionId);
    } catch (error) {
      console.error("Error revoking session:", error);
      return false;
    }
  };

  const getAllSessions = async (): Promise<any[] | null> => {
    try {
      return await getAllSessionsToken();
    } catch (error) {
      console.error("Error getting all sessions:", error);
      return null;
    }
  };

  const extendSessionHandler = async (): Promise<boolean> => {
    try {
      const success = await extendSessionUtil();
      if (success) {
        const info = await getSessionInfo();
        setSessionInfo(info);
        setSessionValid(info.valid);
        setSessionTimeoutWarning((prev) => ({
          ...prev,
          visible: false,
        }));
      }
      return success;
    } catch (error) {
      console.error("Error extending session:", error);
      return false;
    }
  };

  const configureSessionTimeout = (options: {
    warningThreshold?: number;
    idleTimeout?: number;
    absoluteTimeout?: number;
  }): void => {
    updateSessionConfig(options);
    if (options.warningThreshold) {
      setSessionTimeoutWarning((prev) => ({
        ...prev,
        threshold: options.warningThreshold!,
      }));
    }
  };

  const value = {
    user,
    loading,
    authError,
    sessionValid,
    sessionInfo,
    sessionTimeoutWarning,
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
    extendSession: extendSessionHandler,
    getSessionTimeRemaining,
    configureSessionTimeout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useIsAuthenticated() {
  const { user, loading } = useAuth();
  return { isAuthenticated: !!user, loading };
}
