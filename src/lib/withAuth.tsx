import React from "react";
import { AuthProvider } from "@/supabase/auth";

/**
 * Higher-Order Component (HOC) that wraps a component with AuthProvider
 * This ensures the wrapped component has access to the auth context
 *
 * @param Component The component to wrap with AuthProvider
 * @returns A new component wrapped with AuthProvider
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const WithAuth: React.FC<P> = (props) => {
    return (
      <AuthProvider>
        <Component {...props} />
      </AuthProvider>
    );
  };

  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || "Component";
  WithAuth.displayName = `withAuth(${displayName})`;

  return WithAuth;
}

export default withAuth;
