import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import Dashboard from "./components/pages/Dashboard";
import Discovery from "./components/pages/Discovery";
import FeedbackInterface from "./components/pages/FeedbackInterface";
import Analytics from "./components/pages/Analytics";
import Projects from "./components/pages/Projects";
import ProjectDetails from "./components/pages/ProjectDetails";
import Profile from "./components/pages/Profile";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import { AuthProvider, useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/ui/theme-provider";
import DashboardLayout from "./components/dashboard/layout/DashboardLayout";
import { AwardToastProvider } from "./hooks/useAwardToast";
import { AwardToastListener } from "./components/AwardToastListener";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

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
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
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
          <Route path="feedback" element={<FeedbackInterface />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="profile" element={<Profile />} />
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
            <AppRoutes />
          </Suspense>
          <Toaster />
          <AwardToastListener />
        </AwardToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
