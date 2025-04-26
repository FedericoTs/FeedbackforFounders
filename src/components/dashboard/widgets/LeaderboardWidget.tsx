import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MemoizedPointsLeaderboard from "../PointsLeaderboard";

interface LeaderboardWidgetProps {
  className?: string;
  limit?: number;
  showUserRank?: boolean;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  className,
  limit = 5,
  showUserRank = true,
}) => {
  return (
    <div className={className}>
      <MemoizedPointsLeaderboard
        limit={limit}
        showUserRank={showUserRank}
        compact={true}
      />
    </div>
  );
};

export default LeaderboardWidget;
