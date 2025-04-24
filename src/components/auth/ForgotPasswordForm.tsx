import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { KeyRound } from "lucide-react";
import AuthLayout from "./AuthLayout";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message || "Failed to send reset email");
        return;
      }

      // Show success toast
      toast({
        title: "Reset email sent",
        description: "Check your email for a link to reset your password.",
        variant: "default",
      });

      setIsSubmitted(true);
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
              <KeyRound className="h-6 w-6 text-teal-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Reset Password
              </h1>
            </div>
            <p className="text-sm text-slate-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                <p className="text-teal-700">
                  We've sent a password reset link to <strong>{email}</strong>.
                  Please check your email and follow the instructions to reset
                  your password.
                </p>
              </div>
              <p className="text-sm text-slate-600">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
                >
                  try again
                </button>
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
                >
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
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
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <div className="text-sm text-center text-slate-600">
                <Link
                  to="/login"
                  className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
