import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import EnhancedLoginForm from "../components/auth/EnhancedLoginForm";
import EnhancedSignUpForm from "../components/auth/EnhancedSignUpForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import EmailVerification from "../components/auth/EmailVerification";
import PermissionGate from "../components/auth/PermissionGate";
import { AuthProvider, useAuth } from "../supabase/auth";

// Mock the supabase client
vi.mock("../supabase/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
      getSession: vi
        .fn()
        .mockReturnValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock the useToast hook
vi.mock("../components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the useNavigate hook
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: "/", search: "", state: {} }),
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>,
  );
};

describe("Authentication Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("EnhancedLoginForm", () => {
    it("renders login form correctly", () => {
      renderWithProviders(<EnhancedLoginForm />);

      expect(screen.getByText("Sign in")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByText("Remember me for 30 days")).toBeInTheDocument();
      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign in" }),
      ).toBeInTheDocument();
    });

    it("handles form submission", async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        signIn: mockSignIn,
        authError: null,
      });

      renderWithProviders(<EnhancedLoginForm />);

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
          { rememberMe: false },
        );
      });
    });

    it("displays error message when login fails", async () => {
      const mockSignIn = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        signIn: mockSignIn,
        authError: "Invalid credentials",
      });

      renderWithProviders(<EnhancedLoginForm />);

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("toggles remember me checkbox", async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        signIn: mockSignIn,
        authError: null,
      });

      renderWithProviders(<EnhancedLoginForm />);

      // Check the remember me checkbox
      fireEvent.click(screen.getByLabelText("Remember me for 30 days"));

      // Fill in the form and submit
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
          { rememberMe: true },
        );
      });
    });
  });

  describe("EnhancedSignUpForm", () => {
    it("renders signup form correctly", () => {
      renderWithProviders(<EnhancedSignUpForm />);

      expect(screen.getByText("Create an account")).toBeInTheDocument();
      expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
      expect(screen.getByText("I accept the")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create account" }),
      ).toBeInTheDocument();
    });

    it("validates password strength", async () => {
      renderWithProviders(<EnhancedSignUpForm />);

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "weak" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 8 characters long"),
        ).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "Stronger1!" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Password meets requirements"),
        ).toBeInTheDocument();
      });
    });

    it("checks if passwords match", async () => {
      renderWithProviders(<EnhancedSignUpForm />);

      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "Stronger1!" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "Different1!" },
      });

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "Stronger1!" },
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Passwords do not match"),
        ).not.toBeInTheDocument();
      });
    });

    it("requires terms acceptance", async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ data: {}, error: null });
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        signUp: mockSignUp,
        authError: null,
      });

      renderWithProviders(<EnhancedSignUpForm />);

      // Fill in the form without accepting terms
      fireEvent.change(screen.getByLabelText("Full Name"), {
        target: { value: "Test User" },
      });
      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "Stronger1!" },
      });
      fireEvent.change(screen.getByLabelText("Confirm Password"), {
        target: { value: "Stronger1!" },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      // Check that the error message is displayed
      await waitFor(() => {
        expect(
          screen.getByText("You must accept the terms and conditions"),
        ).toBeInTheDocument();
      });

      // Verify that signUp was not called
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  describe("ForgotPasswordForm", () => {
    it("renders forgot password form correctly", () => {
      renderWithProviders(<ForgotPasswordForm />);

      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send reset link" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("handles form submission", async () => {
      const mockResetPassword = vi
        .fn()
        .mockResolvedValue({ data: {}, error: null });
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        resetPassword: mockResetPassword,
        authError: null,
      });

      renderWithProviders(<ForgotPasswordForm />);

      fireEvent.change(screen.getByLabelText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
      });
    });
  });

  describe("ResetPasswordForm", () => {
    it("renders reset password form correctly", () => {
      renderWithProviders(<ResetPasswordForm />);

      expect(screen.getByText("Reset Password")).toBeInTheDocument();
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm New Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset Password" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("validates password strength", async () => {
      renderWithProviders(<ResetPasswordForm />);

      fireEvent.change(screen.getByLabelText("New Password"), {
        target: { value: "weak" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Password must be at least 8 characters long"),
        ).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("New Password"), {
        target: { value: "Stronger1!" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Password meets requirements"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("PermissionGate", () => {
    it("renders children when user has permission", () => {
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        hasPermission: (permission: string) => permission === "view_projects",
      });

      render(
        <PermissionGate permission="view_projects">
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGate>,
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("renders fallback when user doesn't have permission", () => {
      vi.spyOn(require("../supabase/auth"), "useAuth").mockReturnValue({
        hasPermission: (permission: string) => permission === "view_projects",
      });

      render(
        <PermissionGate
          permission="manage_users"
          fallback={<div data-testid="fallback-content">Access Denied</div>}
        >
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGate>,
      );

      expect(screen.getByTestId("fallback-content")).toBeInTheDocument();
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("AuthProvider", () => {
    it("provides auth context to children", () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div>User ID: {auth.user?.id || "No user"}</div>;
      };

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>,
      );

      expect(screen.getByText("User ID: No user")).toBeInTheDocument();
    });
  });
});
