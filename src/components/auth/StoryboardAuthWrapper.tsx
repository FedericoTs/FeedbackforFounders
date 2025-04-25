import React, { createContext, useContext, useState, useEffect } from "react";
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
  mockUser?: StoryboardAuthWrapperProps["mockUser"];
  mockLoading?: boolean;
}) {
  const [loading, setLoading] = useState(mockLoading);
  const [user, setUser] = useState<User | null>(null);

  // Initialize mock user on mount
  useEffect(() => {
    if (mockUser) {
      // Convert mockUser to a format that matches the User type
      const formattedUser = {
        id: mockUser.id,
        email: mockUser.email || "test@example.com",
        user_metadata: {
          role: mockUser.role || ROLES.USER,
          full_name: mockUser.full_name || "Test User",
          avatar_url: mockUser.avatar_url,
          ...mockUser,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      // Simulate loading delay for realism
      const timer = setTimeout(() => {
        setUser(formattedUser);
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // If no mock user, just set loading to false after a delay
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mockUser]);

  // Mock auth methods
  const mockAuthMethods: MockAuthContextType = {
    user,
    loading,
    authError: null,
    sessionValid: !!user,
    sessionInfo: {
      valid: !!user,
      expiresAt: user ? new Date(Date.now() + 3600 * 1000) : null, // 1 hour from now
      timeRemaining: user ? 3600 * 1000 : 0, // 1 hour in ms
      issuedAt: user ? new Date() : null,
    },
    signIn: async () => ({ data: { user }, error: null }),
    signUp: async () => ({ data: { user }, error: null }),
    signOut: async () => {
      setUser(null);
      return { error: null };
    },
    signOutAllDevices: async () => ({ error: null }),
    resetPassword: async () => ({ data: {}, error: null }),
    updatePassword: async () => ({ data: {}, error: null }),
    updateProfile: async (profile) => {
      if (user) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: profile.fullName || user.user_metadata?.full_name,
            avatar_url: profile.avatarUrl || user.user_metadata?.avatar_url,
          },
        } as User;
        setUser(updatedUser);
      }
      return { data: { user }, error: null };
    },
    getUserRole: () => user?.user_metadata?.role || null,
    hasPermission: () => true, // Always return true for mock
    refreshSession: async () => true,
    getSessionTimeRemaining: () => "1h 0m",
    revokeSession: async () => true,
    getAllSessions: async () => [],
  };

  return (
    <MockAuthContext.Provider value={mockAuthMethods}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Hook to use mock auth context
export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
};

/**
 * A wrapper component that provides AuthProvider context for storyboards
 * This allows components in storyboards to use the useAuth hook
 *
 * Usage:
 * ```tsx
 * <StoryboardAuthWrapper>
 *   <YourComponent />
 * </StoryboardAuthWrapper>
 * ```
 *
 * With mock data:
 * ```tsx
 * <StoryboardAuthWrapper
 *   mockUser={{ id: "123", email: "test@example.com", role: "admin" }}
 * >
 *   <YourComponent />
 * </StoryboardAuthWrapper>
 * ```
 *
 * With mock auth context:
 * ```tsx
 * <StoryboardAuthWrapper
 *   mockUser={{ id: "123", email: "test@example.com", role: "admin" }}
 *   useMockAuth={true}
 * >
 *   <YourComponent />
 * </StoryboardAuthWrapper>
 * ```
 */
export function StoryboardAuthWrapper({
  children,
  mockUser,
  mockLoading = false,
  useMockAuth = false,
}: StoryboardAuthWrapperProps) {
  // Determine which auth provider to use
  const AuthComponent = useMockAuth ? MockAuthProvider : AuthProvider;
  const mockProps = useMockAuth ? { mockUser, mockLoading } : {};

  return (
    <div className="storyboard-auth-wrapper">
      <AuthComponent {...mockProps}>{children}</AuthComponent>

      {/* Enhanced indicator with more information */}
      <div className="fixed bottom-2 right-2 flex flex-col gap-1 items-end">
        <Badge
          variant="outline"
          className="bg-slate-800 text-white hover:bg-slate-700 transition-colors"
        >
          StoryboardAuthWrapper Active
        </Badge>

        {mockUser && (
          <Badge
            variant="outline"
            className="bg-teal-700 text-white hover:bg-teal-600 transition-colors"
          >
            Mock User: {mockUser.email}
          </Badge>
        )}

        {mockLoading && (
          <Badge
            variant="outline"
            className="bg-amber-600 text-white hover:bg-amber-500 transition-colors"
          >
            Mock Loading State
          </Badge>
        )}

        {useMockAuth && (
          <Badge
            variant="outline"
            className="bg-purple-700 text-white hover:bg-purple-600 transition-colors"
          >
            Using Mock Auth Context
          </Badge>
        )}
      </div>
    </div>
  );
}

export default StoryboardAuthWrapper;
