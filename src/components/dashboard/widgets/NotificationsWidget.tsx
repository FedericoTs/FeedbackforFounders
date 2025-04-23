import React, { useState, useEffect } from "react";
import { Bell, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  notificationsService,
  NotificationType,
} from "@/services/notifications";
import BaseWidget from "./BaseWidget";

interface NotificationsWidgetProps {
  limit?: number;
  className?: string;
}

const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  limit = 5,
  className,
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Subscribe to new notifications
    const { unsubscribe } = notificationsService.subscribeToNotifications(
      (notification) => {
        // Add the new notification to the list
        setNotifications((prev) => [notification, ...prev.slice(0, limit - 1)]);
        // Increment the unread count
        setUnreadCount((prev) => prev + 1);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [limit]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await notificationsService.getNotifications({
        limit,
      });
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
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
    <BaseWidget
      title="Recent Notifications"
      icon={<Bell className="h-4 w-4" />}
      className={className}
      action={
        <Link
          to="/dashboard/notifications"
          className="flex items-center text-xs text-blue-600 hover:text-blue-800"
        >
          View all <ChevronRight className="h-3 w-3 ml-1" />
        </Link>
      }
      badge={unreadCount > 0 ? unreadCount : undefined}
    >
      <div className="space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-[220px] pr-3">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2 rounded-md ${!notification.is_read ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    {getNotificationIcon(notification.type)}
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">
                    {notification.title}
                  </p>
                  {notification.content && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
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
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 py-0 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default NotificationsWidget;
