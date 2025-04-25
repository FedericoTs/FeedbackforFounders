import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "../admin/UserManagement";
import RoleAssignment from "../admin/RoleAssignment";
import PermissionsManager from "../admin/PermissionsManager";
import PermissionGate from "../auth/PermissionGate";
function AdminDashboard() {
  return (
    <PermissionGate
      permission="manage_users"
      fallback={
        <div className="container mx-auto py-12 px-4">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-rose-700 mb-2">
              Access Denied
            </h2>
            <p className="text-rose-600">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      }
    >
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="roles">Role Assignment</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RoleAssignment />
              <div className="space-y-6">
                <div className="bg-slate-50 border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Role Permissions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-teal-700">Admin</h4>
                      <p className="text-sm text-slate-600">
                        Full access to all system features and settings.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-teal-700">Moderator</h4>
                      <p className="text-sm text-slate-600">
                        Can moderate content, manage projects, and view
                        analytics.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-teal-700">User</h4>
                      <p className="text-sm text-slate-600">
                        Can create and manage their own projects, provide
                        feedback, and view basic analytics.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-teal-700">Guest</h4>
                      <p className="text-sm text-slate-600">
                        Limited access to view projects and profiles only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <PermissionsManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-slate-50 border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-slate-600">
                System settings management is under development.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <div className="bg-slate-50 border rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-slate-600">
                System logs viewer is under development.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGate>
  );
}

export default AdminDashboard;
