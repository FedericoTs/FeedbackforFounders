import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROLES, PERMISSIONS, Role, Permission } from "@/lib/roles";
import PermissionGate from "../auth/PermissionGate";

export default function PermissionsManager() {
  const { toast } = useToast();
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPermissions, setOriginalPermissions] = useState<
    Record<string, string[]>
  >({});

  // Fetch current permissions from the database
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("role_permissions")
          .select("role, permission");

        if (error) throw error;

        // Group permissions by role
        const permissionsByRole: Record<string, string[]> = {};
        data.forEach((item) => {
          if (!permissionsByRole[item.role]) {
            permissionsByRole[item.role] = [];
          }
          permissionsByRole[item.role].push(item.permission);
        });

        // Ensure all roles have an entry, even if empty
        Object.values(ROLES).forEach((role) => {
          if (!permissionsByRole[role]) {
            permissionsByRole[role] = [];
          }
        });

        setRolePermissions(permissionsByRole);
        setOriginalPermissions(JSON.parse(JSON.stringify(permissionsByRole)));
      } catch (error: any) {
        console.error("Error fetching permissions:", error);
        toast({
          title: "Error",
          description: "Failed to load permissions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [toast]);

  // Toggle permission for a role
  const togglePermission = (role: Role, permission: Permission) => {
    setRolePermissions((prev) => {
      const newPermissions = { ...prev };
      if (newPermissions[role].includes(permission)) {
        newPermissions[role] = newPermissions[role].filter(
          (p) => p !== permission,
        );
      } else {
        newPermissions[role] = [...newPermissions[role], permission];
      }
      return newPermissions;
    });
    setHasChanges(true);
  };

  // Save changes to the database
  const saveChanges = async () => {
    try {
      setSaving(true);

      // For each role, determine which permissions were added and which were removed
      for (const role of Object.values(ROLES)) {
        const original = originalPermissions[role] || [];
        const current = rolePermissions[role] || [];

        // Permissions to add (in current but not in original)
        const toAdd = current.filter((p) => !original.includes(p));

        // Permissions to remove (in original but not in current)
        const toRemove = original.filter((p) => !current.includes(p));

        // Add new permissions
        if (toAdd.length > 0) {
          const { error: addError } = await supabase
            .from("role_permissions")
            .insert(
              toAdd.map((permission) => ({
                role,
                permission,
              })),
            );

          if (addError) throw addError;
        }

        // Remove permissions
        if (toRemove.length > 0) {
          for (const permission of toRemove) {
            const { error: removeError } = await supabase
              .from("role_permissions")
              .delete()
              .eq("role", role)
              .eq("permission", permission);

            if (removeError) throw removeError;
          }
        }
      }

      // Update original permissions to match current state
      setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
      setHasChanges(false);

      toast({
        title: "Success",
        description: "Permissions updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset changes to original state
  const resetChanges = () => {
    setRolePermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
  };

  // Group permissions by category for better organization
  const permissionCategories = {
    "User Management": [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.EDIT_ANY_PROFILE,
    ],
    "Project Management": [
      PERMISSIONS.CREATE_PROJECT,
      PERMISSIONS.EDIT_PROJECT,
      PERMISSIONS.DELETE_PROJECT,
      PERMISSIONS.VIEW_PROJECTS,
      PERMISSIONS.FEATURE_PROJECT,
    ],
    "Feedback Management": [
      PERMISSIONS.CREATE_FEEDBACK,
      PERMISSIONS.EDIT_FEEDBACK,
      PERMISSIONS.DELETE_FEEDBACK,
      PERMISSIONS.VIEW_FEEDBACK,
      PERMISSIONS.MODERATE_FEEDBACK,
    ],
    "Profile Management": [
      PERMISSIONS.EDIT_OWN_PROFILE,
      PERMISSIONS.VIEW_PROFILES,
    ],
    Analytics: [PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.EXPORT_ANALYTICS],
    System: [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_SYSTEM_LOGS],
  };

  return (
    <PermissionGate
      permission="manage_users"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-600">
            You don't have permission to manage role permissions.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Role Permissions</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetChanges}
              disabled={!hasChanges || saving || loading}
            >
              Reset
            </Button>
            <Button
              onClick={saveChanges}
              disabled={!hasChanges || saving || loading}
            >
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8 text-teal-500" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {Object.values(ROLES).map((role) => (
                    <TableHead key={role} className="text-center">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permissionCategories).map(
                  ([category, permissions]) => (
                    <React.Fragment key={category}>
                      <TableRow className="bg-slate-50">
                        <TableCell
                          colSpan={Object.values(ROLES).length + 1}
                          className="font-semibold"
                        >
                          {category}
                        </TableCell>
                      </TableRow>
                      {permissions.map((permission) => (
                        <TableRow key={permission}>
                          <TableCell className="font-medium">
                            {permission
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")}
                          </TableCell>
                          {Object.values(ROLES).map((role) => (
                            <TableCell
                              key={`${role}-${permission}`}
                              className="text-center"
                            >
                              <Checkbox
                                checked={
                                  rolePermissions[role]?.includes(permission) ||
                                  false
                                }
                                onCheckedChange={() =>
                                  togglePermission(
                                    role as Role,
                                    permission as Permission,
                                  )
                                }
                                disabled={
                                  role === ROLES.ADMIN &&
                                  permission === PERMISSIONS.MANAGE_USERS
                                }
                                className="mx-auto"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-lg border text-sm">
          <p className="font-medium mb-2">Notes:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>
              Admin users always have the "Manage Users" permission and it
              cannot be removed.
            </li>
            <li>
              Changes to permissions take effect immediately after saving.
            </li>
            <li>
              Users with existing sessions may need to log out and log back in
              for permission changes to take effect.
            </li>
          </ul>
        </div>
      </div>
    </PermissionGate>
  );
}
