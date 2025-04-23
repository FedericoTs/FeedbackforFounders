import { Activity } from "@/services/activity";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";

export interface ActivityGroup {
  title: string;
  activities: Activity[];
}

/**
 * Group activities by date
 */
export function groupActivitiesByDate(activities: Activity[]): ActivityGroup[] {
  if (!activities.length) return [];

  const groups: Record<string, Activity[]> = {};

  activities.forEach((activity) => {
    const date = new Date(activity.created_at);
    let groupTitle: string;

    if (isToday(date)) {
      groupTitle = "Today";
    } else if (isYesterday(date)) {
      groupTitle = "Yesterday";
    } else if (isThisWeek(date)) {
      groupTitle = "This Week";
    } else if (isThisMonth(date)) {
      groupTitle = "This Month";
    } else {
      groupTitle = format(date, "MMMM yyyy");
    }

    if (!groups[groupTitle]) {
      groups[groupTitle] = [];
    }

    groups[groupTitle].push(activity);
  });

  // Convert to array and sort by date (Today, Yesterday, This Week, etc.)
  const groupOrder = ["Today", "Yesterday", "This Week", "This Month"];

  return Object.entries(groups)
    .map(([title, activities]) => ({ title, activities }))
    .sort((a, b) => {
      const indexA = groupOrder.indexOf(a.title);
      const indexB = groupOrder.indexOf(b.title);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      } else if (indexA !== -1) {
        return -1;
      } else if (indexB !== -1) {
        return 1;
      } else {
        return a.title.localeCompare(b.title);
      }
    });
}

/**
 * Format activity date for display
 */
export function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  } else if (isThisWeek(date)) {
    return format(date, "EEEE 'at' h:mm a");
  } else {
    return format(date, "MMM d, yyyy 'at' h:mm a");
  }
}

/**
 * Get icon and color for activity type
 */
export function getActivityTypeInfo(type: string): {
  color: string;
  bgColor: string;
} {
  switch (type) {
    case "project":
      return { color: "text-blue-600", bgColor: "bg-blue-100" };
    case "feedback":
      return { color: "text-teal-600", bgColor: "bg-teal-100" };
    case "reward":
      return { color: "text-amber-600", bgColor: "bg-amber-100" };
    case "achievement":
      return { color: "text-purple-600", bgColor: "bg-purple-100" };
    case "login":
      return { color: "text-green-600", bgColor: "bg-green-100" };
    case "system":
    default:
      return { color: "text-slate-600", bgColor: "bg-slate-100" };
  }
}
