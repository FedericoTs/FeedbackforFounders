import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart2,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";

interface ProjectAnalyticsProps {
  projectId: string;
  isExpanded?: boolean;
}

interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

interface VisitorStats {
  total: number;
  unique: number;
  returning: number;
  averageDuration: number;
}

interface PromotionStats {
  active: boolean;
  pointsAllocated: number;
  startDate: string;
  endDate: string;
  estimatedReach: number;
  actualReach: number;
  daysRemaining: number;
}

const ProjectAnalyticsPanel = ({
  projectId,
  isExpanded = false,
}: ProjectAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
  });
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    total: 0,
    unique: 0,
    returning: 0,
    averageDuration: 0,
  });
  const [promotionStats, setPromotionStats] = useState<PromotionStats | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchAnalyticsData();
    }
  }, [projectId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch feedback statistics
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("project_feedback")
        .select("count")
        .eq("project_id", projectId)
        .single();

      const { data: sentimentData, error: sentimentError } = await supabase
        .from("project_feedback_sentiment")
        .select("positive, negative, neutral")
        .eq("project_id", projectId)
        .single();

      if (!feedbackError && feedbackData && !sentimentError && sentimentData) {
        setFeedbackStats({
          total: feedbackData.count || 0,
          positive: sentimentData.positive || 0,
          negative: sentimentData.negative || 0,
          neutral: sentimentData.neutral || 0,
        });
      }

      // Fetch visitor statistics (simulated for now)
      // In a real implementation, this would come from an analytics service
      setVisitorStats({
        total: Math.floor(Math.random() * 500) + 50,
        unique: Math.floor(Math.random() * 300) + 30,
        returning: Math.floor(Math.random() * 100) + 10,
        averageDuration: Math.floor(Math.random() * 180) + 30, // seconds
      });

      // Fetch active promotion if any
      const { data: promotionData, error: promotionError } = await supabase
        .from("project_promotions")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!promotionError && promotionData) {
        const startDate = new Date(promotionData.start_date);
        const endDate = new Date(promotionData.end_date);
        const now = new Date();
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

        setPromotionStats({
          active: true,
          pointsAllocated: promotionData.points_allocated,
          startDate: promotionData.start_date,
          endDate: promotionData.end_date,
          estimatedReach: promotionData.estimated_reach,
          actualReach: Math.floor(
            promotionData.estimated_reach * (Math.random() * 0.4 + 0.8),
          ), // Simulated
          daysRemaining,
        });
      } else {
        setPromotionStats(null);
      }

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from("project_activity")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!activityError && activityData) {
        setRecentActivity(activityData);
      } else {
        // If no real activity data, create some sample data
        setRecentActivity([
          {
            id: 1,
            project_id: projectId,
            activity_type: "feedback_received",
            description: "New feedback received from user",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: 2,
            project_id: projectId,
            activity_type: "view",
            description: "Project viewed by 5 new users",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          },
          {
            id: 3,
            project_id: projectId,
            activity_type: "promotion_started",
            description: "Project promotion started",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2,
            ).toISOString(), // 2 days ago
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // For compact view (used in project cards)
  if (!isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{feedbackStats.total} feedback</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{visitorStats.unique} visitors</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>Feedback sentiment</span>
              <span>
                {feedbackStats.total > 0
                  ? Math.round(
                      (feedbackStats.positive / feedbackStats.total) * 100,
                    )
                  : 0}
                % positive
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div
                className="bg-emerald-500"
                style={{
                  width: `${
                    feedbackStats.total > 0
                      ? (feedbackStats.positive / feedbackStats.total) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-amber-500"
                style={{
                  width: `${
                    feedbackStats.total > 0
                      ? (feedbackStats.neutral / feedbackStats.total) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-rose-500"
                style={{
                  width: `${
                    feedbackStats.total > 0
                      ? (feedbackStats.negative / feedbackStats.total) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-teal-600 dark:text-teal-400"
        >
          View detailed analytics
        </Button>
      </div>
    );
  }

  // Full expanded view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Project Analytics</h2>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Last 30 days
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{feedbackStats.total}</div>
              <Badge className="bg-teal-100 text-teal-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                12%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{visitorStats.unique}</div>
              <Badge className="bg-teal-100 text-teal-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                8%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Avg. Time on Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">
                {formatTime(visitorStats.averageDuration)}
              </div>
              <Badge className="bg-rose-100 text-rose-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                -3%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Sentiment</CardTitle>
              <CardDescription>
                Breakdown of feedback sentiment over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                    <span>Positive</span>
                  </div>
                  <span className="font-medium">{feedbackStats.positive}</span>
                  <span>
                    {feedbackStats.total > 0
                      ? Math.round(
                          (feedbackStats.positive / feedbackStats.total) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <Progress
                    value={
                      feedbackStats.total > 0
                        ? (feedbackStats.positive / feedbackStats.total) * 100
                        : 0
                    }
                    className="w-1/3 h-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                    <span>Neutral</span>
                  </div>
                  <span className="font-medium">{feedbackStats.neutral}</span>
                  <span>
                    {feedbackStats.total > 0
                      ? Math.round(
                          (feedbackStats.neutral / feedbackStats.total) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <Progress
                    value={
                      feedbackStats.total > 0
                        ? (feedbackStats.neutral / feedbackStats.total) * 100
                        : 0
                    }
                    className="w-1/3 h-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
                    <span>Negative</span>
                  </div>
                  <span className="font-medium">{feedbackStats.negative}</span>
                  <span>
                    {feedbackStats.total > 0
                      ? Math.round(
                          (feedbackStats.negative / feedbackStats.total) * 100,
                        )
                      : 0}
                    %
                  </span>
                  <Progress
                    value={
                      feedbackStats.total > 0
                        ? (feedbackStats.negative / feedbackStats.total) * 100
                        : 0
                    }
                    className="w-1/3 h-2"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium mb-4">Recent Activity</h4>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                      >
                        <div className="mt-0.5">
                          {activity.activity_type === "feedback_received" ? (
                            <MessageSquare className="h-4 w-4 text-teal-500" />
                          ) : activity.activity_type === "view" ? (
                            <Users className="h-4 w-4 text-blue-500" />
                          ) : (
                            <BarChart2 className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">
                              {activity.description}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatDate(activity.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No recent activity to display
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {promotionStats && (
            <Card>
              <CardHeader>
                <CardTitle>Active Promotion</CardTitle>
                <CardDescription>
                  Your project is currently being promoted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Points allocated:</span>
                    <Badge className="bg-amber-100 text-amber-700">
                      {promotionStats.pointsAllocated} points
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Duration:</span>
                    <span className="text-sm">
                      {formatDate(promotionStats.startDate)} to{" "}
                      {formatDate(promotionStats.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time remaining:</span>
                    <Badge
                      className={`${
                        promotionStats.daysRemaining > 5
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {promotionStats.daysRemaining} days left
                    </Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Estimated reach:</span>
                      <span className="font-medium">
                        {promotionStats.estimatedReach} users
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Actual reach so far:</span>
                      <span className="font-medium">
                        {promotionStats.actualReach} users
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Progress:</span>
                      <span className="font-medium">
                        {Math.round(
                          (promotionStats.actualReach /
                            promotionStats.estimatedReach) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (promotionStats.actualReach /
                          promotionStats.estimatedReach) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of feedback received
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Detailed feedback charts coming soon
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  We're working on more detailed feedback analytics. Check back
                  soon!
                </p>
                <Button className="mt-4" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View all feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of visitor activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Detailed visitor analytics coming soon
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  We're working on more detailed visitor analytics. Check back
                  soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Promotion History</CardTitle>
              <CardDescription>
                History of all your project promotions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {promotionStats ? (
                <div className="space-y-4">
                  <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge className="bg-emerald-100 text-emerald-700 mb-2">
                          Active
                        </Badge>
                        <h4 className="font-medium">Current Promotion</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Started on {formatDate(promotionStats.startDate)}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        {promotionStats.pointsAllocated} points
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span>
                          {promotionStats.actualReach} of{" "}
                          {promotionStats.estimatedReach} users reached
                        </span>
                      </div>
                      <Progress
                        value={
                          (promotionStats.actualReach /
                            promotionStats.estimatedReach) *
                          100
                        }
                        className="h-2 mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        {promotionStats.daysRemaining} days remaining
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">
                      No previous promotions found
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No promotions yet
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    You haven't promoted this project yet. Promote your project
                    to increase visibility and get more feedback.
                  </p>
                  <Button className="mt-4">Promote this project</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalyticsPanel;
