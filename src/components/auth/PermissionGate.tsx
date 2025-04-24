import React from "react";
import { useAuth } from "@/supabase/auth";
import { Permission } from "@/lib/roles";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions
 *
 * @example
 * <PermissionGate permission="manage_users">
 *   <AdminPanel />
 * </PermissionGate>
 *
 * @example
 * <PermissionGate
 *   permission="edit_project"
 *   fallback={<p>You don't have permission to edit this project</p>}
 * >
 *   <EditProjectForm />
 * </PermissionGate>
 */
export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
