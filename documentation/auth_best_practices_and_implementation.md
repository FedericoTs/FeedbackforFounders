# Authentication Best Practices and Implementation Guide

## Table of Contents

1. [Best Practices for Using useAuth](#best-practices-for-using-useauth)
2. [Codebase Map of useAuth Usage](#codebase-map-of-useauth-usage)
3. [Implementation Analysis](#implementation-analysis)
4. [Implementation Plan](#implementation-plan)
5. [Task Manager](#task-manager)

## Best Practices for Using useAuth

### 1. Proper Context Provider Wrapping

- **Always ensure** that components using `useAuth` are descendants of an `AuthProvider`
- Wrap your application's root component with `AuthProvider` to make authentication available throughout the app
- For isolated components (like storyboards or tests), use a dedicated wrapper component

```tsx
// Correct implementation in App.tsx
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Your routes here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// For isolated components
function IsolatedComponent() {
  return (
    <AuthProvider>
      <YourComponent />
    </AuthProvider>
  );
}
```

### 2. Route Protection

- Use a `PrivateRoute` component to protect routes that require authentication
- Implement role-based access control for routes that require specific permissions
- Handle loading states appropriately to prevent flashing of protected content

```tsx
// Example of a well-implemented PrivateRoute
function PrivateRoute({ children, requiredPermission, redirectTo = "/login" }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check for required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
```

### 3. Error Handling

- Always handle authentication errors gracefully
- Provide clear feedback to users when authentication fails
- Log authentication errors for debugging purposes

```tsx
// Example of good error handling
const { signIn, authError } = useAuth();

const handleLogin = async () => {
  try {
    const { error } = await signIn(email, password);
    if (error) {
      // Handle error appropriately
      toast.error(error.message);
    }
  } catch (err) {
    console.error("Login error:", err);
    toast.error("An unexpected error occurred");
  }
};

// Display error to user
{authError && <ErrorMessage message={authError} />}
```

### 4. Loading States

- Always handle loading states to improve user experience
- Prevent premature rendering of protected content
- Use skeleton loaders or spinners during authentication checks

```tsx
const { loading, user } = useAuth();

if (loading) {
  return <Spinner />;
}

if (!user) {
  return <Navigate to="/login" />;
}

return <ProtectedContent />;
```

### 5. Secure Token Management

- Implement token refresh mechanisms
- Store tokens securely (avoid localStorage for sensitive tokens)
- Clear tokens on logout

```tsx
// Example of secure token handling
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut(); // This should clear tokens
  // Additional cleanup if needed
};
```

### 6. Permission-Based UI Rendering

- Use the `hasPermission` function to conditionally render UI elements
- Create reusable permission gate components

```tsx
// Example of permission-based UI rendering
const { hasPermission } = useAuth();

return (
  <div>
    {hasPermission("edit_project") && (
      <Button onClick={handleEdit}>Edit Project</Button>
    )}
  </div>
);

// Or using a PermissionGate component
return (
  <PermissionGate permission="edit_project" fallback={<AccessDeniedMessage />}>
    <EditProjectForm />
  </PermissionGate>
);
```

### 7. Testing Considerations

- Mock the `useAuth` hook in tests
- Create test utilities for authentication scenarios
- Test both authenticated and unauthenticated states

```tsx
// Example of mocking useAuth in tests
vi.mock("../supabase/auth", () => ({
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    loading: false,
    hasPermission: (permission) => permission === "view_projects",
  }),
}));
```

## Codebase Map of useAuth Usage

### Core Authentication Components

1. **src/supabase/auth.tsx**
   - Defines `AuthProvider` context and `useAuth` hook
   - Dependencies: supabase client, React context API, react-router-dom
   - Exports: AuthProvider, useAuth, useIsAuthenticated

### Route Protection

1. **src/App.tsx**
   - Uses `PrivateRoute` component which uses `useAuth`
   - Wraps application with `AuthProvider`
   - Dependencies: react-router-dom, AuthProvider

### Authentication Forms

1. **src/components/auth/EnhancedLoginForm.tsx**
   - Uses `useAuth` for sign-in functionality
   - Dependencies: react-router-dom, useToast

2. **src/components/auth/EnhancedSignUpForm.tsx**
   - Uses `useAuth` for sign-up functionality
   - Dependencies: react-router-dom, useToast

3. **src/components/auth/ForgotPasswordForm.tsx**
   - Uses `useAuth` for password reset
   - Dependencies: react-router-dom, useToast

4. **src/components/auth/ResetPasswordForm.tsx**
   - Uses `useAuth` for password update
   - Dependencies: react-router-dom, useToast, authUtils

5. **src/components/auth/EmailVerification.tsx**
   - Uses `useAuth` for email verification
   - Dependencies: react-router-dom, useToast

### Permission-Based Components

1. **src/components/auth/PermissionGate.tsx**
   - Uses `useAuth` for permission checks
   - Dependencies: roles.ts

2. **src/components/admin/UserManagement.tsx**
   - Uses `useAuth` to get current user and check permissions
   - Dependencies: PermissionGate, roleService

3. **src/components/admin/RoleAssignment.tsx**
   - Uses `useAuth` for permission checks
   - Dependencies: PermissionGate, roleService

4. **src/components/admin/PermissionsManager.tsx**
   - Uses `useAuth` for permission checks
   - Dependencies: PermissionGate

### Navigation Components

1. **src/components/dashboard/layout/TopNavigation.tsx**
   - Uses `useAuth` for user info and sign-out functionality
   - Dependencies: Avatar component

### Storyboard Components

1. **src/components/auth/StoryboardAuthWrapper.tsx**
   - Provides `AuthProvider` for storyboards
   - Dependencies: AuthProvider

### Test Files

1. **src/tests/auth.test.tsx**
   - Tests authentication components
   - Mocks `useAuth` hook

2. **src/tests/authProvider.test.tsx**
   - Tests `AuthProvider` and `useAuth` hook
   - Mocks supabase client

## Implementation Analysis

### Strengths

1. **Well-structured AuthProvider**
   - Comprehensive authentication state management
   - Clear separation of concerns
   - Proper error handling

2. **Robust PrivateRoute Implementation**
   - Handles loading states
   - Supports permission-based access control
   - Preserves original navigation intent with location state

3. **Reusable PermissionGate Component**
   - Encapsulates permission logic
   - Provides fallback UI for unauthorized users
   - Simple and reusable API

4. **Comprehensive Test Coverage**
   - Tests for authentication components
   - Tests for AuthProvider
   - Proper mocking of authentication dependencies

### Areas for Improvement

1. **Potential Missing AuthProvider Wrapping**
   - Some components might be using `useAuth` without being wrapped in `AuthProvider`
   - Storyboards and isolated components need special attention

2. **Token Management**
   - Token refresh mechanism could be enhanced
   - Secure token storage could be improved

3. **Rate Limiting Implementation**
   - Rate limiting utility exists but may not be fully integrated with authentication

4. **Session Management**
   - Session timeout handling could be improved
   - Multi-device session management needs enhancement

5. **Error Handling Consistency**
   - Error handling approach varies across components
   - Some components may not handle all error scenarios

6. **Loading State Consistency**
   - Loading state handling varies across components
   - Some components may not show appropriate loading indicators

-Order Component for Auth**
   - Develop a `withAuth` HOC for easier wrapping of components
   - Update documentation with usage examples

### Phase 2: Enhance Token Management

1. **Implement Secure Token Storage**
   - Move from localStorage to more secure alternatives where appropriate
   - Implement encryption for sensitive token data

2. **Enhance Token Refresh Mechanism**
   - Implement automatic token refresh before expiration
   - Handle refresh token errors gracefully

3. **Add Token Revocation**
   - Implement functionality to revoke tokens on suspicious activity
   - Add ability to sign out from all devices

### Phase 3: Improve Error Handling and Loading States

1. **Standardize Error Handling**
   - Create consistent error handling patterns
   - Implement error boundary for authentication failures

2. **Enhance Loading State Management**
   - Create standardized loading indicators
   - Implement skeleton loaders for authentication-dependent UI

3. **Add Retry Mechanisms**
   - Implement automatic retry for transient authentication errors
   - Add exponential backoff for repeated failures

### Phase 4: Enhance Security Features

1. **Integrate Rate Limiting**
   - Fully integrate rate limiting with authentication attempts
   - Implement account lockout after multiple failed attempts

2. **Add Session Management**
   - Implement session timeout with warnings
   - Add ability to view and manage active sessions

3. **Implement 2FA Support**
   - Add two-factor authentication support
   - Integrate with existing authentication flow

### Phase 5: Testing and Documentation

1. **Expand Test Coverage**
   - Add tests for edge cases and error scenarios
   - Implement integration tests for authentication flow

2. **Update Documentation**
   - Update authentication documentation with new features
   - Create examples for common authentication scenarios

3. **Create Developer Guidelines**
   - Document best practices for authentication
   - Create templates for new authentication-dependent components

## Task Manager

### Phase 1: Fix AuthProvider Wrapping Issues

| Task ID | Description | Dependencies | Estimated Effort | Status |
|---------|-------------|--------------|------------------|--------|
| 1.1 | Audit all components using useAuth | None | Medium | Completed |
| 1.2 | Fix StoryboardAuthWrapper implementation | 1.1 | Low | Completed |
| 1.3 | Create withAuth HOC | 1.1 | Medium | Completed |
| 1.4 | Update documentation with HOC usage | 1.3 | Low | Completed |
| 1.5 | Test all fixed components | 1.2, 1.3 | Medium | Completed |

### Phase 2: Enhance Token Management

| Task ID | Description | Dependencies | Estimated Effort | Status |
|---------|-------------|--------------|------------------|--------|
| 2.1 | Implement secure token storage | None | Medium | Completed |
| 2.2 | Enhance token refresh mechanism | 2.1 | Medium | Completed |
| 2.3 | Add token revocation functionality | 2.1, 2.2 | Medium | Completed |
| 2.4 | Test token management features | 2.1, 2.2, 2.3 | Medium | Completed |

### Phase 3: Improve Error Handling and Loading States

| Task ID | Description | Dependencies | Estimated Effort | Status |
|---------|-------------|--------------|------------------|--------|
| 3.1 | Create standardized error handling | None | Medium | Not Started |
| 3.2 | Implement error boundary for auth | 3.1 | Low | Not Started |
| 3.3 | Create standardized loading indicators | None | Low | Not Started |
| 3.4 | Implement skeleton loaders | 3.3 | Medium | Not Started |
| 3.5 | Add retry mechanisms | 3.1 | Medium | Not Started |
| 3.6 | Test error handling and loading states | 3.1, 3.2, 3.3, 3.4, 3.5 | Medium | Not Started |

### Phase 4: Enhance Security Features

| Task ID | Description | Dependencies | Estimated Effort | Status |
|---------|-------------|--------------|------------------|--------|
| 4.1 | Integrate rate limiting with auth | None | Medium | Not Started |
|
| 4.3 | Add session timeout with warnings | None | Medium | Not Started |
| 4.4 | Create session management UI | 4.3 | High | Completed |
| 4.5 | Implement 2FA support | None | High | Not Started |
| 4.6 | Test security features | 4.1, 4.2, 4.3, 4.4, 4.5 | High | Not Started |

### Phase 5: Testing and Documentation

| Task ID | Description | Dependencies | Estimated Effort | Status |
|---------|-------------|--------------|------------------|--------|
| 5.1 | Expand test coverage | All previous phases | High | Not Started |
| 5.2 | Update authentication documentation | All previous phases | Medium | Not Started |
| 5.3 | Create developer guidelines | 5.2 | Medium | Not Started |
| 5.4 | Create templates for auth components | 5.3 | Low | Not Started |
| 5.5 | Final review and sign-off | All tasks | Low | Not Started |

## Implementation Progress

### Completed Tasks

#### Phase 1: Fix AuthProvider Wrapping Issues
- ✅ Task 1.1: Audit all components using useAuth
- ✅ Task 1.2: Fix StoryboardAuthWrapper implementation
  - Enhanced with mock auth support
  - Added visual indicators for auth wrapper state
  - Added support for mock user data and loading states
- ✅ Task 1.3: Create withAuth HOC
- ✅ Task 1.4: Update documentation with HOC usage
- ✅ Task 1.5: Test all fixed components
  - Created three new storyboards to demonstrate different aspects of authentication
  - Verified all storyboards are properly wrapped with StoryboardAuthWrapper

#### Phase 2: Enhance Token Management
- ✅ Task 2.1: Implement secure token storage
  - Implemented AES-GCM encryption for tokens
  - Added device fingerprinting for key derivation
  - Implemented PBKDF2 key derivation for stronger security
  - Added token integrity verification with SHA-256
- ✅ Task 2.2: Enhance token refresh mechanism
  - Implemented automatic token refresh before expiration
  - Added handling for refresh token errors with retry logic
  - Implemented refresh token rotation for enhanced security
  - Added exponential backoff with jitter for retry attempts
  - Implemented dynamic refresh buffer based on token lifetime
  - Added refresh metrics tracking for monitoring and debugging
  - Created TokenRefreshMechanismStoryboard for testing
  - Enhanced AuthProvider with improved session monitoring
  - Added visibility change detection to refresh tokens when tab becomes active
  - Added network reconnection detection to refresh tokens when device comes online
  - Implemented adaptive check frequency based on token expiration time
  - Added consecutive failures tracking for better retry handling
  - Implemented network status detection for offline/online handling
  - Created comprehensive demo UI for token refresh visualization
- ✅ Task 2.3: Add token revocation functionality
  - Implemented ability to sign out from all devices
  - Added session management UI for viewing and terminating sessions
  - Added ability to revoke specific tokens
  - Created SessionRevocationStoryboard for testing token revocation

#### Phase 3: Improve Error Handling and Loading States
- ✅ Task 3.2: Implement error boundary for auth
  - ✅ Created AuthErrorBoundary component
  - ✅ Integrated with standardized error handling
  - ✅ Added retry functionality
  - ✅ Updated EnhancedLoginForm to use new error handling
  - ✅ Verified proper implementation in authentication flow
- ✅ Task 3.3: Create standardized loading indicators
  - ✅ Created AuthLoading component with multiple variants (spinner, dots, pulse)
  - ✅ Added size options (xs, sm, md, lg)
  - ✅ Added variant options (default, primary, secondary, ghost)
  - ✅ Added full page overlay option
  - ✅ Added text option for loading indicators
  - ✅ Created ButtonLoading component for use in buttons
  - ✅ Integrated loading indicators into authentication flow
  - ✅ Created LoadingIndicatorsStoryboard to showcase all loading options
  - ✅ Verified proper implementation in authentication flow
- ✅ Task 3.4: Implement skeleton loaders
  - ✅ Created AuthSkeleton component with various configurations
  - ✅ Added options for avatar, card, form, and multiple items
  - ✅ Integrated skeleton loaders into authentication flow
  - ✅ Created AuthLoadingStatesStoryboard to showcase skeleton loaders in auth context
  - ✅ Verified proper implementation in authentication flow

#### Phase 4: Enhance Security Features (Partial)
- Task 4.4: Create session management UI
  - Implemented session management component
  - Added ability to view and manage active sessions
  - Added ability to sign out from specific devices or all devices

### Next Steps

#### Phase 4: Enhance Security Features
- ✅ Task 4.1: Integrate rate limiting with auth
  - ✅ Enhanced EnhancedLoginForm with rate limiting checks
  - ✅ Updated AuthProvider's signIn method to handle rate limiting
  - ✅ Created RateLimitAlert component for user feedback
  - ✅ Created RateLimitDemoStoryboard for testing and demonstration
  - ✅ Integrated rate limiting with authentication flow
  - ✅ Added user feedback for rate limited accounts
  - ✅ Implemented automatic reset of rate limiting on successful login
  - ✅ Added countdown timer for rate limited accounts
  - ✅ Implemented progressive rate limiting with increasing lockout periods
  - ✅ Added security considerations documentation

- 🔄 Task 4.2: Implement account lockout
  - 🔄 Extend rate limiting to implement full account lockout
  - 🔄 Add admin interface for managing locked accounts
  - 🔄 Implement notification system for locked accounts

- 🔄 Task 4.3: Add session timeout with warnings
  - 🔄 Implement session timeout detection
  - 🔄 Add warning notifications before session expires
  - 🔄 Create session extension mechanism

#### Phase 3: Improve Error Handling and Loading States
- ✅ Task 3.1: Create standardized error handling
  - ✅ Created errorHandler.ts with comprehensive error handling system
  - ✅ Enhanced formatAuthError function with more error types
  - ✅ Created standardized error object structure
  - ✅ Implemented error categorization and severity levels
  - ✅ Added user-friendly error messages and suggested actions
  - ✅ Created AuthError component for displaying errors
- ✅ Task 3.2: Implement error boundary for auth
  - ✅ Created AuthErrorBoundary component
  - ✅ Integrated with standardized error handling
  - ✅ Added retry functionality
  - ✅ Updated EnhancedLoginForm to use new error handling
  - ✅ Verified proper implementation in authentication flow
- ✅ Task 3.3: Create standardized loading indicators
  - ✅ Created AuthLoading component with multiple variants (spinner, dots, pulse)
  - ✅ Added size options (xs, sm, md, lg)
  - ✅ Added variant options (default, primary, secondary, ghost)
  - ✅ Added full page overlay option
  - ✅ Added text option for loading indicators
  - ✅ Created ButtonLoading component for use in buttons
  - ✅ Integrated loading indicators into authentication flow
  - ✅ Created LoadingIndicatorsStoryboard to showcase all loading options
  - ✅ Verified proper implementation in authentication flow
- ✅ Task 3.4: Implement skeleton loaders
  - ✅ Created AuthSkeleton component with various configurations
  - ✅ Added options for avatar, card, form, and multiple items
  - ✅ Integrated skeleton loaders into authentication flow
  - ✅ Created AuthLoadingStatesStoryboard to showcase skeleton loaders in auth context
  - ✅ Verified proper implementation in authentication flow
- ✅ Task 3.5: Add retry mechanisms
  - ✅ Enhanced withRetry function with improved error handling
  - ✅ Created specialized withAuthRetry function for authentication operations
  - ✅ Implemented rate limiting protection with cooldown periods
  - ✅ Added failure tracking system for consecutive failures
  - ✅ Created AuthRetryIndicator component for UI feedback
  - ✅ Integrated retry mechanisms with authentication operations
  - ✅ Created ErrorHandlingDemoStoryboard for testing and demonstration
- 🔄 Task 3.6: Test error handling and loading states
  - ✅ Created ErrorHandlingDemoStoryboard for testing error handling components
  - ✅ Created LoadingIndicatorsStoryboard for testing loading indicators
  - ✅ Created AuthLoadingStatesStoryboard for testing skeleton loaders
  - ✅ Integrate AuthError component with EnhancedLoginForm
  - ✅ Integrate AuthRetryIndicator with authentication flows
  - ✅ Created AuthRetryDemoStoryboard for testing retry mechanisms
  - 🔄 Test error handling in real authentication scenarios
  - 🔄 Create comprehensive test cases for different error types
  - 🔄 Verify proper error categorization and handling
  - 🔄 Test retry mechanisms with simulated network failures

#### Phase 4: Enhance Security Features (Remaining)
- Task 4.1: Integrate rate limiting with auth
- Task 4.2: Implement account lockout
- Task 4.3: Add session timeout with warnings
- Task 4.5: Implement 2FA support
- Task 4.6: Test security features

### Next: Continue Phase 5: Testing and Documentation
- Task 5.1: Expand test coverage
- Task 5.2: Update authentication documentation
- Task 5.3: Create developer guidelines