import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import AuthLayout from "./AuthLayout";

export default function EmailVerification() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Extract token and type from URL
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const type = params.get("type");

    if (type === "signup" && token) {
      verifyEmail(token);
    } else {
      setIsVerifying(false);
      setError("Invalid verification link");
    }
  }, [location]);

  const verifyEmail = async (token: string) => {
    try {
      setIsVerifying(true);

      // This is a placeholder for the actual verification logic
      // In a real implementation, you would use Supabase's verification endpoint
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "signup",
      });

      if (error) throw error;

      setIsVerified(true);
      setEmail(data?.user?.email || "");

      toast({
        title: "Email verified",
        description: "Your email has been successfully verified.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify email");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    try {
      setIsResending(true);

      // This is a placeholder for the actual resend verification logic
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "A new verification email has been sent to your inbox.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Resend verification error:", err);
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Email Verification
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            {isVerifying ? (
              <div className="text-center py-8">
                <Spinner className="h-8 w-8 mx-auto text-teal-500 mb-4" />
                <p className="text-slate-600">Verifying your email...</p>
              </div>
            ) : isVerified ? (
              <div className="text-center py-4 space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h2 className="text-xl font-semibold text-slate-900">
                  Email Verified
                </h2>
                <p className="text-slate-600">
                  Your email has been successfully verified. You can now sign in
                  to your account.
                </p>
                <Button
                  onClick={() => navigate("/login")}
                  className="mt-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-rose-500 mb-2" />
                <h2 className="text-xl font-semibold text-slate-900">
                  Verification Failed
                </h2>
                <p className="text-slate-600">
                  {error ||
                    "We couldn't verify your email. The link may have expired or is invalid."}
                </p>
                {email && (
                  <div className="pt-2">
                    <Button
                      onClick={handleResendVerification}
                      variant="outline"
                      disabled={isResending}
                      className="flex items-center"
                    >
                      {isResending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="text-teal-500 hover:text-teal-600 hover:underline font-medium"
                  >
                    Return to login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
