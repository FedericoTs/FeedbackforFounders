import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { LogIn } from "lucide-react";
import AuthLayout from "./AuthLayout";

export default function EnhancedLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from || "/dashboard";

  useEffect(() => {
    // Set error from auth provider if available
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signIn(email, password, { rememberMe });

      if (error) {
        setError(error.message || "Invalid email or password");
        return;
      }

      // Show success toast
      toast({
        title: "Login successful",
        description: "Welcome back to FeedbackLoop!",
        variant: "default",
      });

      // Navigate to the redirect path
      navigate(from, { replace: true });
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
              <LogIn className="h-6 w-6 text-teal-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Sign in
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-teal-500 hover:text-teal-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-slate-600 cursor-pointer"
              >
                Remember me for 30 days
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="text-sm text-center text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
