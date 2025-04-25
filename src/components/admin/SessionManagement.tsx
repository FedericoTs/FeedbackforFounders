import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, LogOut, RefreshCw, Shield } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimeDuration } from "@/lib/tokenManager";
import PermissionGate from "../auth/PermissionGate";

export default function SessionManagement() {
  const {
    user,
    sessionInfo,
    refreshSession,
    getSessionTimeRemaining,
    signOutAllDevices,
    revokeSession,
    getAllSessions,
  } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sessions on component mount
  useEffect(() => {
    fetchSessions();
    // Set up interval to update session time remaining
    const interval = setInterval(() => {
      // This will trigger a re-render to update the time remaining
      setSessions((prevSessions) => [...prevSessions]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const allSessions = await getAllSessions();
      setSessions(allSessions || []);
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      setError("Failed to fetch sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const success = await refreshSession();
      if (success) {
        await fetchSessions();
      } else {
        setError("Failed to refresh session. Please try again.");
      }
    } catch (err: any) {
      console.error("Error refreshing session:", err);
      setError("Failed to refresh session. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await revokeSession(sessionId);
      if (success) {
        await fetchSessions();
      } else {
        setError("Failed to revoke session. Please try again.");
      }
    } catch (err: any) {
      console.error("Error revoking session:", err);
      setError("Failed to revoke session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await signOutAllDevices();
      if (error) {
        throw error;
      }
      // After signing out from all devices, the current session will also be invalidated
      // The auth state change will redirect the user to the login page
    } catch (err: any) {
      console.error("Error signing out all devices:", err);
      setError("Failed to sign out all devices. Please try again.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-600">
          Please sign in to manage your sessions.
        </p>
      </div>
    );
  }

  return (
    <PermissionGate
      permission="manage_sessions"
      fallback={
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Current Session</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="h-6 w-6 text-teal-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Status</p>
                      <div className="flex items-center mt-1">
                        {sessionInfo.valid ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Time Remaining</p>
                      <p className="text-sm mt-1">
                        {formatTimeDuration(sessionInfo.timeRemaining)}
                      </p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshSession}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Session
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-slate-600 mb-4">
              You don't have permission to view all sessions.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner className="h-6 w-6 text-teal-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Status</p>
                    <div className="flex items-center mt-1">
                      {sessionInfo.valid ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Time Remaining</p>
                    <p className="text-sm mt-1">
                      {formatTimeDuration(sessionInfo.timeRemaining)}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshSession}
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Session
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">All Active Sessions</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOutAllDevices}
              disabled={loading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out All Devices
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner className="h-6 w-6 text-teal-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-600">No active sessions found.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device / Browser</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const isCurrentSession =
                        session.id === sessionInfo.currentSessionId;
                      const expiresAt = new Date(session.expires_at);
                      const createdAt = new Date(session.created_at);
                      const timeRemaining = expiresAt.getTime() - Date.now();
                      const isValid = timeRemaining > 0;

                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-2 text-slate-400" />
                              <span>
                                {session.user_agent || "Unknown Device"}
                                {isCurrentSession && (
                                  <Badge className="ml-2 bg-teal-100 text-teal-800 hover:bg-teal-100">
                                    Current
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {createdAt.toLocaleDateString()}{" "}
                            {createdAt.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {expiresAt.toLocaleDateString()}{" "}
                            {expiresAt.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {isValid ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                Expired
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={loading || !isValid}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
