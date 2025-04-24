import React from "react";
import { AuthProvider } from "@/supabase/auth";

interface StoryboardAuthWrapperProps {
  children: React.ReactNode;
}

/**
 * A wrapper component that provides AuthProvider context for storyboards
 * This allows components in storyboards to use the useAuth hook
 */
export function StoryboardAuthWrapper({
  children,
}: StoryboardAuthWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

export default StoryboardAuthWrapper;
