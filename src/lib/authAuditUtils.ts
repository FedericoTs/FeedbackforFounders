/**
 * Utility functions for auditing authentication usage in the codebase
 */

import { AuthProvider } from "@/supabase/auth";
import StoryboardAuthWrapper from "@/components/auth/StoryboardAuthWrapper";
import { withAuth } from "./withAuth";

export interface ComponentAuditItem {
  name: string;
  path: string;
  usesAuth: boolean;
  properlyWrapped: boolean;
  wrapperType: "AuthProvider" | "StoryboardAuthWrapper" | "withAuth" | "None";
  notes?: string;
  fixRecommendation?: string;
}

/**
 * Determines if a component is properly wrapped with an AuthProvider
 * This is a simplified implementation for demonstration purposes
 * In a real implementation, this would involve AST parsing
 */
export function isComponentProperlyWrapped(componentCode: string): {
  usesAuth: boolean;
  properlyWrapped: boolean;
  wrapperType: "AuthProvider" | "StoryboardAuthWrapper" | "withAuth" | "None";
} {
  // Check if component uses useAuth
  const usesAuth = componentCode.includes("useAuth");

  if (!usesAuth) {
    return { usesAuth, properlyWrapped: true, wrapperType: "None" };
  }

  // Check for different wrapper types
  const hasAuthProvider =
    componentCode.includes("<AuthProvider") ||
    componentCode.includes("AuthProvider>");
  const hasStoryboardWrapper =
    componentCode.includes("<StoryboardAuthWrapper") ||
    componentCode.includes("StoryboardAuthWrapper>");
  const usesWithAuth =
    componentCode.includes("withAuth(") ||
    componentCode.includes("export default withAuth");

  if (hasAuthProvider) {
    return { usesAuth, properlyWrapped: true, wrapperType: "AuthProvider" };
  }

  if (hasStoryboardWrapper) {
    return {
      usesAuth,
      properlyWrapped: true,
      wrapperType: "StoryboardAuthWrapper",
    };
  }

  if (usesWithAuth) {
    return { usesAuth, properlyWrapped: true, wrapperType: "withAuth" };
  }

  // If uses useAuth but has no wrapper
  return { usesAuth, properlyWrapped: false, wrapperType: "None" };
}

/**
 * Generates a recommendation for fixing a component that's not properly wrapped
 */
export function generateFixRecommendation(item: ComponentAuditItem): string {
  if (!item.usesAuth || item.properlyWrapped) {
    return "No fixes needed";
  }

  // For storyboard components
  if (item.path.includes("storyboards") || item.path.includes("stories")) {
    return "Wrap component with StoryboardAuthWrapper or use withAuth HOC";
  }

  // For isolated components
  if (item.path.includes("components")) {
    return "Use withAuth HOC or ensure component is only used within AuthProvider context";
  }

  return "Ensure component is wrapped with AuthProvider or use withAuth HOC";
}

/**
 * Generates a comprehensive audit report for all components using useAuth
 * This is a simplified implementation for demonstration purposes
 */
export function generateAuthAuditReport(components: ComponentAuditItem[]): {
  totalComponents: number;
  usesAuthCount: number;
  properlyWrappedCount: number;
  needsFixingCount: number;
  needsFixing: ComponentAuditItem[];
  properlyWrapped: ComponentAuditItem[];
} {
  const usesAuth = components.filter((c) => c.usesAuth);
  const properlyWrapped = usesAuth.filter((c) => c.properlyWrapped);
  const needsFixing = usesAuth.filter((c) => !c.properlyWrapped);

  return {
    totalComponents: components.length,
    usesAuthCount: usesAuth.length,
    properlyWrappedCount: properlyWrapped.length,
    needsFixingCount: needsFixing.length,
    needsFixing,
    properlyWrapped,
  };
}
