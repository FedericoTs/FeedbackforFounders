import React from "react";
import { DashboardWidgetGrid } from "../dashboard/widgets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ActivityFeed from "../dashboard/ActivityFeed";
import QuickActions from "../dashboard/QuickActions";
import UserProfile from "../dashboard/UserProfile";
import LoginStreakDisplay from "../dashboard/LoginStreakDisplay";
import RewardsPanel from "../dashboard/RewardsPanel";

import withAuth from "@/lib/withAuth";

function Dashboard() {
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
              <DashboardWidgetGrid />
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
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
