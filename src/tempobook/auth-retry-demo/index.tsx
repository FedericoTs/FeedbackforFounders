import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import AuthRetryIndicator from "@/components/ui/auth-retry-indicator";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import StoryboardAuthWrapper from "@/components/auth/StoryboardAuthWrapper";

export default function AuthRetryDemo() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [maxRetries] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const simulateRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setIsRetrying(true);
    setRetryAttempt(0);
    setErrorMessage("");

    // Simulate first attempt failing
    setTimeout(() => {
      setHasError(true);
      setErrorMessage(
        "Network error: Unable to connect to authentication server",
      );
      setRetryAttempt(1);

      toast({
        title: "Connection failed",
        description: "Retrying connection automatically...",
        variant: "destructive",
      });

      // Simulate first retry
      setTimeout(() => {
        setErrorMessage("Timeout error: Server took too long to respond");
        setRetryAttempt(2);

        toast({
          title: "Retry failed",
          description: "Attempting again with exponential backoff...",
          variant: "destructive",
        });

        // Simulate second retry
        setTimeout(() => {
          setErrorMessage("Server error: Internal server error (500)");
          setRetryAttempt(3);

          toast({
            title: "Final retry failed",
            description:
              "All automatic retries exhausted. You can try manually.",
            variant: "destructive",
          });

          setIsLoading(false);
        }, 3000);
      }, 2000);
    }, 1500);
  };

  const simulateSuccess = () => {
    setIsLoading(true);
    setHasError(false);
    setIsRetrying(true);
    setRetryAttempt(0);
    setErrorMessage("");

    // Simulate first attempt failing
    setTimeout(() => {
      setHasError(true);
      setErrorMessage(
        "Network error: Unable to connect to authentication server",
      );
      setRetryAttempt(1);

      toast({
        title: "Connection failed",
        description: "Retrying connection automatically...",
        variant: "destructive",
      });

      // Simulate successful retry
      setTimeout(() => {
        setHasError(false);
        setIsRetrying(false);
        setErrorMessage("");
        setIsLoading(false);

        toast({
          title: "Connection successful",
          description: "Retry was successful! Authentication completed.",
          variant: "default",
        });
      }, 2000);
    }, 1500);
  };

  const handleReset = () => {
    setIsLoading(false);
    setHasError(false);
    setIsRetrying(false);
    setRetryAttempt(0);
    setErrorMessage("");
  };

  const handleManualRetry = () => {
    simulateSuccess();
  };

  return (
    <StoryboardAuthWrapper>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Auth Retry Mechanism Demo</h1>
            <p className="text-slate-600">
              Demonstrates automatic retry with exponential backoff for auth
              operations
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex space-x-2">
                  <Button
                    onClick={simulateRetry}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Simulate Failed Retries
                  </Button>
                  <Button
                    onClick={simulateSuccess}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    Simulate Successful Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retry Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : isLoading ? (
                <Alert>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <AlertTitle>Processing</AlertTitle>
                  <AlertDescription>
                    Attempting to authenticate...
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200 text-green-800"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Ready</AlertTitle>
                  <AlertDescription>
                    System is ready to simulate authentication retries.
                  </AlertDescription>
                </Alert>
              )}

              {isRetrying && (
                <div className="mt-4">
                  <AuthRetryIndicator
                    attempt={retryAttempt}
                    maxAttempts={maxRetries}
                    message={`Retry attempt ${retryAttempt} of ${maxRetries}`}
                    onManualRetry={handleManualRetry}
                  />
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm font-medium mb-1">Retry Progress</div>
                <Progress
                  value={isRetrying ? (retryAttempt / maxRetries) * 100 : 0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Auth Retry Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-4">
              <p>
                The authentication retry mechanism automatically attempts to
                recover from transient errors during authentication operations.
                It uses an exponential backoff strategy to avoid overwhelming
                the server with retry attempts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Automatic Retries</h3>
                  <p className="text-slate-600">
                    Network and server errors are automatically retried without
                    user intervention. Authentication credential errors are not
                    retried.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Exponential Backoff</h3>
                  <p className="text-slate-600">
                    Each retry attempt waits longer before trying again,
                    reducing server load and increasing chances of success after
                    transient issues.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Manual Fallback</h3>
                  <p className="text-slate-600">
                    If all automatic retries fail, users can manually trigger
                    another attempt or contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StoryboardAuthWrapper>
  );
}
