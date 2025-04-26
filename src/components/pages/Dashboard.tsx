import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import QuickActions from "@/components/dashboard/QuickActions";
import UserProfile from "@/components/dashboard/UserProfile";
import LoginStreakDisplay from "@/components/dashboard/LoginStreakDisplay";
import RewardsPanel from "@/components/dashboard/RewardsPanel";
import DashboardWidgetGrid from "@/components/dashboard/DashboardWidgetGrid";
import { useAuth } from "@/supabase/auth";
import { supabase } from "../../supabase/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Import widget components
import {
  StatsWidget,
  ProjectsWidget,
  ActivityWidget,
  RewardsWidget,
  NotificationsWidget,
  AchievementsWidget,
} from "@/components/dashboard/widgets";

interface DashboardPreferences {
  id: string;
  user_id: string;
  widgets: any[];
  layout: any;
  created_at: string;
  updated_at: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dashboard data from the database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch user's dashboard preferences
        const { data: preferences, error: preferencesError } = await supabase
          .from("dashboard_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (preferencesError) {
          if (preferencesError.code === "PGRST116") {
            // PGRST116 is "no rows returned" - this is expected for new users
            console.log(
              "No dashboard preferences found for user, using defaults",
            );
          } else if (preferencesError.code === "42P01") {
            // Table doesn't exist yet - the migration might still be processing
            console.warn(
              "Dashboard preferences table not ready yet, using defaults",
            );
          } else {
            console.error(
              "Error fetching dashboard preferences:",
              preferencesError,
            );
            setError("Failed to load dashboard preferences");
            return;
          }
        }

        // If user has saved preferences, use them
        if (preferences?.widgets && preferences.widgets.length > 0) {
          setWidgets(preferences.widgets);
        } else {
          // Otherwise, set default widgets
          setWidgets([
            {
              id: "stats",
              type: "stats",
              title: "Overview",
              w: 2,
              h: 1,
              x: 0,
              y: 0,
            },
            {
              id: "projects",
              type: "projects",
              title: "Recent Projects",
              w: 1,
              h: 2,
              x: 0,
              y: 1,
            },
            {
              id: "activity",
              type: "activity",
              title: "Recent Activity",
              w: 1,
              h: 2,
              x: 1,
              y: 1,
            },
            {
              id: "rewards",
              type: "rewards",
              title: "Rewards",
              w: 1,
              h: 1,
              x: 2,
              y: 0,
            },
            {
              id: "achievements",
              type: "achievements",
              title: "Achievements",
              w: 1,
              h: 1,
              x: 2,
              y: 1,
            },
            {
              id: "notifications",
              type: "notifications",
              title: "Notifications",
              w: 1,
              h: 1,
              x: 2,
              y: 2,
            },
          ]);
        }
      } catch (err) {
        console.error("Error in dashboard data fetching:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Mock recent projects and feedback for QuickActions
  const recentProjects = [
    { id: "1", title: "Project Alpha" },
    { id: "2", title: "Project Beta" },
  ];

  const recentFeedback = [
    { id: "1", title: "Feedback on UI design" },
    { id: "2", title: "Performance suggestions" },
  ];

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full md:w-3/4">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-full max-w-md mb-6" />

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-4 h-64">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/4 space-y-6">
            <Card className="p-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-32 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </Card>

            <Card className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="mt-2">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
      </div>
    );
  }

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
