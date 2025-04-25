import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  ServerOff,
  WifiOff,
  UserX,
} from "lucide-react";
import AuthError from "@/components/ui/auth-error";
import {
  createStandardError,
  ErrorCategory,
  ErrorSeverity,
} from "@/lib/errorHandler";
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary";

export default function ErrorHandlingDemoStoryboard() {
  const [activeError, setActiveError] = React.useState<{
    category: ErrorCategory;
    severity: ErrorSeverity;
  }>({ category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.ERROR });

  const [showError, setShowError] = React.useState(true);

  const generateError = () => {
    return createStandardError(
      {
        message: `Sample ${activeError.category} error with ${activeError.severity} severity`,
      },
      activeError.category,
      activeError.severity,
    );
  };

  const handleRetry = () => {
    setShowError(false);
    setTimeout(() => setShowError(true), 500);
  };

  const triggerErrorBoundary = () => {
    throw new Error("This error is caught by the AuthErrorBoundary");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Error Handling Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            This storyboard demonstrates the standardized error handling
            components for authentication and other errors.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Error Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ErrorCategory).map((category) => (
                    <Button
                      key={category}
                      variant={
                        activeError.category === category
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setActiveError({ ...activeError, category })
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Error Severity</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ErrorSeverity).map((severity) => (
                    <Button
                      key={severity}
                      variant={
                        activeError.severity === severity
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setActiveError({ ...activeError, severity })
                      }
                    >
                      {severity}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleRetry} className="w-full">
                  Regenerate Error
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {showError && (
                <AuthError
                  error={generateError()}
                  onRetry={handleRetry}
                  showIcon={true}
                  showSuggestion={true}
                />
              )}

              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Compact Mode</h3>
                <AuthError
                  error={generateError()}
                  onRetry={handleRetry}
                  compact={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Error Boundary Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-600">
              The AuthErrorBoundary component catches errors in its children and
              displays a user-friendly error message.
            </p>

            <AuthErrorBoundary
              resetOnChange={activeError}
              onError={(error) =>
                console.log("Error caught by boundary:", error)
              }
            >
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Protected Content</h3>
                <p className="text-slate-600 mb-4">
                  This content is wrapped in an AuthErrorBoundary. If an error
                  occurs, it will be caught and displayed.
                </p>
                <Button variant="destructive" onClick={triggerErrorBoundary}>
                  Trigger Error
                </Button>
              </div>
            </AuthErrorBoundary>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Icons Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <UserX className="h-5 w-5 text-rose-500" />
              <span>Authentication</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Authorization</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <span>Validation</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <WifiOff className="h-5 w-5 text-slate-500" />
              <span>Network</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <ServerOff className="h-5 w-5 text-rose-500" />
              <span>Server</span>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Critical</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
