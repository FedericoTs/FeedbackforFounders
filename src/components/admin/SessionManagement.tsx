import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabase";
import { useAuth } from "@/supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Session {
  id: string;
  user_id: string;
  created_at: string;
  last_active_at: string;
  user_agent?: string;
  ip_address?: string;
  current: boolean;
}

export default function SessionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  // Fetch user sessions
  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // In a real implementation, this would call a backend API to get all sessions
      // For now, we'll simulate it with a mock response
      const { data: sessionData, error } = await supabase.auth.getSession();

      if (error) throw error;

      // Create a mock list of sessions including the current one
      const currentSession = sessionData.session;

      if (!currentSession) {
        setSessions([]);
        return;
      }

      // Create a list with the current session and some mock additional sessions
      const mockSessions: Session[] = [
        {
          id: currentSession.id,
          user_id: user.id,
          created_at: new Date(currentSession.created_at).toISOString(),
          last_active_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: "127.0.0.1", // Mock IP address
          current: true,
        },
        {
          id: "mock-session-1",
          user_id: user.id,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          last_active_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          user_agent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
          ip_address: "192.168.1.1",
          current: false,
        },
        {
          id: "mock-session-2",
          user_id: user.id,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
          last_active_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          ip_address: "192.168.1.2",
          current: false,
        },
      ];

      setSessions(mockSessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, toast]);

  // Terminate a session
  const terminateSession = async (sessionId: string) => {
    try {
      setTerminating(sessionId);

      // If terminating all sessions
      if (sessionId === "all") {
        // Sign out from all devices using the enhanced auth context
        await user.signOutAllDevices();
        toast({
          title: "Success",
          description: "You have been signed out from all devices.",
        });
        return;
      }

      // If it's the current session, sign out
      const isCurrentSession = sessions.find(
        (session) => session.id === sessionId,
      )?.current;

      if (isCurrentSession) {
        await user.signOut();
        toast({
          title: "Signed Out",
          description: "You have been signed out of your current session.",
        });
        return;
      }

      // For other sessions, we would call a backend API to terminate the session
      // For now, we'll simulate it with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Remove the session from the list
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      toast({
        title: "Success",
        description: "Session terminated successfully.",
      });
    } catch (error: any) {
      console.error("Error terminating session:", error);
      toast({
        title: "Error",
        description: "Failed to terminate session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTerminating(null);
    }
  };

  // Format device info from user agent
  const formatDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return "Unknown device";

    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      return "iOS Device";
    } else if (userAgent.includes("Android")) {
      return "Android Device";
    } else if (userAgent.includes("Windows")) {
      return "Windows PC";
    } else if (userAgent.includes("Mac OS")) {
      return "Mac";
    } else if (userAgent.includes("Linux")) {
      return "Linux";
    } else {
      return "Unknown device";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Sessions</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-1"
                disabled={loading || terminating !== null}
              >
                <LogOut className="h-4 w-4" />
                Sign Out All Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately terminate all active sessions across all
                  devices. You will need to sign in again on each device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => terminateSession("all")}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Sign Out All Devices
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Security Notice</p>
          <p>
            If you notice any sessions you don't recognize, terminate them
            immediately and consider changing your password.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8 text-teal-500" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-slate-500">No active sessions found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {formatDeviceInfo(session.user_agent)}
                      {session.current && (
                        <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                      {session.user_agent || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>{session.ip_address || "Unknown"}</TableCell>
                  <TableCell>
                    {new Date(session.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(session.last_active_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                          disabled={terminating === session.id}
                        >
                          {terminating === session.id ? (
                            <>
                              <Spinner className="mr-2 h-3 w-3" />
                              Terminating...
                            </>
                          ) : (
                            <>
                              <LogOut className="h-3 w-3 mr-1" />
                              {session.current ? "Sign Out" : "Terminate"}
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {session.current
                              ? "Sign out of current session?"
                              : "Terminate session?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {session.current
                              ? "You will be signed out of your current session and redirected to the login page."
                              : "This will immediately terminate the selected session. The user will need to sign in again."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => terminateSession(session.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            {session.current ? "Sign Out" : "Terminate"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-lg border text-sm">
        <p className="font-medium mb-2">About Sessions</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>
            Sessions remain active until they expire or are manually terminated.
          </li>
          <li>Your current session is marked with a "Current" badge.</li>
          <li>
            For security reasons, sessions automatically expire after 30 days of
            inactivity.
          </li>
          <li>
            If you enable "Remember Me" when signing in, your session will last
            for 30 days.
          </li>
        </ul>
      </div>
    </div>
  );
}
