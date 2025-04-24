# Using the withAuth Higher-Order Component

## Overview

The `withAuth` Higher-Order Component (HOC) provides a simple way to wrap components with the `AuthProvider` context. This ensures that components using the `useAuth` hook have access to the authentication context they need, even when rendered outside the main application flow.

## Basic Usage

```tsx
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

// Component that uses useAuth
function MyAuthComponent() {
  const { user } = useAuth();
  
  return (
    <div>
      {user ? `Hello, ${user.email}` : "Please sign in"}
    </div>
  );
}

// Export the component wrapped with AuthProvider
export default withAuth(MyAuthComponent);
```

## Usage with Props

The HOC preserves all props passed to the wrapped component:

```tsx
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

interface MyComponentProps {
  title: string;
  showDetails?: boolean;
}

// Component that uses useAuth and accepts props
function MyAuthComponent({ title, showDetails = false }: MyComponentProps) {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>{title}</h1>
      {user ? (
        <div>
          <p>Hello, {user.email}</p>
          {showDetails && <p>User ID: {user.id}</p>}
        </div>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}

// Export the component wrapped with AuthProvider
export default withAuth(MyAuthComponent);
```

## Usage in Storyboards

For storyboard components, you can use either the `StoryboardAuthWrapper` component or the `withAuth` HOC:

```tsx
// Using StoryboardAuthWrapper
import StoryboardAuthWrapper from "@/components/auth/StoryboardAuthWrapper";

function MyStoryboard() {
  return (
    <StoryboardAuthWrapper>
      <MyAuthComponent title="Auth Demo" />
    </StoryboardAuthWrapper>
  );
}

// Or using withAuth HOC
import { withAuth } from "@/lib/withAuth";

function MyStoryboard() {
  // Component code that uses useAuth
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Auth Demo</h1>
      {user ? `Hello, ${user.email}` : "Please sign in"}
    </div>
  );
}

export default withAuth(MyStoryboard);
```

## Advanced Usage

### With TypeScript Generics

The `withAuth` HOC is designed to work with TypeScript generics, preserving the prop types of the wrapped component:

```tsx
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

interface DashboardProps {
  projectId: string;
  showAnalytics?: boolean;
  onProjectSelect?: (id: string) => void;
}

function ProjectDashboard({ projectId, showAnalytics = false, onProjectSelect }: DashboardProps) {
  const { user, hasPermission } = useAuth();
  
  // Check if user has permission to view this project
  const canViewProject = hasPermission("view_projects");
  
  if (!canViewProject) {
    return <div>You don't have permission to view this project</div>;
  }
  
  return (
    <div>
      <h1>Project Dashboard</h1>
      <p>Project ID: {projectId}</p>
      {showAnalytics && <ProjectAnalytics projectId={projectId} />}
      <button onClick={() => onProjectSelect && onProjectSelect(projectId)}>
        Select Project
      </button>
    </div>
  );
}

// The wrapped component preserves the original prop types
const AuthenticatedProjectDashboard = withAuth(ProjectDashboard);

// Usage:
// <AuthenticatedProjectDashboard projectId="123" showAnalytics={true} onProjectSelect={handleSelect} />
```

### With React.memo

You can combine `withAuth` with `React.memo` for performance optimization:

```tsx
import React from "react";
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

function ExpensiveAuthComponent({ data }) {
  const { user } = useAuth();
  
  // Expensive rendering logic here
  
  return (
    <div>
      {user ? `Hello, ${user.email}` : "Please sign in"}
      {/* Render data */}
    </div>
  );
}

// First apply memo, then withAuth
const MemoizedAuthComponent = withAuth(React.memo(ExpensiveAuthComponent));

// Or apply withAuth first, then memo
// const MemoizedAuthComponent = React.memo(withAuth(ExpensiveAuthComponent));
```

## Usage with Hooks

You can use `withAuth` with components that use other hooks alongside `useAuth`:

```tsx
import { useState, useEffect } from "react";
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

function UserProfileEditor() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || "");
      setBio(user.user_metadata?.bio || "");
    }
  }, [user]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ fullName: name, bio });
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) {
    return <div>Please sign in to edit your profile</div>;
  }
  
  return (
    <div>
      <h1>Edit Profile</h1>
      <div>
        <label>Name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Bio:</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

export default withAuth(UserProfileEditor);
```

## Best Practices

1. **Use in Isolated Components**: Always use `withAuth` for components that are rendered outside the main application flow and use the `useAuth` hook.

2. **Storyboard Components**: For storyboard components, prefer using `StoryboardAuthWrapper` as it's specifically designed for that purpose.

3. **Testing**: When testing components that use `useAuth`, either:
   - Wrap the component with `AuthProvider` in your tests
   - Mock the `useAuth` hook
   - Use the `withAuth` HOC

4. **Performance Consideration**: Avoid unnecessary nesting of `AuthProvider`. If a component is already wrapped with `AuthProvider` higher in the component tree, you don't need to wrap it again.

5. **Component Organization**: Consider organizing your components into:
   - Pure components that don't use `useAuth`
   - Auth-dependent components that use `useAuth` and are wrapped with `withAuth`
   - Container components that compose these together

6. **Naming Convention**: Consider using a naming convention for wrapped components, such as prefixing with `Auth` or suffixing with `WithAuth` to make it clear they are wrapped with authentication context.

## Troubleshooting

If you encounter the error "useAuth must be used within an AuthProvider", it means the component is using the `useAuth` hook but is not properly wrapped with `AuthProvider`. To fix this:

1. Check if the component is rendered within the main application flow (which is wrapped with `AuthProvider` in `App.tsx`)
2. If not, wrap the component with `withAuth` HOC or use `StoryboardAuthWrapper`

### Common Issues and Solutions

#### Issue: Multiple AuthProvider Instances

```tsx
// Incorrect: Creates nested AuthProvider instances
const WrappedComponent1 = withAuth(MyComponent);
const WrappedComponent2 = withAuth(WrappedComponent1); // Avoid this!

// Correct: Only wrap once
const WrappedComponent = withAuth(MyComponent);
```

#### Issue: Using useAuth in a Component Prop

```tsx
// Incorrect: The inline function using useAuth is not wrapped
function ParentComponent() {
  return (
    <ChildComponent
      getData={() => {
        const { user } = useAuth(); // This will cause an error
        return user?.id;
      }}
    />
  );
}

// Correct: Move the function to a wrapped component
function DataProvider({ children }) {
  const { user } = useAuth();
  const getData = () => user?.id;
  
  return children(getData);
}

const WrappedDataProvider = withAuth(DataProvider);

function ParentComponent() {
  return (
    <WrappedDataProvider>
      {(getData) => <ChildComponent getData={getData} />}
    </WrappedDataProvider>
  );
}
```

#### Issue: Conditional useAuth Usage

```tsx
// Incorrect: Hooks cannot be used conditionally
function MyComponent({ requireAuth }) {
  let user;
  if (requireAuth) {
    const { user: authUser } = useAuth(); // This will cause an error
    user = authUser;
  }
  
  return <div>{user ? `Hello, ${user.email}` : "Guest"}</div>;
}

// Correct: Always call the hook, but conditionally use its result
function MyComponent({ requireAuth }) {
  const { user } = useAuth(); // Always call the hook
  
  const displayUser = requireAuth ? user : null;
  
  return <div>{displayUser ? `Hello, ${displayUser.email}` : "Guest"}</div>;
}

export default withAuth(MyComponent);
```

## Example: Complete Authentication Flow

Here's an example of a complete authentication flow using `withAuth`:

```tsx
import { useState } from "react";
import { withAuth } from "@/lib/withAuth";
import { useAuth } from "@/supabase/auth";

function AuthenticationFlow() {
  const { user, signIn, signUp, signOut, authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (user) {
    return (
      <div>
        <h1>Welcome, {user.email}!</h1>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>{isSignUp ? "Create Account" : "Sign In"}</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        {authError && <div className="error">{authError}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>
      
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
      </button>
    </div>
  );
}

export default withAuth(AuthenticationFlow);
```

## Conclusion

The `withAuth` HOC is a powerful pattern for ensuring components have access to the authentication context they need. By following the best practices outlined in this document, you can create a more maintainable and robust authentication system in your application.
