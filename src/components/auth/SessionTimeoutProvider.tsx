import React, { useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import SessionTimeoutWarning from "../ui/session-timeout-warning";
import { useToast } from "@/components/ui/use-toast";

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  warningThreshold?: number; // in milliseconds
  idleTimeout?: number; // in milliseconds
  absoluteTimeout?: number; // in milliseconds
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
    extendSession,
    configureSessionTimeout,
    signOut,
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
    const success = await extendSession();
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

  return (
    <>
      {children}
      {sessionTimeoutWarning.visible && (
        <SessionTimeoutWarning
          timeRemaining={sessionTimeoutWarning.timeRemaining}
          warningThreshold={sessionTimeoutWarning.threshold}
          onExtendSession={handleExtendSession}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </>
  );
}
