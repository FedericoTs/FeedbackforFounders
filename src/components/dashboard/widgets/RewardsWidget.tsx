import React from "react";
import BaseWidget from "./BaseWidget";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RewardsWidgetProps {
  className?: string;
}

export const RewardsWidget: React.FC<RewardsWidgetProps> = ({ className }) => {
  return (
    <BaseWidget
      title="Rewards"
      icon={<Gift className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing rewards")}
    >
      <ScrollArea className="h-[200px]">
        <div className="space-y-4">
          {/* Placeholder rewards */}
          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">5-Day Streak Bonus</p>
                <p className="text-xs text-slate-500">+50 points</p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Streak
              </span>
            </div>
          </div>

          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Quality Feedback Badge</p>
                <p className="text-xs text-slate-500">+25 points</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                Badge
              </span>
            </div>
          </div>

          <div className="border-b pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">Project Milestone</p>
                <p className="text-xs text-slate-500">+100 points</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Achievement
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-4 text-center">
        <Button variant="outline" size="sm">
          View all rewards
        </Button>
      </div>
    </BaseWidget>
  );
};

export default RewardsWidget;
