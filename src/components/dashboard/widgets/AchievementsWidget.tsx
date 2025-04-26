import React from "react";
import BaseWidget from "./BaseWidget";
import { Trophy } from "lucide-react";

interface AchievementsWidgetProps {
  className?: string;
}

export const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({
  className,
}) => {
  return (
    <BaseWidget
      title="Achievements"
      icon={<Trophy className="h-4 w-4" />}
      className={className}
      isRefreshable
      onRefresh={() => console.log("Refreshing achievements")}
    >
      <div className="space-y-4">
        <div className="text-center py-4">
          <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-2" />
          <h3 className="font-medium text-lg">Recent Achievements</h3>
          <p className="text-sm text-slate-500">
            Complete tasks to earn achievements and rewards
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Placeholder achievements */}
          <div className="border rounded-md p-3 text-center">
            <div className="bg-amber-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-sm font-medium">First Feedback</div>
            <div className="text-xs text-slate-500">
              Submit your first feedback
            </div>
          </div>

          <div className="border rounded-md p-3 text-center">
            <div className="bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5 text-slate-600" />
            </div>
            <div className="text-sm font-medium">3-Day Streak</div>
            <div className="text-xs text-slate-500">
              Login for 3 days in a row
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all achievements
          </button>
        </div>
      </div>
    </BaseWidget>
  );
};

export default AchievementsWidget;
