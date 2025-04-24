import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../supabase/auth";

// Mock the supabase client
vi.mock("../supabase/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// Mock the roles module
vi.mock("../lib/roles", () => ({
  hasPermission: vi.fn((role, permission) => {
    if (role === "admin") return true;
    if (role === "user" && permission === "view_projects") return true;
    return false;
  }),
  ROLES: {
    ADMIN: "admin",
    MODERATOR: "moderator",
    USER: "user",
    GUEST: "guest",
  },
}));

// Test component that uses the auth context
function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user-status">
        {auth.user ? "Logged In" : "Logged Out"}
      </div>
      <div data-testid="user-email">{auth.user?.email || "No Email"}</div>
      <div data-testid="loading-status">
        {auth.loading ? "Loading" : "Not Loading"}
      </div>
      <div data-testid="auth-error">{auth.authError || "No Error"}</div>
      <button
        data-testid="sign-in-btn"
        onClick={() => auth.signIn("test@example.com", "password")}
      >
        Sign In
      </button>
      <button
        data-testid="sign-up-btn"
        onClick={() => auth.signUp("test@example.com", "password", "Test User")}
      >
        Sign Up
      </button>
      <button data-testid="sign-out-btn" onClick={() => auth.signOut()}>
        Sign Out
      </button>
      <div data-testid="user-role">{auth.getUserRole() || "No Role"}</div>
      <div data-testid="has-permission">
        {auth.hasPermission("view_projects")
          ? "Has Permission"
          : "No Permission"}
      </div>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("initializes with loading state and no user", async () => {
    // Mock getSession to return no session
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Initially should be in loading state
    expect(screen.getByTestId("loading-status").textContent).toBe("Loading");

    // After getSession resolves, should not be loading and have no user
    await waitFor(() => {
      expect(screen.getByTestId("loading-status").textContent).toBe(
        "Not Loading",
      );
    });
    expect(screen.getByTestId("user-status").textContent).toBe("Logged Out");
    expect(screen.getByTestId("user-email").textContent).toBe("No Email");
  });

  it("sets user when session exists", async () => {
    // Mock getSession to return a session with a user
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { role: "user" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // After getSession resolves, should have a user
    await waitFor(() => {
      expect(screen.getByTestId("user-status").textContent).toBe("Logged In");
    });
    expect(screen.getByTestId("user-email").textContent).toBe(
      "test@example.com",
    );
    expect(screen.getByTestId("user-role").textContent).toBe("user");
  });

  it("handles sign in", async () => {
    // Mock getSession to return no session initially
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock signInWithPassword to return a user
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { role: "user" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.signInWithPassword,
    ).mockResolvedValue({
      data: { user: mockUser, session: { user: mockUser } },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading-status").textContent).toBe(
        "Not Loading",
      );
    });

    // Click sign in button
    const signInButton = screen.getByTestId("sign-in-btn");
    await act(async () => {
      signInButton.click();
    });

    // Verify signInWithPassword was called with correct arguments
    expect(
      require("../supabase/supabase").supabase.auth.signInWithPassword,
    ).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
      options: {},
    });
  });

  it("handles sign up", async () => {
    // Mock getSession to return no session initially
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock signUp to return a user
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { full_name: "Test User" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.signUp,
    ).mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading-status").textContent).toBe(
        "Not Loading",
      );
    });

    // Click sign up button
    const signUpButton = screen.getByTestId("sign-up-btn");
    await act(async () => {
      signUpButton.click();
    });

    // Verify signUp was called with correct arguments
    expect(
      require("../supabase/supabase").supabase.auth.signUp,
    ).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
      options: {
        data: {
          full_name: "Test User",
        },
      },
    });
  });

  it("handles sign out", async () => {
    // Mock getSession to return a session with a user
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { role: "user" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    // Mock signOut to succeed
    vi.mocked(
      require("../supabase/supabase").supabase.auth.signOut,
    ).mockResolvedValue({
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Wait for user to be set
    await waitFor(() => {
      expect(screen.getByTestId("user-status").textContent).toBe("Logged In");
    });

    // Click sign out button
    const signOutButton = screen.getByTestId("sign-out-btn");
    await act(async () => {
      signOutButton.click();
    });

    // Verify signOut was called
    expect(
      require("../supabase/supabase").supabase.auth.signOut,
    ).toHaveBeenCalled();
  });

  it("handles permission checks correctly", async () => {
    // Mock getSession to return a session with a user that has a role
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { role: "user" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Wait for user to be set
    await waitFor(() => {
      expect(screen.getByTestId("user-status").textContent).toBe("Logged In");
    });

    // Check that permission check works
    expect(screen.getByTestId("has-permission").textContent).toBe(
      "Has Permission",
    );

    // Change the mock to return a user with admin role
    const mockAdminUser = {
      id: "admin-123",
      email: "admin@example.com",
      user_metadata: { role: "admin" },
    };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: { user: mockAdminUser } },
      error: null,
    });

    // Trigger a re-render by simulating an auth state change
    await act(async () => {
      const authStateChangeCallback = vi.mocked(
        require("../supabase/supabase").supabase.auth.onAuthStateChange,
      ).mock.calls[0][0];
      authStateChangeCallback("SIGNED_IN", {
        user: mockAdminUser,
      });
    });

    // Check that role is updated
    await waitFor(() => {
      expect(screen.getByTestId("user-role").textContent).toBe("admin");
    });
  });

  it("handles authentication errors", async () => {
    // Mock getSession to return no session initially
    vi.mocked(
      require("../supabase/supabase").supabase.auth.getSession,
    ).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock signInWithPassword to return an error
    const mockError = { message: "Invalid credentials" };
    vi.mocked(
      require("../supabase/supabase").supabase.auth.signInWithPassword,
    ).mockResolvedValue({
      data: { user: null, session: null },
      error: mockError,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>,
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading-status").textContent).toBe(
        "Not Loading",
      );
    });

    // Click sign in button
    const signInButton = screen.getByTestId("sign-in-btn");
    await act(async () => {
      signInButton.click();
    });

    // Verify error is set
    await waitFor(() => {
      expect(screen.getByTestId("auth-error").textContent).not.toBe("No Error");
    });
  });
});
