/**
 * This file provides constants for commonly used import paths
 * to help avoid path-related errors.
 */

// Root paths
export const PATHS = {
  // Supabase
  SUPABASE_CLIENT: "../../supabase/supabase",
  SUPABASE_AUTH: "../../supabase/auth",

  // Services
  ACTIVITY_SERVICE: "@/services/activity",
  PROJECT_SERVICE: "@/services/project",
  PROFILE_SERVICE: "@/services/profile",
  GAMIFICATION_SERVICE: "@/services/gamification",

  // UI Components
  UI: "@/components/ui",

  // Helper function to get the correct relative path based on the file's depth
  getSupabasePath: (depth: number): { auth: string; client: string } => {
    const prefix = "../".repeat(depth);
    return {
      auth: `${prefix}supabase/auth`,
      client: `${prefix}supabase/supabase`,
    };
  },
};

/**
 * Usage examples:
 *
 * // In a file at src/components/MyComponent.tsx
 * import { useAuth } from "../../supabase/auth";
 *
 * // Can be replaced with:
 * import { PATHS } from "@/lib/paths";
 * import { useAuth } from PATHS.SUPABASE_AUTH;
 *
 * // Or for files at different depths:
 * import { PATHS } from "@/lib/paths";
 * import { useAuth } from PATHS.getSupabasePath(2).auth; // 2 levels deep from src
 */
