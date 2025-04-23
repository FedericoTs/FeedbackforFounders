import React, { useState, useEffect } from "react";
import BaseWidget from "./BaseWidget";
import {
  MessageSquare,
  CheckCircle2,
  Trophy,
  FolderKanban,
  Award,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  user?: {
    name: string;
    avatar: string;
  };
}

interface ActivityWidgetProps {
  activities?: ActivityItem[];
  className?: string;
  isLoading?: boolean;
  isRemovable?: boolean;
  onRemove?: () => void;
  limit?: number;
}

const defaultActivities: ActivityItem[] = [
  {
    id: "1",
    type: "feedback",
    content:
      "<strong>John Doe</strong> left a feedback on <strong>Website Redesign</strong>",
    timestamp: "2 hours ago",
    user: {
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    },
  },
  {
    id: "2",
    type: "project",
    content:
      "<strong>Mobile App UX</strong> project status changed to <strong>In Review</strong>",
    timestamp: "1 day ago",
  },
  {
    id: "3",
    type: "achievement",
    content: "You earned the <strong>Top Reviewer</strong> badge",
    timestamp: "3 days ago",
  },
];

const ActivityWidget = ({
  activities: initialActivities,
  className,
  isLoading: initialLoading = false,
  isRemovable = true,
  onRemove,
  limit = 5,
}: ActivityWidgetProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>(
    initialActivities || defaultActivities,
  );
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, limit]);

  const fetchActivities = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*, user:user_id(name, avatar_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data) {
        const formattedActivities = data.map((item) => ({
          id: item.id,
          type: item.activity_type,
          content: item.description,
          timestamp: formatDistanceToNow(new Date(item.created_at), {
            addSuffix: true,
          }),
          user: item.user
            ? {
                name: item.user.name || "User",
                avatar:
                  item.user.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
              }
            : undefined,
        }));
        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "feedback":
        return (
          <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
        );
      case "project":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case "achievement":
        return (
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      case "reward":
        return (
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "login":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <LogIn className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case "system":
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        );
    }
  };

  const handleRefresh = () => {
    fetchActivities();
  };

  return (
    <BaseWidget
      title="Activity Feed"
      icon={<MessageSquare className="h-4 w-4" />}
      className={className}
      isLoading={isLoading}
      isRemovable={isRemovable}
      isRefreshable={true}
      onRefresh={handleRefresh}
      onRemove={onRemove}
    >
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                {getActivityIcon(activity.type)}
                <div>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {activity.content}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              No recent activities found.
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="mt-4 text-center">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="w-full">
            View All Activities
          </Button>
        </Link>
      </div>
    </BaseWidget>
  );
};

export default ActivityWidget;
