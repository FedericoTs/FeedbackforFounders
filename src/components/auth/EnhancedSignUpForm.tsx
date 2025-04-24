import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus } from "lucide-react";
import { validatePassword } from "@/lib/authUtils";
import AuthLayout from "./AuthLayout";

export default function EnhancedSignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    valid: boolean;
    message?: string;
  }>({ valid: false });
  const { signUp, authError } = useAuth();
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

    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        setError(error.message || "Failed to create account");
        return;
      }

      // Show success toast
      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
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
              <UserPlus className="h-6 w-6 text-teal-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Create an account
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
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
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                required
              />
              <Label
                htmlFor="terms"
                className="text-sm text-slate-600 cursor-pointer"
              >
                I accept the{" "}
                <Link
                  to="/terms"
                  className="text-teal-500 hover:text-teal-600 hover:underline"
                >
                  terms and conditions
                </Link>
              </Label>
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="text-sm text-center text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
