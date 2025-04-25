import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import AccountLockoutAlert from "@/components/ui/account-lockout-alert";
import {
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  Shield,
  RefreshCw,
  Key,
  UserX,
} from "lucide-react";
import {
  recordFailedAttempt,
  isAccountLocked,
  getAccountLockoutInfo,
  unlockAccount,
  getLockedAccounts,
} from "@/lib/rateLimiter";
import { formatCooldownTime } from "@/lib/authUtils";
import StoryboardAuthWrapper from "@/components/auth/StoryboardAuthWrapper";

export default function AccountLockoutDemo() {
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutInfo, setLockoutInfo] = useState<ReturnType<
    typeof getAccountLockoutInfo
  > | null>(null);
  const [lockedAccounts, setLockedAccounts] = useState<Array<any>>([]);
  const [activeTab, setActiveTab] = useState("demo");
  const { toast } = useToast();

  // Refresh lockout info periodically
  useEffect(() => {
    const checkLockoutStatus = () => {
      if (email) {
        const info = getAccountLockoutInfo(email);
        setLockoutInfo(info);
        setLockedAccounts(getLockedAccounts(true));
      }
    };

    // Check immediately
    checkLockoutStatus();

    // Then check every 2 seconds
    const interval = setInterval(checkLockoutStatus, 2000);

    return () => clearInterval(interval);
  }, [email]);

  const handleLoginAttempt = () => {
    // Simulate a failed login attempt
    const result = recordFailedAttempt(email, {
      ipAddress: "192.168.1.1",
      userAgent: navigator.userAgent,
    });

    setFailedAttempts((prev) => prev + 1);
    setLockoutInfo(getAccountLockoutInfo(email));
    setLockedAccounts(getLockedAccounts(true));

    // Show toast notification
    if (result.lockoutLevel > 0) {
      toast({
        title: `Account Locked - Level ${result.lockoutLevel}`,
        description: `Your account has been locked due to multiple failed login attempts. Please try again in ${formatCooldownTime(
          result.lockoutUntil ? result.lockoutUntil - Date.now() : 0,
        )}.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Login Failed",
        description: `Invalid credentials. ${Math.max(
          0,
          5 - result.attemptsRemaining,
        )} more failed attempts will result in a temporary lockout.`,
        variant: "destructive",
      });
    }
  };

  const handleUnlockAccount = () => {
    unlockAccount(email);
    setLockoutInfo(getAccountLockoutInfo(email));
    setLockedAccounts(getLockedAccounts(true));

    toast({
      title: "Account Unlocked",
      description:
        "The account has been manually unlocked by an administrator.",
      variant: "default",
    });
  };

  const handleReset = () => {
    // Reset the demo
    unlockAccount(email);
    setFailedAttempts(0);
    setLockoutInfo(getAccountLockoutInfo(email));
    setLockedAccounts(getLockedAccounts(true));

    toast({
      title: "Demo Reset",
      description: "The account lockout demo has been reset.",
      variant: "default",
    });
  };

  return (
    <StoryboardAuthWrapper>
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Account Lockout Demo</h1>
            <p className="text-slate-600">
              Demonstrates the progressive account lockout system
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
            <TabsTrigger value="admin">Admin View</TabsTrigger>
            <TabsTrigger value="info">Implementation Details</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-slate-500" />
                    Login Simulation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={lockoutInfo?.isLocked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={lockoutInfo?.isLocked}
                    />
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <div>
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-700"
                      >
                        {failedAttempts} Failed Attempts
                      </Badge>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleUnlockAccount}
                        disabled={!lockoutInfo?.isLocked}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Admin Unlock
                      </Button>
                      <Button
                        onClick={handleLoginAttempt}
                        disabled={lockoutInfo?.isLocked}
                      >
                        Simulate Failed Login
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-slate-500" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lockoutInfo?.isLocked ? (
                    <AccountLockoutAlert
                      level={lockoutInfo.level}
                      remainingTime={lockoutInfo.remainingTime}
                      totalDuration={lockoutInfo.totalDuration}
                      recentAttempts={lockoutInfo.recentAttempts}
                      isAdmin={true}
                      onAdminUnlock={handleUnlockAccount}
                      onContactSupport={() =>
                        toast({
                          title: "Support Request",
                          description:
                            "In a real application, this would open a support dialog or redirect to a support page.",
                        })
                      }
                    />
                  ) : (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <Shield className="h-5 w-5 text-green-500" />
                      <AlertTitle>Account Active</AlertTitle>
                      <AlertDescription>
                        This account is currently not locked. Simulate failed
                        login attempts to trigger the lockout system.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">Lockout Progress</span>
                        <span className="font-medium">
                          Level {lockoutInfo?.level || 0}/4
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, (failedAttempts / 20) * 100)}
                        className="h-2"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-slate-500">
                          Failed Attempts
                        </Label>
                        <div className="font-medium">{failedAttempts}</div>
                      </div>
                      <div>
                        <Label className="text-slate-500">Lockout Level</Label>
                        <div className="font-medium">
                          {lockoutInfo?.level || 0}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-500">Lockout Status</Label>
                        <div className="font-medium">
                          {lockoutInfo?.isLocked ? "Locked" : "Unlocked"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-500">Remaining Time</Label>
                        <div className="font-medium">
                          {lockoutInfo?.isLocked
                            ? formatCooldownTime(lockoutInfo.remainingTime)
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lockout Levels Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Level 1
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">Mild Lockout</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      Triggered after 5 failed attempts
                    </p>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      15 minute lockout
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                        Level 2
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">Moderate Lockout</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      Triggered after 10 failed attempts
                    </p>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />1 hour lockout
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-rose-50 border-rose-200">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200">
                        Level 3
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">Severe Lockout</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      Triggered after 15 failed attempts
                    </p>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      24 hour lockout
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                        Level 4
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-1">Critical Lockout</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      Triggered after 20 failed attempts
                    </p>
                    <div className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />7 day lockout
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-slate-500" />
                  Locked Accounts Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lockedAccounts.length === 0 ? (
                  <div className="text-center p-8 border rounded-md bg-slate-50">
                    <UserX className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <h3 className="text-slate-600 font-medium mb-1">
                      No locked accounts
                    </h3>
                    <p className="text-slate-500 text-sm">
                      All user accounts are currently active
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lockedAccounts.map((account) => (
                      <div
                        key={account.identifier}
                        className="p-4 border rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {account.identifier}
                            </h3>
                            <div className="flex items-center text-sm text-slate-600 mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              <span>
                                Locked for{" "}
                                {formatCooldownTime(account.remainingTime)}
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={`
                              ${account.lockoutLevel === 1 ? "bg-amber-100 text-amber-800" : ""}
                              ${account.lockoutLevel === 2 ? "bg-orange-100 text-orange-800" : ""}
                              ${account.lockoutLevel === 3 ? "bg-rose-100 text-rose-800" : ""}
                              ${account.lockoutLevel === 4 ? "bg-red-100 text-red-800" : ""}
                            `}
                          >
                            Level {account.lockoutLevel}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-slate-500">
                            {account.recentAttempts} failed attempts
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unlockAccount(account.identifier)}
                            className="text-xs h-7 px-2"
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Unlock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Lockout Implementation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-4">
                  <p>
                    The account lockout system provides progressive security
                    measures to prevent brute force attacks while balancing user
                    experience. It tracks failed login attempts and applies
                    increasingly strict lockout periods based on the number of
                    failures.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Progressive Lockouts</h3>
                      <p className="text-slate-600">
                        The system uses four lockout levels with increasing
                        durations, from 15 minutes to 7 days, based on the
                        number of failed attempts.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Admin Override</h3>
                      <p className="text-slate-600">
                        Administrators can manually unlock accounts through the
                        admin interface, providing a way to assist legitimate
                        users who are locked out.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">User Feedback</h3>
                      <p className="text-slate-600">
                        Clear notifications inform users about lockout status,
                        remaining time, and options for contacting support if
                        needed.
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">
                        Security Considerations
                      </h3>
                      <p className="text-slate-600">
                        The system tracks attempts across a 24-hour window and
                        maintains separate rate limiting for short-term blocks
                        and longer lockouts.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StoryboardAuthWrapper>
  );
}
