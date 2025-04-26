import React from "react";
import BaseWidget from "./BaseWidget";
import { BarChart3 } from "lucide-react";

interface StatsWidgetProps {
  className?: string;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ className }) => {
  return (
    <BaseWidget
      title="Overview"
      icon={<BarChart3 className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing stats")}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-md">
          <div className="text-sm text-slate-500">Total Projects</div>
          <div className="text-2xl font-bold">12</div>
          <div className="text-xs text-green-600 mt-1">
            ↑ 8% from last month
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-md">
          <div className="text-sm text-slate-500">Feedback Received</div>
          <div className="text-2xl font-bold">48</div>
          <div className="text-xs text-green-600 mt-1">
            ↑ 12% from last month
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-md">
          <div className="text-sm text-slate-500">Points Earned</div>
          <div className="text-2xl font-bold">1,250</div>
          <div className="text-xs text-green-600 mt-1">
            ↑ 15% from last month
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-md">
        <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm">Feedback submitted</div>
            <div className="text-xs text-slate-500">2 hours ago</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm">Project created</div>
            <div className="text-xs text-slate-500">Yesterday</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm">Achievement unlocked</div>
            <div className="text-xs text-slate-500">3 days ago</div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default StatsWidget;
