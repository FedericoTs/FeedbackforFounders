import React, { useState, useEffect } from "react";
import { Bell, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import BaseWidget from "./BaseWidget";

interface NotificationsWidgetProps {
  limit?: number;
  className?: string;
  title?: string;
}

interface Notification {
  id: string;
  title: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  content?: string;
}

const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  limit = 5,
  className,
  title = "Recent Notifications",
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Simulate fetching notifications
    setTimeout(() => {
      const mockNotifications = [
        {
          id: "1",
          title: "New feedback received",
          type: "feedback",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          link: "/dashboard/feedback",
        },
        {
          id: "2",
          title: "Project collaboration invite",
          type: "project",
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          link: "/dashboard/projects",
        },
        {
          id: "3",
          title: "Achievement unlocked: First Feedback",
          type: "achievement",
          is_read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          link: "/dashboard/rewards",
        },
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "feedback":
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400">
            Feedback
          </Badge>
        );
      case "project":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Project
          </Badge>
        );
      case "achievement":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            Achievement
          </Badge>
        );
      case "reward":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Reward
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
            System
          </Badge>
        );
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <BaseWidget
      title={title}
      icon={<Bell className="h-4 w-4" />}
      className={className}
      isRefreshable={true}
      onRefresh={() => setIsLoading(true)}
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
                    {getNotificationBadge(notification.type)}
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
      <div className="mt-4 flex justify-center">
        <Link to="/dashboard/notifications" className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            View all notifications
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </BaseWidget>
  );
};

export default NotificationsWidget;
