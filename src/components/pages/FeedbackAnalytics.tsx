import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import FeedbackAnalyticsComponent from "../feedback/FeedbackAnalytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, User } from "lucide-react";

const FeedbackAnalytics: React.FC = () => {
  const { id: projectId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"project" | "personal">(
    projectId ? "project" : "personal",
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Feedback Analytics</h1>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "project" | "personal")}
        className="mb-6"
      >
        <TabsList>
          {projectId && (
            <TabsTrigger value="project" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Project Analytics
            </TabsTrigger>
          )}
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="mt-0">
          {projectId ? (
            <FeedbackAnalyticsComponent projectId={projectId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>
                  Select a project to view its feedback analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 dark:text-slate-400">
                  No project selected. Please select a project from the projects
                  page.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="personal" className="mt-0">
          {user ? (
            <FeedbackAnalyticsComponent userId={user.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Personal Analytics</CardTitle>
                <CardDescription>
                  Sign in to view your personal feedback analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 dark:text-slate-400">
                  You need to be signed in to view your personal feedback
                  analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackAnalytics;
