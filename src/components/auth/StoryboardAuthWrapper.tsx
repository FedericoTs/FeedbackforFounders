import React from "react";
import { AuthProvider } from "@/supabase/auth";

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
}

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
 */
export function StoryboardAuthWrapper({
  children,
  mockUser,
  mockLoading,
}: StoryboardAuthWrapperProps) {
  // In a real implementation, we might want to provide mock implementations
  // of the auth methods for storyboards, but for now we'll just use the
  // real AuthProvider

  return (
    <div className="storyboard-auth-wrapper">
      <AuthProvider>{children}</AuthProvider>

      {/* Optional: Add a small indicator that this is wrapped with StoryboardAuthWrapper */}
      <div className="fixed bottom-2 right-2 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity">
        StoryboardAuthWrapper Active
      </div>
    </div>
  );
}

export default StoryboardAuthWrapper;
