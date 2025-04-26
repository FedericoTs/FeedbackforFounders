import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import UserProfile from "@/components/dashboard/UserProfile";
import LoginStreakDisplay from "@/components/dashboard/LoginStreakDisplay";
import RewardsPanel from "@/components/dashboard/RewardsPanel";
import DashboardWidgetGrid from "@/components/dashboard/DashboardWidgetGrid";

function Dashboard() {
  // Initialize widgets with an empty array to prevent undefined errors
  const [widgets, setWidgets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock recent projects and feedback for QuickActions
  const recentProjects = [
    { id: "1", title: "Project Alpha" },
    { id: "2", title: "Project Beta" },
  ];

  const recentFeedback = [
    { id: "1", title: "Feedback on UI design" },
    { id: "2", title: "Performance suggestions" },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-3/4">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-600 mb-6">
            Welcome to your FeedbackLoop dashboard. Track your progress, manage
            projects, and view your rewards.
          </p>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardWidgetGrid widgets={widgets} />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <ActivityFeed />
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <RewardsPanel />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full md:w-1/4 space-y-6">
          <UserProfile />
          <LoginStreakDisplay />
          <QuickActions
            recentProjects={recentProjects}
            recentFeedback={recentFeedback}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
