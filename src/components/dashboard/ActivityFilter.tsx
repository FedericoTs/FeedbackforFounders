import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityType } from "@/services/activity";
import { Filter } from "lucide-react";

export type TimeRange = "all" | "today" | "week" | "month";

interface ActivityFilterProps {
  selectedType: ActivityType | "all";
  onTypeChange: (type: ActivityType | "all") => void;
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  selectedType,
  onTypeChange,
  selectedTimeRange,
  onTimeRangeChange,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Activity Feed</h3>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Activity Type</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedType}
              onValueChange={(value) =>
                onTypeChange(value as ActivityType | "all")
              }
            >
              <DropdownMenuRadioItem value="all">
                All Activities
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.PROJECT}>
                Projects
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.FEEDBACK}>
                Feedback
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.REWARD}>
                Rewards
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.ACHIEVEMENT}>
                Achievements
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.LOGIN}>
                Logins
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value={ActivityType.SYSTEM}>
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Time Range</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedTimeRange}
              onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
            >
              <DropdownMenuRadioItem value="all">
                All Time
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="week">
                This Week
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="month">
                This Month
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ActivityFilter;
