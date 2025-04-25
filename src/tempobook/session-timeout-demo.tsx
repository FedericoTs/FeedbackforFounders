import React, { useState } from "react";
import { useAuth } from "@/supabase/auth";
import { useSessionTimeout } from "@/components/auth/SessionTimeoutProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, RefreshCw, Settings, Shield } from "lucide-react";
import { formatTimeDuration } from "@/lib/tokenManager";

const SessionTimeoutDemo = () => {
  const { user, sessionInfo } = useAuth();
  const {
    idleTime,
    resetIdleTimer,
    extendSession,
    timeRemaining,
    warningThreshold,
    idleTimeout,
    absoluteTimeout,
    configureTimeout,
  } = useSessionTimeout();

  const [isExtending, setIsExtending] = useState(false);
  const [newWarningThreshold, setNewWarningThreshold] =
    useState(warningThreshold);
  const [newIdleTimeout, setNewIdleTimeout] = useState(idleTimeout);
  const [newAbsoluteTimeout, setNewAbsoluteTimeout] = useState(absoluteTimeout);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await extendSession();
    } finally {
      setIsExtending(false);
    }
  };

  const handleApplySettings = () => {
    configureTimeout({
      warningThreshold: newWarningThreshold,
      idleTimeout: newIdleTimeout,
      absoluteTimeout: newAbsoluteTimeout,
    });
  };

  const formatTime = (seconds: number) => {
    return formatTimeDuration(seconds * 1000);
  };

  const getIdleProgressValue = () => {
    return Math.max(0, Math.min(100, 100 - (idleTime / idleTimeout) * 100));
  };

  const getSessionProgressValue = () => {
    return Math.max(0, Math.min(100, (timeRemaining / absoluteTimeout) * 100));
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-white">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <Shield className="h-8 w-8 mr-2 text-teal-500" />
        Session Timeout Demo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Session Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Session Valid</span>
                            <span
                              className={
                                sessionInfo.valid
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {sessionInfo.valid ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Session Expires</span>
                            <span>
                              {sessionInfo.expiresAt
                                ? new Date(
                                    sessionInfo.expiresAt,
                                  ).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Time Remaining</span>
                            <span>{formatTime(timeRemaining)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Idle Time</span>
                            <span>{formatTime(idleTime)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Timeout Settings
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Warning Threshold</span>
                            <span>{formatTime(warningThreshold)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Idle Timeout</span>
                            <span>{formatTime(idleTimeout)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Absolute Timeout</span>
                            <span>{formatTime(absoluteTimeout)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Progress</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Session Time Remaining</span>
                            <span>
                              {formatTime(timeRemaining)} /{" "}
                              {formatTime(absoluteTimeout)}
                            </span>
                          </div>
                          <Progress
                            value={getSessionProgressValue()}
                            className="h-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Idle Time</span>
                            <span>
                              {formatTime(idleTime)} / {formatTime(idleTimeout)}
                            </span>
                          </div>
                          <Progress
                            value={getIdleProgressValue()}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={handleExtendSession}
                        disabled={isExtending}
                        className="w-full md:w-auto"
                      >
                        {isExtending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Extending Session...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Extend Session
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Session Timeout Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="warningThreshold">
                          Warning Threshold (seconds)
                        </Label>
                        <Input
                          id="warningThreshold"
                          type="number"
                          value={newWarningThreshold}
                          onChange={(e) =>
                            setNewWarningThreshold(Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-slate-500">
                          Time before session/idle timeout when warning will
                          appear
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="idleTimeout">
                          Idle Timeout (seconds)
                        </Label>
                        <Input
                          id="idleTimeout"
                          type="number"
                          value={newIdleTimeout}
                          onChange={(e) =>
                            setNewIdleTimeout(Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-slate-500">
                          Time of inactivity before session expires
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="absoluteTimeout">
                          Absolute Timeout (seconds)
                        </Label>
                        <Input
                          id="absoluteTimeout"
                          type="number"
                          value={newAbsoluteTimeout}
                          onChange={(e) =>
                            setNewAbsoluteTimeout(Number(e.target.value))
                          }
                        />
                        <p className="text-xs text-slate-500">
                          Maximum session duration regardless of activity
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleApplySettings} className="w-full">
                      Apply Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing">
              <Card>
                <CardHeader>
                  <CardTitle>Test Session Timeout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">
                        Testing Instructions
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Use these options to test the session timeout
                        functionality:
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                        <li>
                          <strong>Simulate Inactivity:</strong> This will
                          prevent the idle timer from resetting, simulating user
                          inactivity.
                        </li>
                        <li>
                          <strong>Force Warning:</strong> This will immediately
                          show the session timeout warning.
                        </li>
                        <li>
                          <strong>Reset Idle Timer:</strong> This will manually
                          reset the idle timer, simulating user activity.
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Set warning threshold to 5 seconds for testing
                          configureTimeout({ warningThreshold: 5 });
                        }}
                      >
                        Set 5s Warning
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Set idle timeout to 30 seconds for testing
                          configureTimeout({ idleTimeout: 30 });
                        }}
                      >
                        Set 30s Idle Timeout
                      </Button>
                      <Button variant="outline" onClick={resetIdleTimer}>
                        Reset Idle Timer
                      </Button>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-amber-600 mr-2" />
                        <h3 className="text-lg font-medium text-amber-800">
                          Current Session Status
                        </h3>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700">Idle Time:</span>
                          <span className="font-medium text-amber-900">
                            {formatTime(idleTime)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700">
                            Session Time Remaining:
                          </span>
                          <span className="font-medium text-amber-900">
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700">
                            Warning Will Show In:
                          </span>
                          <span className="font-medium text-amber-900">
                            {formatTime(
                              Math.max(
                                0,
                                idleTimeout - warningThreshold - idleTime,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>User ID</span>
                        <span className="font-mono text-xs">
                          {user.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Email</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Sign In</span>
                        <span>
                          {new Date(
                            user.last_sign_in_at || "",
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleExtendSession}
                        disabled={isExtending}
                        className="w-full"
                      >
                        {isExtending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Extending...
                          </>
                        ) : (
                          <>Extend Session</>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-500">Not signed in</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  The session timeout system monitors both user activity and
                  session expiration:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Idle Timeout:</strong> If no activity is detected
                    for the configured idle timeout period, a warning will
                    appear.
                  </li>
                  <li>
                    <strong>Session Expiration:</strong> Sessions have an
                    absolute maximum duration, after which they expire
                    regardless of activity.
                  </li>
                  <li>
                    <strong>Warning Threshold:</strong> A warning appears when
                    either the idle timeout or session expiration is
                    approaching.
                  </li>
                  <li>
                    <strong>Session Extension:</strong> Users can extend their
                    session before it expires, resetting both timers.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutDemo;
