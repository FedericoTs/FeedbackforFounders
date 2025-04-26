import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Notification,
  NotificationType,
  notificationsService,
} from "@/services/notifications";
import { useAuth } from "@/supabase/auth";

interface NotificationsPopoverProps {
  className?: string;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications when the component mounts or when the dropdown is opened
  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const { unsubscribe } = notificationsService.subscribeToNotifications(
      (notification) => {
        // Add the new notification to the list
        setNotifications((prev) => [notification, ...prev]);
        // Increment the unread count
        setUnreadCount((prev) => prev + 1);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Fetch unread count periodically
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Every minute

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data } = await notificationsService.getNotifications({
        limit: 10,
      });
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
        // Decrement the unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
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
        // Reset the unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative text-gray-700 ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`py-3 px-4 cursor-pointer ${notification.is_read ? "opacity-70" : "font-medium"}`}
                onSelect={(e) => {
                  // Prevent the dropdown from closing
                  e.preventDefault();
                  // Mark as read if not already read
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-start">
                    {getNotificationIcon(notification.type)}
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <span className="text-sm">{notification.title}</span>
                  {notification.content && (
                    <span className="text-xs text-gray-500 line-clamp-2">
                      {notification.content}
                    </span>
                  )}
                  {notification.link && (
                    <Link
                      to={notification.link}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View details
                    </Link>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-4 px-4 text-center text-gray-500">
              No notifications yet
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2 justify-center">
          <Link
            to="/dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsPopover;
