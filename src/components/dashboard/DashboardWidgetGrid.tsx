import React from "react";
import { StatsWidget } from "./widgets/StatsWidget";
import { ProjectsWidget } from "./widgets/ProjectsWidget";
import { ActivityWidget } from "./widgets/ActivityWidget";
import { RewardsWidget } from "./widgets/RewardsWidget";
import { NotificationsWidget } from "./widgets/NotificationsWidget";
import { AchievementsWidget } from "./widgets/AchievementsWidget";
import { LeaderboardWidget } from "./widgets/LeaderboardWidget";

export const DashboardWidgetGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div className="lg:col-span-3">
        <StatsWidget />
      </div>
      <div className="md:col-span-1">
        <ProjectsWidget />
      </div>
      <div className="md:col-span-1">
        <ActivityWidget />
      </div>
      <div className="md:col-span-1">
        <RewardsWidget />
      </div>
      <div className="md:col-span-1">
        <NotificationsWidget />
      </div>
      <div className="md:col-span-1">
        <AchievementsWidget />
      </div>
      <div className="md:col-span-1">
        <LeaderboardWidget />
      </div>
    </div>
  );
};

export default DashboardWidgetGrid;
