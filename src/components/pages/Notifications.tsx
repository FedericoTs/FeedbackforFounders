import React, { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import {
  Notification,
  NotificationType,
  notificationsService,
} from "@/services/notifications";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Trash2, Bell, Settings } from "lucide-react";

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );
  const [preferences, setPreferences] = useState({
    feedback: true,
    project: true,
    reward: true,
    achievement: true,
    system: true,
    email_notifications: true,
  });

  // Fetch notifications when the component mounts or when the active tab changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchNotificationPreferences();
    }
  }, [user, activeTab]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const { unsubscribe } = notificationsService.subscribeToNotifications(
      (notification) => {
        // Add the new notification to the list if it matches the current tab
        if (activeTab === "all" || !notification.is_read) {
          setNotifications((prev) => [notification, ...prev]);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user, activeTab]);

  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data } = await notificationsService.getNotifications({
        limit: 50,
        unreadOnly: activeTab === "unread",
      });
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    try {
      const prefs = await notificationsService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await notificationsService.markAsRead(notificationId);
      if (success) {
        // Update the notification in the list
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await notificationsService.markAllAsRead();
      if (success) {
        // Mark all notifications in the list as read
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        // If we're on the unread tab, clear the list
        if (activeTab === "unread") {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const success =
        await notificationsService.deleteNotification(notificationId);
      if (success) {
        // Remove the notification from the list
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        // Remove from selected notifications if it was selected
        setSelectedNotifications((prev) =>
          prev.filter((id) => id !== notificationId),
        );
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteSelected = async () => {
    // Delete each selected notification
    for (const id of selectedNotifications) {
      await handleDeleteNotification(id);
    }
    // Clear the selection
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      // If all are selected, deselect all
      setSelectedNotifications([]);
    } else {
      // Otherwise, select all
      setSelectedNotifications(notifications.map((n) => n.id));
    }
  };

  const handleUpdatePreference = async (key: string, value: boolean) => {
    try {
      const updatedPrefs = { ...preferences, [key]: value };
      const success = await notificationsService.updateNotificationPreferences({
        [key]: value,
      });
      if (success) {
        setPreferences(updatedPrefs);
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  };

  const getNotificationBadge = (type: NotificationType) => {
    switch (type) {
      case NotificationType.FEEDBACK:
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
            Feedback
          </Badge>
        );
      case NotificationType.PROJECT:
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Project
          </Badge>
        );
      case NotificationType.REWARD:
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Reward
          </Badge>
        );
      case NotificationType.ACHIEVEMENT:
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            Achievement
          </Badge>
        );
      case NotificationType.SYSTEM:
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
            System
          </Badge>
        );
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-gray-500">
              Please log in to view your notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={
              notifications.length === 0 ||
              notifications.every((n) => n.is_read)
            }
          >
            Mark all as read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedNotifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete selected
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "all" | "unread")}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Notifications</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedNotifications.length === notifications.length &&
                        notifications.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      className="mr-2"
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select All
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Skeleton className="h-4 w-4 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 rounded-lg ${!notification.is_read ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
                        >
                          <Checkbox
                            checked={selectedNotifications.includes(
                              notification.id,
                            )}
                            onCheckedChange={() =>
                              handleSelectNotification(notification.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              {getNotificationBadge(notification.type)}
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(
                                  new Date(notification.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>
                            <h3
                              className={`text-sm mt-1 ${!notification.is_read ? "font-medium" : ""}`}
                            >
                              {notification.title}
                            </h3>
                            {notification.content && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.content}
                              </p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              {notification.link && (
                                <Link
                                  to={notification.link}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  View details
                                </Link>
                              )}
                              <div className="flex items-center gap-2">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      handleMarkAsRead(notification.id)
                                    }
                                  >
                                    Mark as read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">
                      No notifications found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unread" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center">
                    <Checkbox
                      id="select-all-unread"
                      checked={
                        selectedNotifications.length === notifications.length &&
                        notifications.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      className="mr-2"
                    />
                    <label
                      htmlFor="select-all-unread"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Select All
                    </label>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Skeleton className="h-4 w-4 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10"
                        >
                          <Checkbox
                            checked={selectedNotifications.includes(
                              notification.id,
                            )}
                            onCheckedChange={() =>
                              handleSelectNotification(notification.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              {getNotificationBadge(notification.type)}
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(
                                  new Date(notification.created_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>
                            <h3 className="text-sm font-medium mt-1">
                              {notification.title}
                            </h3>
                            {notification.content && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.content}
                              </p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              {notification.link && (
                                <Link
                                  to={notification.link}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  View details
                                </Link>
                              )}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                >
                                  Mark as read
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-gray-500">
                      No unread notifications.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Notification Types
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="feedback-notifications"
                        checked={preferences.feedback}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("feedback", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="feedback-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Feedback Notifications
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="project-notifications"
                        checked={preferences.project}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("project", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="project-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Project Notifications
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reward-notifications"
                        checked={preferences.reward}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("reward", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="reward-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Reward Notifications
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="achievement-notifications"
                        checked={preferences.achievement}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference(
                            "achievement",
                            checked as boolean,
                          )
                        }
                      />
                      <label
                        htmlFor="achievement-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Achievement Notifications
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="system-notifications"
                        checked={preferences.system}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference("system", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="system-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        System Notifications
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Delivery Methods</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email-notifications"
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) =>
                          handleUpdatePreference(
                            "email_notifications",
                            checked as boolean,
                          )
                        }
                      />
                      <label
                        htmlFor="email-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Email Notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
