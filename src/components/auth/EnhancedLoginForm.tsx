import React, { useState, useEffect, useRef } from "react";
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
import AuthErrorBoundary from "./AuthErrorBoundary";
import AuthError from "../ui/auth-error";
import AuthRetryIndicator from "../ui/auth-retry-indicator";
import {
  createStandardError,
  ErrorCategory,
  ErrorSeverity,
} from "@/lib/errorHandler";
import { withAuthRetry } from "@/lib/authUtils";

export default function EnhancedLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [standardError, setStandardError] = useState<ReturnType<
    typeof createStandardError
  > | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const maxRetryAttempts = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { signIn, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from || "/dashboard";

  // Reset form state when component mounts
  useEffect(() => {
    return () => {
      setStandardError(null);
      setIsLoading(false);
      setIsRetrying(false);
      setRetryAttempt(0);

      // Clear any pending retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Set error from auth provider if available
  useEffect(() => {
    if (authError) {
      setStandardError(
        createStandardError(
          { message: authError },
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.ERROR,
        ),
      );
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStandardError(null);
    setIsRetrying(false);
    setRetryAttempt(0);

    try {
      // Use withAuthRetry for automatic retry with exponential backoff
      const result = await withAuthRetry(
        async () => {
          const result = await signIn(email, password, { rememberMe });
          if (result.error) {
            throw result.error;
          }
          return result;
        },
        {
          maxRetries: maxRetryAttempts,
          onRetry: (error, attempt, delay) => {
            console.log(
              `Retry attempt ${attempt} after ${delay}ms due to:`,
              error,
            );
            setIsRetrying(true);
            setRetryAttempt(attempt);

            // Update UI to show retry progress
            toast({
              title: "Retrying login",
              description: `Attempt ${attempt} of ${maxRetryAttempts}. Please wait...`,
              variant: "default",
            });
          },
          onFailure: (error, attempts) => {
            console.error(`Failed after ${attempts} attempts:`, error);
            setIsRetrying(false);
            setStandardError(
              createStandardError(
                error,
                ErrorCategory.AUTHENTICATION,
                ErrorSeverity.ERROR,
              ),
            );
          },
          isRetryable: (error) => {
            // Only retry network or server errors, not invalid credentials
            if (
              error.message?.includes("Invalid login credentials") ||
              error.message?.includes("Invalid email") ||
              error.message?.includes("Invalid password")
            ) {
              return false;
            }
            return true;
          },
        },
      );

      // If we get here, the login was successful
      toast({
        title: "Login successful",
        description: "Welcome back to FeedbackLoop!",
        variant: "default",
      });

      // Navigate to the redirect path
      navigate(from, { replace: true });
    } catch (err: any) {
      // This will only be reached if all retries fail or the error is not retryable
      setStandardError(
        createStandardError(
          err,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.ERROR,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    setStandardError(null);
  };

  const handleManualRetry = () => {
    // Manually trigger a retry of the login process
    setStandardError(null);
    handleSubmit(new Event("submit") as unknown as React.FormEvent);
  };

  return (
    <AuthErrorBoundary
      resetOnChange={email + password} // Reset error boundary when inputs change
    >
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

              {standardError && (
                <div className="space-y-2">
                  <AuthError error={standardError} onRetry={handleRetry} />

                  {/* Show retry indicator when retrying */}
                  {isRetrying && standardError.retryable && (
                    <AuthRetryIndicator
                      attempt={retryAttempt}
                      maxAttempts={maxRetryAttempts}
                      message="Retrying login..."
                      onManualRetry={handleManualRetry}
                    />
                  )}
                </div>
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
    </AuthErrorBoundary>
  );
}
