import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Shield } from "lucide-react";
import { validatePassword } from "@/lib/authUtils";
import AuthLayout from "./AuthLayout";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    message?: string;
  }>({ valid: false });
  const { updatePassword, authError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check password strength when password changes
  useEffect(() => {
    if (password) {
      const strength = validatePassword(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ valid: false });
    }
  }, [password]);

  // Set error from auth provider if available
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!passwordStrength.valid) {
      setError(
        passwordStrength.message || "Password does not meet requirements",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error.message || "Failed to update password");
        return;
      }

      // Show success toast
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
        variant: "default",
      });

      // Navigate to login page
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-teal-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Reset Password
              </h1>
            </div>
            <p className="text-sm text-slate-600">
              Create a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
              {password && (
                <p
                  className={`text-xs ${passwordStrength.valid ? "text-green-600" : "text-amber-600"}`}
                >
                  {passwordStrength.message || "Password meets requirements"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-rose-500">Passwords do not match</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-rose-500 font-medium">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Updating password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="text-sm text-center text-slate-600">
            <Link
              to="/login"
              className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
