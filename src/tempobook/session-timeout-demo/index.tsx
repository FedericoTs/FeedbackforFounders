import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import SessionTimeoutWarning from "@/components/ui/session-timeout-warning";
import { formatTimeDuration } from "@/lib/authUtils";

export default function SessionTimeoutDemo() {
  // Demo state
  const [timeRemaining, setTimeRemaining] = useState(5 * 60 * 1000); // 5 minutes
  const [warningThreshold, setWarningThreshold] = useState(5 * 60 * 1000); // 5 minutes
  const [showWarning, setShowWarning] = useState(false);
  const [autoExtend, setAutoExtend] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!showWarning || sessionExpired) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          setSessionExpired(true);
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, sessionExpired]);

  // Handle session extension
  const handleExtendSession = async () => {
    setIsExtending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTimeRemaining(30 * 60 * 1000); // Reset to 30 minutes
    setShowWarning(false);
    setSessionExpired(false);
    setIsExtending(false);
    return true;
  };

  // Handle session expiration
  const handleSessionExpired = () => {
    setSessionExpired(true);
    setShowWarning(false);
    alert(
      "Your session has expired. You will be redirected to the login page.",
    );
  };

  // Reset demo
  const handleReset = () => {
    setTimeRemaining(5 * 60 * 1000);
    setShowWarning(false);
    setSessionExpired(false);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Session Timeout Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="demo">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
              <TabsTrigger value="manual">Manual Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Session Status</h3>
                    <div
                      className={`px-2 py-1 text-xs rounded-full ${sessionExpired ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                    >
                      {sessionExpired ? "Expired" : "Active"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Time Remaining:</span>
                      <span className="font-medium">
                        {formatTimeDuration(timeRemaining)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Warning Threshold:</span>
                      <span className="font-medium">
                        {formatTimeDuration(warningThreshold)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Warning Status:</span>
                      <span className="font-medium">
                        {showWarning ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowWarning(true)}
                    disabled={showWarning || sessionExpired}
                  >
                    Show Warning
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isExtending}
                  >
                    Reset Demo
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-extend"
                    checked={autoExtend}
                    onCheckedChange={setAutoExtend}
                  />
                  <Label htmlFor="auto-extend">Auto-extend session</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Time Remaining: {formatTimeDuration(timeRemaining)}
                  </Label>
                  <Slider
                    value={[timeRemaining / 1000]}
                    min={0}
                    max={30 * 60}
                    step={10}
                    onValueChange={(value) => {
                      setTimeRemaining(value[0] * 1000);
                      setSessionExpired(value[0] === 0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Warning Threshold: {formatTimeDuration(warningThreshold)}
                  </Label>
                  <Slider
                    value={[warningThreshold / 1000]}
                    min={10}
                    max={10 * 60}
                    step={10}
                    onValueChange={(value) => {
                      setWarningThreshold(value[0] * 1000);
                    }}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowWarning(!showWarning)}
                    variant={showWarning ? "destructive" : "default"}
                  >
                    {showWarning ? "Hide Warning" : "Show Warning"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isExtending}
                  >
                    Reset Demo
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-extend-manual"
                    checked={autoExtend}
                    onCheckedChange={setAutoExtend}
                  />
                  <Label htmlFor="auto-extend-manual">
                    Auto-extend session
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Session Timeout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">
            Session timeout is a security feature that automatically logs users
            out after a period of inactivity. This helps protect user accounts
            from unauthorized access when they leave their device unattended.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-medium mb-2">Warning Threshold</h3>
              <p className="text-sm text-slate-600">
                The warning threshold determines how long before session
                expiration the warning notification appears. This gives users
                time to extend their session before being logged out.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-medium mb-2">Auto-Extension</h3>
              <p className="text-sm text-slate-600">
                With auto-extension enabled, the system will automatically
                attempt to extend the session when it's about to expire, as long
                as the user shows activity on the page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showWarning && (
        <SessionTimeoutWarning
          timeRemaining={timeRemaining}
          warningThreshold={warningThreshold}
          onExtendSession={handleExtendSession}
          onSessionExpired={handleSessionExpired}
          autoExtend={autoExtend}
        />
      )}
    </div>
  );
}
