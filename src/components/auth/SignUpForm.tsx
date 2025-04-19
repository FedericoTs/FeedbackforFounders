import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  DesignCard,
  GradientButton,
  GradientText,
  GradientBadge,
} from "@/components/ui/design-system";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, fullName);
      toast({
        title: "Account created successfully",
        description: "Please check your email to verify your account.",
        variant: "default",
      });
      navigate("/login");
    } catch (error) {
      setError("Error creating account");
    }
  };

  return (
    <AuthLayout>
      <DesignCard className="w-full p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <GradientBadge className="mb-2">
                <UserPlus className="h-4 w-4 mr-1" /> Join FeedbackLoop
              </GradientBadge>
              <GradientText as="h1" className="text-2xl font-bold">
                Create an account
              </GradientText>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
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
                className="border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            {error && (
              <p className="text-sm text-rose-500 font-medium">{error}</p>
            )}
            <GradientButton type="submit" className="w-full py-2">
              Create account
            </GradientButton>
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
      </DesignCard>
    </AuthLayout>
  );
}
