import React from "react";
import BaseWidget from "./BaseWidget";
import { Activity } from "lucide-react";
import { VirtualizedActivityFeed } from "@/components/dashboard/VirtualizedActivityFeed";

interface ActivityWidgetProps {
  className?: string;
  compact?: boolean;
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  className,
  compact = true,
}) => {
  return (
    <BaseWidget
      title="Recent Activity"
      icon={<Activity className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing activity")}
    >
      <VirtualizedActivityFeed
        limit={5}
        compact={compact}
        showFilters={false}
      />
    </BaseWidget>
  );
};

export default ActivityWidget;
