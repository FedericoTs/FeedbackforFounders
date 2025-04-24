import React, { useState } from "react";
import { useAuth } from "@/supabase/auth";
import { supabase } from "@/supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ROLES, Role } from "@/lib/roles";
import PermissionGate from "../auth/PermissionGate";

export default function RoleAssignment() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(ROLES.USER);
  const [loading, setLoading] = useState(false);

  const handleAssignRole = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // First, check if the user exists by trying to update their role
      const success = await roleService.updateUserRole(email, role);

      if (!success) {
        toast({
          title: "Error",
          description:
            "User not found or could not update role. Please check the email address.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Role ${role} assigned to ${email} successfully.`,
      });

      // Reset form
      setEmail("");
      setRole(ROLES.USER);
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGate
      permission="manage_users"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-600">
            You don't have permission to assign roles.
          </p>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Assign Role</CardTitle>
          <CardDescription>
            Assign a role to a user by their email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              User Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                <SelectItem value={ROLES.MODERATOR}>Moderator</SelectItem>
                <SelectItem value={ROLES.USER}>User</SelectItem>
                <SelectItem value={ROLES.GUEST}>Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleAssignRole}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Assigning...
              </>
            ) : (
              "Assign Role"
            )}
          </Button>
        </CardFooter>
      </Card>
    </PermissionGate>
  );
}
