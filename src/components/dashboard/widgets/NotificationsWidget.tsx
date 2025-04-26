import React from "react";
import BaseWidget from "./BaseWidget";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface NotificationsWidgetProps {
  className?: string;
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  className,
}) => {
  return (
    <BaseWidget
      title="Notifications"
      icon={<Bell className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing notifications")}
    >
      <ScrollArea className="h-[200px]">
        <div className="space-y-4">
          {/* Placeholder notifications */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">New feedback received</p>
                <p className="text-xs text-slate-500">2 hours ago</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Feedback
              </span>
            </div>
          </div>

          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Project update</p>
                <p className="text-xs text-slate-500">Yesterday</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Project
              </span>
            </div>
          </div>

          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Achievement unlocked</p>
                <p className="text-xs text-slate-500">3 days ago</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                Achievement
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-4 text-center">
        <Button variant="outline" size="sm">
          View all notifications
        </Button>
      </div>
    </BaseWidget>
  );
};

export default NotificationsWidget;
