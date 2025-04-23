import React from "react";
import { Activity } from "@/services/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatActivityDate, getActivityTypeInfo } from "@/lib/activityUtils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  FolderKanban,
  Award,
  LogIn,
  Trophy,
  AlertCircle,
} from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
  isNew?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isNew = false,
}) => {
  const { color, bgColor } = getActivityTypeInfo(activity.type);

  // Get the appropriate icon based on activity type
  const getActivityIcon = () => {
    switch (activity.type) {
      case "project":
        return <FolderKanban className={`h-4 w-4 ${color}`} />;
      case "feedback":
        return <MessageSquare className={`h-4 w-4 ${color}`} />;
      case "reward":
        return <Award className={`h-4 w-4 ${color}`} />;
      case "achievement":
        return <Trophy className={`h-4 w-4 ${color}`} />;
      case "login":
        return <LogIn className={`h-4 w-4 ${color}`} />;
      case "system":
      default:
        return <AlertCircle className={`h-4 w-4 ${color}`} />;
    }
  };

  // Generate link based on activity type and metadata
  const getActivityLink = () => {
    const { type, metadata } = activity;

    switch (type) {
      case "project":
        return metadata?.projectId
          ? `/dashboard/projects/${metadata.projectId}`
          : "/dashboard/projects";
      case "feedback":
        return metadata?.feedbackId
          ? `/dashboard/feedback/${metadata.feedbackId}`
          : "/dashboard/feedback";
      case "achievement":
      case "reward":
        return "/dashboard/profile";
      default:
        return "#";
    }
  };

  return (
    <div
      className={`p-3 rounded-lg transition-all ${isNew ? "animate-highlight bg-teal-50 dark:bg-teal-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={
              activity.user?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user?.id || "user"}`
            }
            alt={activity.user?.name || "User"}
          />
          <AvatarFallback>{activity.user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-medium">
                {activity.user?.name || "Anonymous"}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {" "}
                {activity.action}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatActivityDate(activity.created_at)}
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            {activity.content}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className={`text-xs flex items-center gap-1 ${bgColor} border-transparent`}
            >
              {getActivityIcon()}
              <span className={color}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </span>
            </Badge>

            {activity.metadata?.projectName && (
              <Badge variant="outline" className="text-xs">
                {activity.metadata.projectName}
              </Badge>
            )}

            {activity.metadata?.points && (
              <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                +{activity.metadata.points} pts
              </Badge>
            )}

            <Link
              to={getActivityLink()}
              className="ml-auto text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActivityItem);
