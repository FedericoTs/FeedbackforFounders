import React, { useState, useEffect, useMemo } from "react";
import { Bell, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Notification,
  NotificationType,
  NotificationCategory,
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
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(notification);
    });

    return groups;
  }, [notifications]);

  // Fetch notifications when the component mounts or when the dropdown is opened
  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
    }
  }, [user, isOpen, categoryFilter, typeFilter, showUnreadOnly]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const { unsubscribe } = notificationsService.subscribeToNotifications(
      (notification) => {
        // Check if notification passes current filters
        const passesFilters =
          (!categoryFilter || notification.category === categoryFilter) &&
          (!typeFilter || notification.type === typeFilter) &&
          (!showUnreadOnly || !notification.is_read);

        if (passesFilters) {
          // Add the new notification to the list
          setNotifications((prev) => [notification, ...prev]);
        }

        // Always increment the unread count
        setUnreadCount((prev) => prev + 1);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [user, categoryFilter, typeFilter, showUnreadOnly]);

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

  const fetchNotifications = async (loadMore = false) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, metadata } = await notificationsService.getNotifications({
        limit: 10,
        cursor: loadMore ? nextCursor : undefined,
        includeRead: !showUnreadOnly,
        category: categoryFilter as NotificationCategory | undefined,
        type: typeFilter as NotificationType | undefined,
      });

      if (loadMore) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }

      setHasMore(metadata.hasMore);
      setNextCursor(metadata.nextCursor);
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

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(true);
    }
  };

  const resetFilters = () => {
    setCategoryFilter(null);
    setTypeFilter(null);
    setShowUnreadOnly(false);
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

  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.ACTIVITY:
        return (
          <Badge
            variant="outline"
            className="text-xs bg-blue-50 border-blue-200"
          >
            Activity
          </Badge>
        );
      case NotificationCategory.COLLABORATION:
        return (
          <Badge
            variant="outline"
            className="text-xs bg-green-50 border-green-200"
          >
            Collaboration
          </Badge>
        );
      case NotificationCategory.GAMIFICATION:
        return (
          <Badge
            variant="outline"
            className="text-xs bg-purple-50 border-purple-200"
          >
            Gamification
          </Badge>
        );
      case NotificationCategory.SYSTEM:
        return (
          <Badge
            variant="outline"
            className="text-xs bg-slate-50 border-slate-200"
          >
            System
          </Badge>
        );
      case NotificationCategory.GENERAL:
      default:
        return (
          <Badge
            variant="outline"
            className="text-xs bg-gray-50 border-gray-200"
          >
            General
          </Badge>
        );
    }
  };

  const renderNotificationItem = (notification: Notification) => (
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
          <div className="flex gap-2 items-center">
            {getNotificationIcon(notification.type)}
            {getCategoryBadge(notification.category as NotificationCategory)}
          </div>
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
  );

  const renderGroupedNotifications = () => {
    return Object.entries(groupedNotifications).map(([date, items]) => (
      <div key={date} className="mb-2">
        <div className="px-4 py-1 text-xs font-medium text-slate-500 bg-slate-50">
          {date}
        </div>
        {items.map(renderNotificationItem)}
      </div>
    ));
  };

  const hasActiveFilters =
    categoryFilter !== null || typeFilter !== null || showUnreadOnly;

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
        <div className="flex justify-between items-center p-2">
          <DropdownMenuLabel className="px-2 py-0">
            Notifications
          </DropdownMenuLabel>
          <div className="flex items-center gap-2">
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-6 px-2">
                <Filter className="h-3 w-3 mr-1" />
                <span className="text-xs">Filter</span>
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[10px]"
                  >
                    {
                      Object.values([
                        categoryFilter,
                        typeFilter,
                        showUnreadOnly,
                      ]).filter(Boolean).length
                    }
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs">
                      Category
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={categoryFilter || ""}
                      onValueChange={(value) =>
                        setCategoryFilter(value || null)
                      }
                    >
                      <DropdownMenuRadioItem value="">
                        All Categories
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationCategory.GENERAL}
                      >
                        General
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationCategory.ACTIVITY}
                      >
                        Activity
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationCategory.COLLABORATION}
                      >
                        Collaboration
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationCategory.GAMIFICATION}
                      >
                        Gamification
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationCategory.SYSTEM}
                      >
                        System
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs">
                      Type
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={typeFilter || ""}
                      onValueChange={(value) => setTypeFilter(value || null)}
                    >
                      <DropdownMenuRadioItem value="">
                        All Types
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value={NotificationType.SYSTEM}>
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value={NotificationType.FEEDBACK}>
                        Feedback
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value={NotificationType.PROJECT}>
                        Project
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value={NotificationType.REWARD}>
                        Reward
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value={NotificationType.ACHIEVEMENT}
                      >
                        Achievement
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs">
                      Status
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={showUnreadOnly ? "unread" : "all"}
                      onValueChange={(value) =>
                        setShowUnreadOnly(value === "unread")
                      }
                    >
                      <DropdownMenuRadioItem value="all">
                        All
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="unread">
                        Unread only
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs justify-center"
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                  >
                    Reset Filters
                  </Button>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading && notifications.length === 0 ? (
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
            <div className="py-1">
              {renderGroupedNotifications()}

              {hasMore && (
                <div className="p-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 px-4 text-center text-gray-500">
              {hasActiveFilters
                ? "No notifications match your filters"
                : "No notifications yet"}
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
