import React, { useEffect, useContext, createContext } from "react";
import { useAuth } from "@/supabase/auth";
import SessionTimeoutWarning from "../ui/session-timeout-warning";
import { useToast } from "@/components/ui/use-toast";

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  warningThreshold?: number; // in milliseconds
  idleTimeout?: number; // in milliseconds
  absoluteTimeout?: number; // in milliseconds
}

interface SessionTimeoutContextType {
  idleTime: number;
  resetIdleTimer: () => void;
  extendSession: () => Promise<boolean>;
  timeRemaining: number;
  warningThreshold: number;
  idleTimeout: number;
  absoluteTimeout: number;
  configureTimeout: (options: {
    warningThreshold?: number;
    idleTimeout?: number;
    absoluteTimeout?: number;
  }) => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(
  null,
);

/**
 * Hook to access session timeout functionality
 */
export function useSessionTimeout() {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error(
      "useSessionTimeout must be used within a SessionTimeoutProvider",
    );
  }
  return context;
}

/**
 * A provider component that manages session timeout warnings and automatic session extension.
 * Wrap your application with this component to enable session timeout features.
 */
export default function SessionTimeoutProvider({
  children,
  warningThreshold,
  idleTimeout,
  absoluteTimeout,
}: SessionTimeoutProviderProps) {
  const {
    user,
    sessionTimeoutWarning,
    extendSession: authExtendSession,
    configureSessionTimeout,
    signOut,
    sessionInfo,
  } = useAuth();
  const { toast } = useToast();

  // Configure session timeout settings when props change
  useEffect(() => {
    if (user) {
      const options: Record<string, number> = {};
      if (warningThreshold) options.warningThreshold = warningThreshold;
      if (idleTimeout) options.idleTimeout = idleTimeout;
      if (absoluteTimeout) options.absoluteTimeout = absoluteTimeout;

      if (Object.keys(options).length > 0) {
        configureSessionTimeout(options);
      }
    }
  }, [
    user,
    warningThreshold,
    idleTimeout,
    absoluteTimeout,
    configureSessionTimeout,
  ]);

  // Handle session extension
  const handleExtendSession = async () => {
    const success = await authExtendSession();
    if (success) {
      toast({
        title: "Session Extended",
        description: "Your session has been successfully extended.",
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "Session Extension Failed",
        description: "Unable to extend your session. Please log in again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle session expiration
  const handleSessionExpired = () => {
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
    signOut();
  };

  // Calculate idle time and time remaining from sessionInfo
  const idleTimeValue = sessionInfo?.idleTime || 0;
  const timeRemainingValue = sessionInfo?.timeRemaining || 0;
  const warningThresholdValue = sessionTimeoutWarning?.threshold || 300; // 5 minutes default
  const idleTimeoutValue = sessionInfo?.idleTimeout || 1800; // 30 minutes default
  const absoluteTimeoutValue = sessionInfo?.absoluteTimeout || 28800; // 8 hours default

  // Create context value
  const contextValue: SessionTimeoutContextType = {
    idleTime: idleTimeValue,
    resetIdleTimer: () => {
      // This function would be implemented in the auth provider
      // For now, we'll just call extendSession which should reset the idle timer
      authExtendSession();
    },
    extendSession: handleExtendSession,
    timeRemaining: timeRemainingValue,
    warningThreshold: warningThresholdValue,
    idleTimeout: idleTimeoutValue,
    absoluteTimeout: absoluteTimeoutValue,
    configureTimeout: configureSessionTimeout,
  };

  return (
    <SessionTimeoutContext.Provider value={contextValue}>
      {children}
      {sessionTimeoutWarning.visible && (
        <SessionTimeoutWarning
          timeRemaining={sessionTimeoutWarning.timeRemaining}
          warningThreshold={sessionTimeoutWarning.threshold}
          onExtendSession={handleExtendSession}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </SessionTimeoutContext.Provider>
  );
}
