import { Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  Navigate,
  Route,
  Routes,
  useRoutes,
  useLocation,
} from "react-router-dom";
import routes from "tempo-routes";
import EnhancedLoginForm from "./components/auth/EnhancedLoginForm";
import EnhancedSignUpForm from "./components/auth/EnhancedSignUpForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import EmailVerification from "./components/auth/EmailVerification";
import Dashboard from "./components/pages/Dashboard";
import Discovery from "./components/pages/Discovery";
import FeedbackInterface from "./components/pages/FeedbackInterface";
import ProjectDiscovery from "./components/pages/ProjectDiscovery";
import Analytics from "./components/pages/Analytics";
import Projects from "./components/pages/Projects";
import ProjectDetails from "./components/pages/ProjectDetails";
import Profile from "./components/pages/Profile";
import Success from "./components/pages/success";
import Home from "./components/pages/home.tsx";
import FeedbackAnalytics from "./components/pages/FeedbackAnalytics";
import Notifications from "./components/pages/Notifications";
import AdminDashboard from "./components/pages/AdminDashboard";
import AuthProvider, { useAuth } from "./supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import DashboardLayout from "./components/dashboard/layout/DashboardLayout";
import { AwardToastProvider } from "./hooks/useAwardToast";
import { AwardToastListener } from "./components/AwardToastListener";
import { AuthLoading } from "./components/ui/auth-loading";
import { Spinner } from "./components/ui/spinner";

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
}

function PrivateRoute({
  children,
  requiredPermission,
  redirectTo = "/login",
}: PrivateRouteProps) {
  const { user, loading,