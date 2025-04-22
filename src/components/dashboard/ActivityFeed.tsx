import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  GitCommit,
  Users,
  FileEdit,
  Star,
  Award,
  ThumbsUp,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type:
    | "comment"
    | "commit"
    | "mention"
    | "update"
    | "feedback"
    | "achievement"
    | "points";
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  project?: string;
  points?: number;
  quality?: number;
  category?: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

const defaultActivities: ActivityItem[] = [
  {
    id: "1",
    type: "feedback",
    user: {
      name: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    content: "Provided high-quality feedback on the homepage design",
    timestamp: "5m ago",
    project: "Website Redesign",
    points: 25,
    quality: 0.85,
    category: "UI/UX",
  },
  {
    id: "2",
    type: "achievement",
    user: {
      name: "Alex Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    content: "Earned the Quality Reviewer achievement",
    timestamp: "15m ago",
    points: 150,
  },
  {
    id: "3",
    type: "feedback",
    user: {
      name: "Maria Garcia",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    },
    content: "Provided feedback on the checkout process",
    timestamp: "1h ago",
    project: "E-commerce App",
    points: 15,
    category: "Functionality",
  },
  {
    id: "4",
    type: "points",
    user: {
      name: "James Wilson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    },
    content: "Received points for daily login streak",
    timestamp: "2h ago",
    points: 10,
  },
  {
    id: "5",
    type: "comment",
    user: {
      name: "Emma Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
    content: "Added comments on the UI design proposal",
    timestamp: "3h ago",
    project: "Mobile App",
  },
];

const getActivityIcon = (type: ActivityItem["type"]) => {
  switch (type) {
    case "comment":
      return <MessageSquare className="h-4 w-4" />;
    case "commit":
      return <GitCommit className="h-4 w-4" />;
    case "mention":
      return <Users className="h-4 w-4" />;
    case "update":
      return <FileEdit className="h-4 w-4" />;
    case "feedback":
      return <ThumbsUp className="h-4 w-4 text-teal-500" />;
    case "achievement":
      return <Award className="h-4 w-4 text-amber-500" />;
    case "points":
      return <Star className="h-4 w-4 text-amber-500" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const ActivityFeed = ({
  activities = defaultActivities,
}: ActivityFeedProps) => {
  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-4 pr-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="group">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage
                    src={activity.user.avatar}
                    alt={activity.user.name}
                  />
                  <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {activity.user.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.project && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        {activity.project}
                      </Badge>
                    )}
                    {activity.category && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {activity.category}
                      </Badge>
                    )}
                    {activity.quality && activity.quality > 0.7 && (
                      <Badge className="text-xs bg-green-100 text-green-700">
                        Quality: {Math.round(activity.quality * 100)}%
                      </Badge>
                    )}
                    {activity.points && activity.points > 0 && (
                      <Badge className="ml-auto text-xs bg-teal-100 text-teal-700">
                        +{activity.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {index < activities.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityFeed;
