import React, { createContext, useContext } from "react";
import { AuthProvider } from "@/supabase/auth";
import { User } from "@supabase/supabase-js";
import { ROLES } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";

interface StoryboardAuthWrapperProps {
  children: React.ReactNode;
  /**
   * Optional mock user data to provide in the auth context
   * Useful for testing specific user states in storyboards
   */
  mockUser?: {
    id: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
  /**
   * Optional loading state to provide in the auth context
   * Useful for testing loading states in storyboards
   */
  mockLoading?: boolean;
  /**
   * Optional flag to use mock auth context instead of real AuthProvider
   * This is useful for testing specific auth states without affecting real auth state
   */
  useMockAuth?: boolean;
}

// Mock auth context type definition
type MockAuthContextType = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  sessionValid: boolean;
  sessionInfo: {
    valid: boolean;
    expiresAt: Date | null;
    timeRemaining: number;
    issuedAt: Date | null;
  };
  signIn: (email: string, password: string, options?: any) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<any>;
  signOutAllDevices: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  updateProfile: (profile: any) => Promise<any>;
  getUserRole: () => string | null;
  hasPermission: (permission: string) => boolean;
  refreshSession: () => Promise<boolean>;
  getSessionTimeRemaining: () => string;
  revokeSession: (sessionId: string) => Promise<boolean>;
  getAllSessions: () => Promise<any[] | null>;
  sessionTimeoutWarning: {
    visible: boolean;
    threshold: number;
    timeRemaining?: number;
  };
  extendSession: () => Promise<boolean>;
  configureSessionTimeout: (options: {
    warningThreshold?: number;
    idleTimeout?: number;
    absoluteTimeout?: number;
  }) => void;
};

// Create a mock auth context
const MockAuthContext = createContext<MockAuthContextType | undefined>(
  undefined,
);

// Mock auth provider component
function MockAuthProvider({
  children,
  mockUser,
  mockLoading = false,
}: {
  children: React.ReactNode;
  mockUser?: {
    id: string;
    email: string;
    role?: string;
    [key: string]: any;
  };
  mockLoading?: boolean;
}) {
  // Create a mock user object that matches the User type from Supabase
  const user = mockUser
    ? ({
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: {
          role: mockUser.role || ROLES.USER,
          ...mockUser,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User)
    : null;

  // Mock session info
  const sessionInfo = {
    valid: !!user,
    expiresAt: user ? new Date(Date.now() + 3600 * 1000) : null, // 1 hour from now
    timeRemaining: user ? 3600 * 1000 : 0, // 1 hour in milliseconds
    issuedAt: user ? new Date() : null,
  };

  // Mock auth context value
  const mockAuthValue: MockAuthContextType = {
    user,
    loading: mockLoading,
    authError: null,
    sessionValid: !!user,
    sessionInfo,
    signIn: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    signOutAllDevices: async () => ({ error: null }),
    resetPassword: async () => ({ data: null, error: null }),
    updatePassword: async () => ({ data: null, error: null }),
    updateProfile: async () => ({ data: null, error: null }),
    getUserRole: () => (user ? user.user_metadata?.role || ROLES.USER : null),
    hasPermission: () => true, // Always return true in mock
    refreshSession: async () => true,
    getSessionTimeRemaining: () => "1 hour",
    revokeSession: async () => true,
    getAllSessions: async () => [],
    sessionTimeoutWarning: {
      visible: false,
      threshold: 5 * 60 * 1000, // 5 minutes
    },
    extendSession: async () => true,
    configureSessionTimeout: () => {},
  };

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Hook to use the mock auth context
function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}

// StoryboardAuthWrapper component
function StoryboardAuthWrapper({
  children,
  mockUser,
  mockLoading,
  useMockAuth = false,
}: StoryboardAuthWrapperProps) {
  // If useMockAuth is true, use the mock auth provider
  if (useMockAuth) {
    return (
      <div className="relative">
        {mockUser && (
          <div className="absolute top-2 right-2 z-50">
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              Mock User: {mockUser.email}
              {mockUser.role && ` (${mockUser.role})`}
            </Badge>
          </div>
        )}
        <MockAuthProvider mockUser={mockUser} mockLoading={mockLoading}>
          {children}
        </MockAuthProvider>
      </div>
    );
  }

  // Otherwise, use the real auth provider
  return <AuthProvider>{children}</AuthProvider>;
}

export default StoryboardAuthWrapper;
