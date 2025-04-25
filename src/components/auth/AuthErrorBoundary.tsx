import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  createStandardError,
  ErrorCategory,
  ErrorSeverity,
  logError,
} from "@/lib/errorHandler";
import AuthError from "../ui/auth-error";

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnChange?: any;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically designed for authentication components
 * Catches errors in authentication components and displays a user-friendly error message
 */
export class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logError(
      createStandardError(
        error,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.ERROR,
      ),
    );

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: AuthErrorBoundaryProps): void {
    // Reset the error state if resetOnChange prop changes
    if (
      this.state.hasError &&
      this.props.resetOnChange !== prevProps.resetOnChange
    ) {
      this.setState({
        hasError: false,
        error: null,
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, use the default error UI
      const standardError = createStandardError(
        this.state.error,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.ERROR,
      );

      return (
        <div className="p-4">
          <AuthError
            error={standardError}
            onRetry={() => {
              this.setState({ hasError: false, error: null });
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
