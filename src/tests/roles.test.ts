import { describe, it, expect, vi } from "vitest";
import {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
  hasHigherOrEqualRank,
  getPermissionsForRole,
  fetchRolePermissions,
} from "../lib/roles";

describe("Roles and Permissions System", () => {
  describe("Role Constants", () => {
    it("defines expected roles", () => {
      expect(ROLES).toEqual({
        ADMIN: "admin",
        MODERATOR: "moderator",
        USER: "user",
        GUEST: "guest",
      });
    });

    it("defines role hierarchy", () => {
      expect(ROLE_HIERARCHY).toEqual([
        ROLES.GUEST,
        ROLES.USER,
        ROLES.MODERATOR,
        ROLES.ADMIN,
      ]);
    });
  });

  describe("Permission Constants", () => {
    it("defines expected permissions", () => {
      // Check a few key permissions
      expect(PERMISSIONS.MANAGE_USERS).toBe("manage_users");
      expect(PERMISSIONS.CREATE_PROJECT).toBe("create_project");
      expect(PERMISSIONS.VIEW_FEEDBACK).toBe("view_feedback");
      expect(PERMISSIONS.EDIT_OWN_PROFILE).toBe("edit_own_profile");
    });
  });

  describe("Role Permissions", () => {
    it("assigns correct permissions to admin role", () => {
      // Admin should have all permissions
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toEqual(
        expect.arrayContaining(Object.values(PERMISSIONS)),
      );
    });

    it("assigns correct permissions to moderator role", () => {
      // Moderator should have specific permissions
      expect(ROLE_PERMISSIONS[ROLES.MODERATOR]).toContain(
        PERMISSIONS.MODERATE_FEEDBACK,
      );
      expect(ROLE_PERMISSIONS[ROLES.MODERATOR]).toContain(
        PERMISSIONS.VIEW_ANALYTICS,
      );
      // Moderator should not have admin permissions
      expect(ROLE_PERMISSIONS[ROLES.MODERATOR]).not.toContain(
        PERMISSIONS.MANAGE_USERS,
      );
    });

    it("assigns correct permissions to user role", () => {
      // User should have basic permissions
      expect(ROLE_PERMISSIONS[ROLES.USER]).toContain(
        PERMISSIONS.CREATE_PROJECT,
      );
      expect(ROLE_PERMISSIONS[ROLES.USER]).toContain(
        PERMISSIONS.EDIT_OWN_PROFILE,
      );
      // User should not have moderator permissions
      expect(ROLE_PERMISSIONS[ROLES.USER]).not.toContain(
        PERMISSIONS.MODERATE_FEEDBACK,
      );
    });

    it("assigns correct permissions to guest role", () => {
      // Guest should have very limited permissions
      expect(ROLE_PERMISSIONS[ROLES.GUEST]).toContain(
        PERMISSIONS.VIEW_PROJECTS,
      );
      expect(ROLE_PERMISSIONS[ROLES.GUEST]).toContain(
        PERMISSIONS.VIEW_PROFILES,
      );
      // Guest should not have user permissions
      expect(ROLE_PERMISSIONS[ROLES.GUEST]).not.toContain(
        PERMISSIONS.CREATE_PROJECT,
      );
    });
  });

  describe("hasPermission", () => {
    it("returns true when role has permission", () => {
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(
        hasPermission(ROLES.MODERATOR, PERMISSIONS.MODERATE_FEEDBACK),
      ).toBe(true);
      expect(hasPermission(ROLES.USER, PERMISSIONS.CREATE_PROJECT)).toBe(true);
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.VIEW_PROJECTS)).toBe(true);
    });

    it("returns false when role doesn't have permission", () => {
      expect(hasPermission(ROLES.USER, PERMISSIONS.MANAGE_USERS)).toBe(false);
      expect(hasPermission(ROLES.GUEST, PERMISSIONS.CREATE_PROJECT)).toBe(
        false,
      );
    });

    it("returns false for null or invalid role", () => {
      expect(hasPermission(null, PERMISSIONS.VIEW_PROJECTS)).toBe(false);
      expect(hasPermission("invalid_role", PERMISSIONS.VIEW_PROJECTS)).toBe(
        false,
      );
    });
  });

  describe("hasHigherOrEqualRank", () => {
    it("returns true when role has higher rank", () => {
      expect(hasHigherOrEqualRank(ROLES.ADMIN, ROLES.MODERATOR)).toBe(true);
      expect(hasHigherOrEqualRank(ROLES.MODERATOR, ROLES.USER)).toBe(true);
      expect(hasHigherOrEqualRank(ROLES.USER, ROLES.GUEST)).toBe(true);
    });

    it("returns true when role has equal rank", () => {
      expect(hasHigherOrEqualRank(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
      expect(hasHigherOrEqualRank(ROLES.USER, ROLES.USER)).toBe(true);
    });

    it("returns false when role has lower rank", () => {
      expect(hasHigherOrEqualRank(ROLES.GUEST, ROLES.USER)).toBe(false);
      expect(hasHigherOrEqualRank(ROLES.USER, ROLES.MODERATOR)).toBe(false);
      expect(hasHigherOrEqualRank(ROLES.MODERATOR, ROLES.ADMIN)).toBe(false);
    });

    it("returns false for null or invalid role", () => {
      expect(hasHigherOrEqualRank(null, ROLES.USER)).toBe(false);
      expect(hasHigherOrEqualRank("invalid_role", ROLES.USER)).toBe(false);
    });
  });

  describe("getPermissionsForRole", () => {
    it("returns correct permissions for role", () => {
      expect(getPermissionsForRole(ROLES.ADMIN)).toEqual(
        ROLE_PERMISSIONS[ROLES.ADMIN],
      );
      expect(getPermissionsForRole(ROLES.USER)).toEqual(
        ROLE_PERMISSIONS[ROLES.USER],
      );
    });

    it("returns empty array for null or invalid role", () => {
      expect(getPermissionsForRole(null)).toEqual([]);
      expect(getPermissionsForRole("invalid_role")).toEqual([]);
    });
  });

  describe("fetchRolePermissions", () => {
    it("returns permissions for valid role", async () => {
      const permissions = await fetchRolePermissions(ROLES.ADMIN);
      expect(permissions).toEqual(ROLE_PERMISSIONS[ROLES.ADMIN]);
    });

    it("returns guest permissions for invalid role", async () => {
      const permissions = await fetchRolePermissions("invalid_role");
      expect(permissions).toEqual(ROLE_PERMISSIONS[ROLES.GUEST]);
    });

    it("handles errors gracefully", async () => {
      // Mock an error in the function
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const originalImplementation = Object.getOwnPropertyDescriptor(
        Object,
        "values",
      )?.value;

      Object.defineProperty(Object, "values", {
        value: () => {
          throw new Error("Test error");
        },
      });

      const permissions = await fetchRolePermissions(ROLES.ADMIN);
      expect(permissions).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      // Restore original implementation
      Object.defineProperty(Object, "values", {
        value: originalImplementation,
      });
      consoleSpy.mockRestore();
    });
  });
});
