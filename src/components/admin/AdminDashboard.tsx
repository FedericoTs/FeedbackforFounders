import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import UserManagement from "./UserManagement";
import RoleAssignment from "./RoleAssignment";
import PermissionsManager from "./PermissionsManager";
import SessionManagement from "./SessionManagement";
import AccountLockoutManager from "./AccountLockoutManager";
import { useAuth } from "@/supabase/auth";
import { Shield, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLockedAccounts } from "@/lib/rateLimiter";

export default function AdminDashboard() {
  const { hasPermission } = useAuth();
  const canManageUsers = hasPermission("manage_users");
  const canManageRoles = hasPermission("manage_roles");
  const canManagePermissions = hasPermission("manage_permissions");

  const lockedAccountsCount = canManageUsers ? getLockedAccounts().length : 0;

  if (!canManageUsers && !canManageRoles && !canManagePermissions) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription>System administration dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 text-center">
              <div>
                <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Access Denied
                </h3>
                <p className="text-slate-600">
                  You don't have permission to access the administration
                  dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-8">
          {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
          {canManageRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
          {canManagePermissions && (
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="lockouts" className="relative">
              Account Lockouts
              {lockedAccountsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lockedAccountsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>
        )}

        {canManageRoles && (
          <TabsContent value="roles" className="space-y-6">
            <RoleAssignment />
          </TabsContent>
        )}

        {canManagePermissions && (
          <TabsContent value="permissions" className="space-y-6">
            <PermissionsManager />
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="sessions" className="space-y-6">
            <SessionManagement />
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="lockouts" className="space-y-6">
            <AccountLockoutManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
