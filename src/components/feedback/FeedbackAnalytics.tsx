import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Award,
  BarChart2,
  Calendar,
  ChevronUp,
  Clock,
  ListFilter,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  feedbackAnalyticsService,
  FeedbackAnalytics,
} from "@/services/feedbackAnalytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackAnalyticsProps {
  projectId?: string;
  userId?: string;
  className?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const FeedbackAnalyticsComponent: React.FC<FeedbackAnalyticsProps> = ({
  projectId,
  userId,
  className,
}) => {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">(
    "month",
  );
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await feedbackAnalyticsService.getFeedbackAnalytics({
          projectId,
          userId,
          timeframe,
        });
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching feedback analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId, userId, timeframe]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">
              Loading analytics...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <BarChart2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              No analytics available
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              There isn't enough feedback data to generate analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const qualityDistributionData = [
    {
      name: "Excellent",
      value: analytics.qualityDistribution.excellent,
      color: "#10B981",
    },
    {
      name: "Good",
      value: analytics.qualityDistribution.good,
      color: "#0EA5E9",
    },
    {
      name: "Average",
      value: analytics.qualityDistribution.average,
      color: "#F59E0B",
    },
    {
      name: "Basic",
      value: analytics.qualityDistribution.basic,
      color: "#6B7280",
    },
  ];

  const categoryData = analytics.topCategories.map((category, index) => ({
    ...category,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Feedback Analytics</CardTitle>
            <CardDescription>
              {projectId
                ? "Insights from feedback received on this project"
                : "Overview of your feedback contributions"}
            </CardDescription>
          </div>
          <Select
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as any)}
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-teal-500" />
              <h3 className="text-sm font-medium">Total Feedback</h3>
            </div>
            <p className="text-2xl font-bold">{analytics.totalFeedback}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-medium">Average Quality</h3>
            </div>
            <p className="text-2xl font-bold">
              {(analytics.averageQuality * 100).toFixed(0)}%
            </p>
            <div className="mt-2">
              <Progress
                value={analytics.averageQuality * 100}
                className="h-2"
              />
            </div>
          </div>

          {analytics.userPerformance ? (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-purple-500" />
                <h3 className="text-sm font-medium">Your Rank</h3>
              </div>
              <p className="text-2xl font-bold">
                #{analytics.userPerformance.rank}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Top {analytics.userPerformance.percentile.toFixed(0)}%
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="text-sm font-medium">Quality Trend</h3>
              </div>
              <div className="h-12">
                {analytics.qualityTrend.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.qualityTrend.slice(-7)}>
                      <Line
                        type="monotone"
                        dataKey="averageQuality"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Not enough data
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="quality">
          <TabsList className="mb-4">
            <TabsTrigger value="quality">
              <Star className="h-4 w-4 mr-2" /> Quality Distribution
            </TabsTrigger>
            <TabsTrigger value="categories">
              <ListFilter className="h-4 w-4 mr-2" /> Top Categories
            </TabsTrigger>
            {analytics.qualityTrend.length > 1 && (
              <TabsTrigger value="trend">
                <TrendingUp className="h-4 w-4 mr-2" /> Quality Trend
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="quality" className="mt-0">
            <div className="h-[300px]">
              {qualityDistributionData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {qualityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No quality data available
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {qualityDistributionData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-md"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="ml-auto text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0EA5E9">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No category data available
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Top Categories</h4>
              <div className="space-y-2">
                {categoryData.length > 0 ? (
                  categoryData.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm">{category.category}</span>
                      </div>
                      <Badge variant="outline">{category.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No categories found
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {analytics.qualityTrend.length > 1 && (
            <TabsContent value="trend" className="mt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.qualityTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip
                      formatter={(value) => [
                        (value * 100).toFixed(0) + "%",
                        "Quality",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="averageQuality"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Quality Over Time</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This chart shows how feedback quality has changed over time.
                  Higher percentages indicate more specific, actionable, and
                  novel feedback.
                </p>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {analytics.userPerformance && (
          <>
            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium mb-4">Your Performance</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h4 className="text-sm font-medium">Feedback Given</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {analytics.userPerformance.totalFeedbackGiven}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <h4 className="text-sm font-medium">Points Earned</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {analytics.userPerformance.pointsEarned}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <h4 className="text-sm font-medium">Percentile Rank</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {analytics.userPerformance.percentile.toFixed(0)}%
                    </p>
                    <div className="flex items-center text-green-500 text-sm">
                      <ChevronUp className="h-4 w-4" />
                      <span>
                        Top{" "}
                        {100 - Math.round(analytics.userPerformance.percentile)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackAnalyticsComponent;
