/**
 * Role definitions and permission mappings for the FeedbackLoop platform
 */

// Define role constants
export const ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
  GUEST: "guest",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Define permission constants
export const PERMISSIONS = {
  // User management
  MANAGE_USERS: "manage_users",
  VIEW_USERS: "view_users",

  // Project permissions
  CREATE_PROJECT: "create_project",
  EDIT_PROJECT: "edit_project",
  DELETE_PROJECT: "delete_project",
  VIEW_PROJECTS: "view_projects",
  FEATURE_PROJECT: "feature_project",

  // Feedback permissions
  CREATE_FEEDBACK: "create_feedback",
  EDIT_FEEDBACK: "edit_feedback",
  DELETE_FEEDBACK: "delete_feedback",
  VIEW_FEEDBACK: "view_feedback",
  MODERATE_FEEDBACK: "moderate_feedback",

  // Profile permissions
  EDIT_OWN_PROFILE: "edit_own_profile",
  EDIT_ANY_PROFILE: "edit_any_profile",
  VIEW_PROFILES: "view_profiles",

  // Analytics permissions
  VIEW_ANALYTICS: "view_analytics",
  EXPORT_ANALYTICS: "export_analytics",

  // System permissions
  MANAGE_SYSTEM: "manage_system",
  VIEW_SYSTEM_LOGS: "view_system_logs",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Define role hierarchy (higher index = higher privileges)
export const ROLE_HIERARCHY: Role[] = [
  ROLES.GUEST,
  ROLES.USER,
  ROLES.MODERATOR,
  ROLES.ADMIN,
];

// Define permission mappings for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MODERATOR]: [
    // User permissions
    PERMISSIONS.VIEW_USERS,

    // Project permissions
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.FEATURE_PROJECT,

    // Feedback permissions
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.EDIT_FEEDBACK,
    PERMISSIONS.DELETE_FEEDBACK,
    PERMISSIONS.VIEW_FEEDBACK,
    PERMISSIONS.MODERATE_FEEDBACK,

    // Profile permissions
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.VIEW_PROFILES,

    // Analytics permissions
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_ANALYTICS,
  ],
  [ROLES.USER]: [
    // Project permissions
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.VIEW_PROJECTS,

    // Feedback permissions
    PERMISSIONS.CREATE_FEEDBACK,
    PERMISSIONS.EDIT_FEEDBACK,
    PERMISSIONS.VIEW_FEEDBACK,

    // Profile permissions
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.VIEW_PROFILES,

    // Analytics permissions
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.GUEST]: [
    // Limited permissions
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.VIEW_PROFILES,
  ],
};

/**
 * Check if a role has a specific permission
 * @param role The role to check
 * @param permission The permission to check for
 * @returns True if the role has the permission, false otherwise
 */
export function hasPermission(
  role: Role | string | null,
  permission: Permission | string,
): boolean {
  if (!role) return false;

  // Handle string role and permission for flexibility
  const roleKey = Object.values(ROLES).includes(role as Role)
    ? (role as Role)
    : null;

  if (!roleKey) return false;

  return ROLE_PERMISSIONS[roleKey].includes(permission as Permission);
}

/**
 * Check if a role has a higher or equal rank than another role
 * @param role The role to check
 * @param thanRole The role to compare against
 * @returns True if role has higher or equal rank than thanRole
 */
export function hasHigherOrEqualRank(
  role: Role | string | null,
  thanRole: Role | string,
): boolean {
  if (!role) return false;

  // Handle string role and thanRole for flexibility
  const roleKey = Object.values(ROLES).includes(role as Role)
    ? (role as Role)
    : null;

  const thanRoleKey = Object.values(ROLES).includes(thanRole as Role)
    ? (thanRole as Role)
    : ROLES.GUEST;

  if (!roleKey) return false;

  return ROLE_HIERARCHY.indexOf(roleKey) >= ROLE_HIERARCHY.indexOf(thanRoleKey);
}

/**
 * Get all permissions for a role
 * @param role The role to get permissions for
 * @returns Array of permissions for the role
 */
export function getPermissionsForRole(
  role: Role | string | null,
): Permission[] {
  if (!role) return [];

  // Handle string role for flexibility
  const roleKey = Object.values(ROLES).includes(role as Role)
    ? (role as Role)
    : null;

  if (!roleKey) return [];

  return ROLE_PERMISSIONS[roleKey];
}

/**
 * Fetch permissions from the database for a role
 * @param role The role to fetch permissions for
 * @returns Promise resolving to an array of permissions
 */
export async function fetchRolePermissions(
  role: Role | string,
): Promise<string[]> {
  try {
    // This function would typically make a database call
    // For now, we'll return the static permissions defined above
    const roleKey = Object.values(ROLES).includes(role as Role)
      ? (role as Role)
      : ROLES.GUEST;

    return ROLE_PERMISSIONS[roleKey];
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return [];
  }
}
