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
import Leaderboard from "./components/pages/Leaderboard";
import AuthProvider, { useAuth } from "./supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import DashboardLayout from "./components/dashboard/layout/DashboardLayout";
import { AwardToastProvider } from "./hooks/useAwardToast";
import { AwardToastListener } from "./components/AwardToastListener";
import PointsAnimationListener from "./components/dashboard/PointsAnimationListener";
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
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-6 w-6 text-teal-500" />
        <span className="ml-2 text-slate-600">Loading authentication...</span>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Check for required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}

function AppRoutes() {
  // For the tempo routes - moved before the main routes to ensure proper routing
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <>
      {tempoRoutes}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<EnhancedLoginForm />} />
        <Route path="/signup" element={<EnhancedSignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/success" element={<Success />} />

        {/* Dashboard routes with shared layout */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="discovery" element={<Discovery />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="profile" element={<Profile />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="feedback" element={<FeedbackInterface />} />
          <Route path="feedback/:id" element={<FeedbackInterface />} />
          <Route path="feedback-analytics" element={<FeedbackAnalytics />} />
          <Route
            path="feedback-analytics/:id"
            element={<FeedbackAnalytics />}
          />
          <Route path="project-discovery" element={<ProjectDiscovery />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* Add this before any catchall route to allow Tempo to capture routes */}
        {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <AwardToastProvider>
          <Suspense fallback={<p>Loading...</p>}>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </Suspense>
          <Toaster />
          <AwardToastListener />
        </AwardToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
