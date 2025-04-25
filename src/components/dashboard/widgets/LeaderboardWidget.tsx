import React from "react";
import { Trophy } from "lucide-react";
import BaseWidget from "./BaseWidget";
import PointsLeaderboard from "../PointsLeaderboard";

interface LeaderboardWidgetProps {
  id: string;
  title?: string;
  className?: string;
  onRemove?: (id: string) => void;
  onEdit?: (id: string) => void;
  limit?: number;
  showUserRank?: boolean;
}

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  id,
  title = "Leaderboard",
  className,
  onRemove,
  onEdit,
  limit = 5,
  showUserRank = true,
}) => {
  return (
    <BaseWidget
      id={id}
      title={title}
      icon={<Trophy className="h-4 w-4 text-amber-500" />}
      className={className}
      onRemove={onRemove}
      onEdit={onEdit}
    >
      <div className="p-1">
        <PointsLeaderboard
          limit={limit}
          showUserRank={showUserRank}
          compact={true}
        />
      </div>
    </BaseWidget>
  );
};

export default LeaderboardWidget;
