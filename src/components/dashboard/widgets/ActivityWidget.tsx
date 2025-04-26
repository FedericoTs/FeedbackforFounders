import React, { useState } from "react";
import BaseWidget from "./BaseWidget";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import VirtualizedActivityFeed from "../VirtualizedActivityFeed";

interface ActivityWidgetProps {
  title?: string;
  className?: string;
  limit?: number;
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  title = "Recent Activity",
  className = "",
  limit = 10,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <BaseWidget
      title={title}
      className={className}
      icon={<MessageSquare className="h-4 w-4" />}
      isRefreshable={true}
      onRefresh={handleRefresh}
    >
      <div className="h-full">
        <VirtualizedActivityFeed
          key={refreshKey}
          limit={limit}
          showFilters={false}
          compact={true}
        />
      </div>
    </BaseWidget>
  );
};

export default ActivityWidget;
