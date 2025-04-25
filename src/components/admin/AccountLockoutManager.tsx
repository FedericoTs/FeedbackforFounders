import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Clock,
  Search,
  Shield,
  Unlock,
  RefreshCw,
  UserX,
} from "lucide-react";
import { formatCooldownTime } from "@/lib/authUtils";
import { getLockedAccounts, unlockAccount } from "@/lib/rateLimiter";
import AccountLockoutAlert from "../ui/account-lockout-alert";

interface LockedAccountInfo {
  identifier: string;
  lockoutLevel: number;
  lockoutUntil: number;
  remainingTime: number;
  recentAttempts: number;
}

/**
 * Admin component for managing account lockouts
 */
export default function AccountLockoutManager() {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] =
    useState<LockedAccountInfo | null>(null);
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  // Check if user has admin permissions
  const isAdmin = hasPermission("manage_users");

  // Load locked accounts on mount and periodically
  useEffect(() => {
    if (!isAdmin) return;

    const loadLockedAccounts = () => {
      setIsLoading(true);
      try {
        const accounts = getLockedAccounts();
        setLockedAccounts(accounts);
      } catch (error) {
        console.error("Error loading locked accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load immediately
    loadLockedAccounts();

    // Then refresh every 30 seconds
    const interval = setInterval(loadLockedAccounts, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Handle unlocking an account
  const handleUnlockAccount = (identifier: string) => {
    try {
      unlockAccount(identifier);

      // Update the local state
      setLockedAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account.identifier !== identifier),
      );

      // Clear selected account if it was unlocked
      if (selectedAccount?.identifier === identifier) {
        setSelectedAccount(null);
      }

      // Show success toast
      toast({
        title: "Account Unlocked",
        description: `Account ${identifier} has been successfully unlocked.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error unlocking account:", error);
      toast({
        title: "Error",
        description: "Failed to unlock account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter accounts based on search query
  const filteredAccounts = lockedAccounts.filter((account) =>
    account.identifier.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // If user doesn't have admin permissions, show access denied
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Lockout Management</CardTitle>
          <CardDescription>Manage locked user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-center">
            <div>
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Access Denied
              </h3>
              <p className="text-slate-600">
                You don't have permission to access this administrative feature.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Lockout Management</CardTitle>
            <CardDescription>Manage locked user accounts</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              const accounts = getLockedAccounts();
              setLockedAccounts(accounts);
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list">
              Locked Accounts
              {lockedAccounts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lockedAccounts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedAccount}>
              Account Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email or identifier"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center p-8 border rounded-md bg-slate-50">
                <UserX className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <h3 className="text-slate-600 font-medium mb-1">
                  {searchQuery
                    ? "No matching accounts found"
                    : "No locked accounts"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {searchQuery
                    ? "Try a different search term or clear the search"
                    : "All user accounts are currently active"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-4">
                  {filteredAccounts.map((account) => (
                    <div
                      key={account.identifier}
                      className="p-4 border rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAccount(account)}
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
                            ${account.lockoutLevel === 1 ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : ""}
                            ${account.lockoutLevel === 2 ? "bg-orange-100 text-orange-800 hover:bg-orange-200" : ""}
                            ${account.lockoutLevel === 3 ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : ""}
                            ${account.lockoutLevel === 4 ? "bg-red-100 text-red-800 hover:bg-red-200" : ""}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockAccount(account.identifier);
                          }}
                          className="text-xs h-7 px-2"
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          Unlock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="details">
            {selectedAccount && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-500">
                        Identifier
                      </Label>
                      <div className="font-medium">
                        {selectedAccount.identifier}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">
                        Lockout Level
                      </Label>
                      <div>
                        <Badge
                          className={`
                            ${selectedAccount.lockoutLevel === 1 ? "bg-amber-100 text-amber-800" : ""}
                            ${selectedAccount.lockoutLevel === 2 ? "bg-orange-100 text-orange-800" : ""}
                            ${selectedAccount.lockoutLevel === 3 ? "bg-rose-100 text-rose-800" : ""}
                            ${selectedAccount.lockoutLevel === 4 ? "bg-red-100 text-red-800" : ""}
                          `}
                        >
                          Level {selectedAccount.lockoutLevel}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">
                        Failed Attempts
                      </Label>
                      <div className="font-medium">
                        {selectedAccount.recentAttempts}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-500">
                        Remaining Lockout Time
                      </Label>
                      <div className="font-medium">
                        {formatCooldownTime(selectedAccount.remainingTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Lockout Preview</h3>
                  <AccountLockoutAlert
                    level={selectedAccount.lockoutLevel}
                    remainingTime={selectedAccount.remainingTime}
                    totalDuration={
                      selectedAccount.lockoutLevel === 1
                        ? 15 * 60 * 1000
                        : selectedAccount.lockoutLevel === 2
                          ? 60 * 60 * 1000
                          : selectedAccount.lockoutLevel === 3
                            ? 24 * 60 * 60 * 1000
                            : 7 * 24 * 60 * 60 * 1000
                    }
                    recentAttempts={selectedAccount.recentAttempts}
                    isAdmin={true}
                    onAdminUnlock={() =>
                      handleUnlockAccount(selectedAccount.identifier)
                    }
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-slate-900">
                        Administrator Actions
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Unlocking an account will reset all lockout
                        restrictions. The user will be able to attempt login
                        immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button
          variant="outline"
          onClick={() => setSelectedAccount(null)}
          disabled={!selectedAccount}
        >
          Back to List
        </Button>
        {selectedAccount && (
          <Button
            variant="destructive"
            onClick={() => handleUnlockAccount(selectedAccount.identifier)}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Unlock Account
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
