import { useState } from "react";
import { useAuth } from "../../../supabase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { LogIn } from "lucide-react";
import {
  DesignCard,
  GradientButton,
  GradientText,
} from "@/components/ui/design-system";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      setError("Invalid email or password");
    }
  };

  return (
    <AuthLayout>
      <DesignCard className="w-full p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <LogIn className="h-6 w-6 text-teal-500" />
              <GradientText as="h1" className="text-2xl font-bold">
                Sign in
              </GradientText>
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
                placeholder="Enter your password"
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
              Sign in
            </GradientButton>
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
      </DesignCard>
    </AuthLayout>
  );
}
