import React, { useState } from "react";
import { useAwardToast } from "@/hooks/useAwardToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Star, Zap, Trophy, MessageSquare, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface RewardHistoryPanelProps {
  className?: string;
  limit?: number;
}

const RewardHistoryPanel: React.FC<RewardHistoryPanelProps> = ({
  className = "",
  limit = 50,
}) => {
  const { toastHistory } = useAwardToast();
  const [filter, setFilter] = useState<string>("all");

  // Apply filter to history
  const filteredHistory = toastHistory
    .filter((item) => {
      if (filter === "all") return true;
      return item.variant === filter;
    })
    .slice(0, limit);

  // Group rewards by date
  const groupedRewards = filteredHistory.reduce<
    Record<string, typeof filteredHistory>
  >((groups, reward) => {
    const timestamp = reward.metadata?.timestamp || reward.timestamp;
    const date = timestamp
      ? format(new Date(timestamp), "yyyy-MM-dd")
      : "Unknown";

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reward);
    return groups;
  }, {});

  // Get icon for reward type
  const getRewardIcon = (variant: string = "default") => {
    switch (variant) {
      case "achievement":
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case "streak":
        return <Star className="h-4 w-4 text-blue-500" />;
      case "level":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Zap className="h-4 w-4 text-teal-500" />;
    }
  };

  // Format date for display
  const formatDateHeading = (dateString: string) => {
    if (dateString === "Unknown") return "Unknown Date";

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === format(today, "yyyy-MM-dd")) {
      return "Today";
    } else if (dateString === format(yesterday, "yyyy-MM-dd")) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  // Get badge color for reward type
  const getVariantBadgeColor = (variant: string = "default") => {
    switch (variant) {
      case "achievement":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "streak":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "level":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "feedback":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-teal-100 text-teal-800 border-teal-200";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            Reward History
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-8">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rewards</SelectItem>
              <SelectItem value="default">Points</SelectItem>
              <SelectItem value="achievement">Achievements</SelectItem>
              <SelectItem value="level">Level Ups</SelectItem>
              <SelectItem value="streak">Streaks</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Your recent rewards and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredHistory.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedRewards).map(([date, rewards]) => (
                <div key={date} className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-500 sticky top-0 bg-white py-1">
                    {formatDateHeading(date)}
                  </h4>
                  <div className="space-y-2">
                    {rewards.map((reward, index) => (
                      <div
                        key={`${date}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-md border border-slate-200 bg-slate-50"
                      >
                        <div className="mt-0.5">
                          {getRewardIcon(reward.variant)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-slate-900 truncate">
                              {reward.title}
                            </h5>
                            <Badge
                              className={`${getVariantBadgeColor(
                                reward.variant,
                              )} text-xs`}
                            >
                              +{reward.points}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {reward.description}
                          </p>
                          {reward.metadata?.context && (
                            <p className="text-xs text-slate-500 mt-1">
                              {reward.metadata.context}
                            </p>
                          )}
                          {reward.timestamp && (
                            <p className="text-xs text-slate-400 mt-1">
                              {format(new Date(reward.timestamp), "h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">
              No rewards found{filter !== "all" ? " for this filter" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardHistoryPanel;
