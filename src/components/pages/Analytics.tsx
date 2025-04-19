import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  LineChart,
  MessageSquare,
  PieChart,
  Star,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";

// Mock analytics data
const mockAnalytics = {
  overview: {
    projectsCreated: 8,
    feedbackReceived: 48,
    feedbackGiven: 32,
    pointsEarned: 750,
    pointsChange: 120,
    feedbackChange: 8,
  },
  feedbackQuality: {
    average: 4.2,
    distribution: [2, 5, 10, 18, 13],
    sentiment: {
      positive: 65,
      neutral: 25,
      negative: 10,
    },
  },
  engagement: {
    weeklyActivity: [12, 18, 15, 22, 30, 25, 20],
    responseTime: {
      average: "1.5 days",
      trend: "decreasing",
    },
    topContributors: [
      { name: "Alex Rivera", avatar: "alex", contributions: 15 },
      { name: "Emma Wilson", avatar: "emma", contributions: 12 },
      { name: "Michael Chen", avatar: "michael", contributions: 10 },
    ],
  },
  projects: {
    mostFeedback: [
      { name: "E-commerce Website", count: 18, category: "Web Design" },
      { name: "Fitness App", count: 12, category: "Mobile App" },
      { name: "SaaS Dashboard", count: 10, category: "Web App" },
    ],
    categoryBreakdown: [
      { category: "Web Design", count: 3 },
      { category: "Mobile App", count: 2 },
      { category: "Branding", count: 2 },
      { category: "UI/UX", count: 1 },
    ],
  },
};

// Bar Chart Component
const BarChartComponent = ({ data, labels, height = 200 }) => {
  const maxValue = Math.max(...data);

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="flex h-full">
        {data.map((value, index) => {
          const percentage = (value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end flex-1 gap-2"
            >
              <div className="relative w-full px-1">
                <div
                  className="w-full bg-teal-500 dark:bg-teal-600 rounded-t-sm"
                  style={{ height: `${percentage}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {value}
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {labels[index]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Chart Component
const LineChartComponent = ({ data, labels, height = 200 }) => {
  const maxValue = Math.max(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="relative h-full">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (value / maxValue) * 100;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="#14b8a6"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between">
          {labels.map((label, index) => (
            <div
              key={index}
              className="text-xs text-slate-500 dark:text-slate-400"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pie Chart Component
const PieChartComponent = ({ data, labels, colors }) => {
  const total = data.reduce((acc, curr) => acc + curr, 0);
  let cumulativePercentage = 0;

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((value, index) => {
            const percentage = (value / total) * 100;
            const startAngle = cumulativePercentage * 3.6; // 3.6 = 360 / 100
            cumulativePercentage += percentage;
            const endAngle = cumulativePercentage * 3.6;

            // Calculate the SVG arc path
            const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index]}
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      <div className="ml-6 space-y-2">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors[index] }}
            ></div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              {label} ({Math.round((data[index] / total) * 100)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("month");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your feedback performance and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {timeRange === "week"
                  ? "This Week"
                  : timeRange === "month"
                    ? "This Month"
                    : "All Time"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Projects Created
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {mockAnalytics.overview.projectsCreated}
                </h3>
              </div>
              <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                <BarChart className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Feedback Received
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mockAnalytics.overview.feedbackReceived}
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />
                    {mockAnalytics.overview.feedbackChange}
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Points Earned
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mockAnalytics.overview.pointsEarned}
                  </h3>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />
                    {mockAnalytics.overview.pointsChange}
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Feedback Given
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {mockAnalytics.overview.feedbackGiven}
                </h3>
              </div>
              <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                <ThumbsUp className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Feedback Quality */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Feedback Quality
            </CardTitle>
            <CardDescription>
              Analysis of the feedback you've received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {mockAnalytics.feedbackQuality.average}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Average Rating
                </div>
              </div>
              <div className="h-12 border-r border-slate-200 dark:border-slate-700"></div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(mockAnalytics.feedbackQuality.average) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                Rating Distribution
              </h4>
              <BarChartComponent
                data={mockAnalytics.feedbackQuality.distribution}
                labels={["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"]}
                height={150}
              />
            </div>

            <Separator className="my-6" />

            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                Feedback Sentiment
              </h4>
              <PieChartComponent
                data={[
                  mockAnalytics.feedbackQuality.sentiment.positive,
                  mockAnalytics.feedbackQuality.sentiment.neutral,
                  mockAnalytics.feedbackQuality.sentiment.negative,
                ]}
                labels={["Positive", "Neutral", "Negative"]}
                colors={["#10b981", "#6366f1", "#ef4444"]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Engagement Metrics
            </CardTitle>
            <CardDescription>
              How users are interacting with your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                  Weekly Activity
                </h4>
                <LineChartComponent
                  data={mockAnalytics.engagement.weeklyActivity}
                  labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                  height={150}
                />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                  Response Time
                </h4>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {mockAnalytics.engagement.responseTime.average}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Average Response
                    </div>
                  </div>
                  <Badge
                    className={`${mockAnalytics.engagement.responseTime.trend === "decreasing" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"}`}
                  >
                    {mockAnalytics.engagement.responseTime.trend ===
                    "decreasing" ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" /> Improving
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" /> Slowing
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                  Top Contributors
                </h4>
                <div className="space-y-3">
                  {mockAnalytics.engagement.topContributors.map(
                    (contributor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contributor.avatar}`}
                            />
                            <AvatarFallback>
                              {contributor.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {contributor.name}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {contributor.contributions} contributions
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Projects with Most Feedback */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Projects with Most Feedback
            </CardTitle>
            <CardDescription>
              Your most engaging projects by feedback count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.projects.mostFeedback.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {project.category}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                      {project.count} feedback
                    </Badge>
                  </div>
                  <Progress
                    value={
                      (project.count /
                        Math.max(
                          ...mockAnalytics.projects.mostFeedback.map(
                            (p) => p.count,
                          ),
                        )) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Category Breakdown */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Project Category Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of your projects by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <PieChartComponent
                data={mockAnalytics.projects.categoryBreakdown.map(
                  (item) => item.count,
                )}
                labels={mockAnalytics.projects.categoryBreakdown.map(
                  (item) => item.category,
                )}
                colors={["#14b8a6", "#06b6d4", "#f59e0b", "#f43f5e"]}
              />
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              {mockAnalytics.projects.categoryBreakdown.map(
                (category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor: [
                            "#14b8a6",
                            "#06b6d4",
                            "#f59e0b",
                            "#f43f5e",
                          ][index],
                        }}
                      ></div>
                      <div className="text-sm text-slate-900 dark:text-white">
                        {category.category}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {category.count} projects
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
