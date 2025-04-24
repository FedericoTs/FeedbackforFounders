import React from "react";
import { Card, CardContent } from "../ui/card";

interface DashboardGridProps {
  children?: React.ReactNode;
}

export default function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children || (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-2">
                Welcome to your Dashboard
              </h3>
              <p className="text-sm text-slate-500">
                This is your personalized dashboard. Add widgets and customize
                it to your needs.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
              <p className="text-sm text-slate-500">
                No recent activity to display. Start interacting with the
                platform to see updates here.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-2">Quick Stats</h3>
              <p className="text-sm text-slate-500">
                Your statistics and metrics will appear here as you use the
                platform.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
