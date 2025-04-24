import { supabase } from "@/supabase/supabase";
import { ROLES, Role, Permission } from "@/lib/roles";

export interface UserWithRole {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

export const roleService = {
  /**
   * Fetch all users with their roles
   */
  async fetchUsers(): Promise<UserWithRole[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, created_at, last_sign_in_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  /**
   * Update a user's role
   */
  async updateUserRole(userId: string, role: Role): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error updating user role:", error);
      return false;
    }
  },

  /**
   * Fetch permissions for a specific role
   */
  async fetchRolePermissions(role: Role): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission")
        .eq("role", role);

      if (error) throw error;

      return data?.map((item) => item.permission) || [];
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      return [];
    }
  },

  /**
   * Add a permission to a role
   */
  async addPermissionToRole(
    role: Role,
    permission: Permission,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("role_permissions")
        .insert({ role, permission });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error adding permission to role:", error);
      return false;
    }
  },

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(
    role: Role,
    permission: Permission,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", role)
        .eq("permission", permission);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error removing permission from role:", error);
      return false;
    }
  },

  /**
   * Check if a user has a specific role
   */
  async checkUserRole(userId: string, role: Role): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return data?.role === role;
    } catch (error) {
      console.error("Error checking user role:", error);
      return false;
    }
  },

  /**
   * Get all available roles
   */
  getAvailableRoles(): Role[] {
    return Object.values(ROLES);
  },
};
