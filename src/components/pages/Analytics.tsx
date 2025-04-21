import React, { useState, useEffect } from "react";
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
  Filter,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { feedbackService } from "@/services/feedback";

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

// Implementation Status Component
const ImplementationStatusCard = ({ stats }) => {
  const statusColors = {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
    implemented:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
    declined:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400",
    considered:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
  };

  const statusIcons = {
    pending: <Clock3 className="h-4 w-4 mr-1" />,
    planned: <CheckCircle2 className="h-4 w-4 mr-1" />,
    implemented: <CheckCircle2 className="h-4 w-4 mr-1" />,
    declined: <XCircle className="h-4 w-4 mr-1" />,
    considered: <AlertCircle className="h-4 w-4 mr-1" />,
  };

  const statuses = Object.keys(stats.by_implementation_status || {});

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
          Implementation Status
        </CardTitle>
        <CardDescription>
          Current status of feedback implementation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statuses.length > 0 ? (
            statuses.map((status) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[status]}>
                      <div className="flex items-center">
                        {statusIcons[status]}
                        <span className="capitalize">{status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stats.by_implementation_status[status]} items
                  </div>
                </div>
                <Progress
                  value={
                    (stats.by_implementation_status[status] / stats.total) * 100
                  }
                  className="h-2"
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No implementation status data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Feedback Category Breakdown Component
const FeedbackCategoryCard = ({ stats }) => {
  const categories = Object.keys(stats.by_category || {});
  const categoryColors = [
    "#14b8a6",
    "#06b6d4",
    "#f59e0b",
    "#f43f5e",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
          Feedback Categories
        </CardTitle>
        <CardDescription>Distribution of feedback by category</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <>
            <div className="flex items-center justify-center py-6">
              <PieChartComponent
                data={categories.map((cat) => stats.by_category[cat])}
                labels={categories}
                colors={categoryColors.slice(0, categories.length)}
              />
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor:
                          categoryColors[index % categoryColors.length],
                      }}
                    ></div>
                    <div className="text-sm text-slate-900 dark:text-white">
                      {category}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {stats.by_category[category]} items
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No category data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Feedback Severity Breakdown Component
const FeedbackSeverityCard = ({ stats }) => {
  const severities = Object.keys(stats.by_severity || {})
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
          Feedback Severity
        </CardTitle>
        <CardDescription>
          Distribution of feedback by severity level
        </CardDescription>
      </CardHeader>
      <CardContent>
        {severities.length > 0 ? (
          <BarChartComponent
            data={severities.map((sev) => stats.by_severity[sev])}
            labels={severities.map((sev) => `Level ${sev}`)}
            height={200}
          />
        ) : (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No severity data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [timeRangeMenuOpen, setTimeRangeMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [projectStats, setProjectStats] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    by_category: {},
    by_severity: {},
    by_implementation_status: {},
  });
  const [timeBasedTrends, setTimeBasedTrends] = useState({
    daily: [] as { date: string; count: number }[],
    weekly: [] as { date: string; count: number }[],
    monthly: [] as { date: string; count: number }[],
  });
  const { user } = useAuth();

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

  // Fetch feedback stats
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch user's projects
        const { data: projects } = await supabase
          .from("projects")
          .select("id, title, category")
          .eq("user_id", user.id);

        // Fetch feedback stats for each project with time range filter
        const projectsWithStats = await Promise.all(
          projects.map(async (project) => {
            const stats = await feedbackService.getProjectFeedbackStats(
              project.id,
              timeRange,
            );
            return {
              ...project,
              stats,
            };
          }),
        );

        // Fetch time-based trends
        try {
          const trends = await feedbackService.getFeedbackTimeTrends(
            projects.map((p) => p.id),
          );
          setTimeBasedTrends(trends);
        } catch (trendsError) {
          console.error("Error fetching time-based trends:", trendsError);
        }

        setProjectStats(projectsWithStats);

        // Aggregate stats across all projects
        const aggregatedStats = projectsWithStats.reduce(
          (acc, project) => {
            acc.total += project.stats.total;
            acc.positive += project.stats.positive;
            acc.negative += project.stats.negative;
            acc.neutral += project.stats.neutral;

            // Aggregate by category
            Object.entries(project.stats.by_category).forEach(
              ([category, count]) => {
                acc.by_category[category] =
                  (acc.by_category[category] || 0) + count;
              },
            );

            // Aggregate by severity
            Object.entries(project.stats.by_severity).forEach(
              ([severity, count]) => {
                acc.by_severity[severity] =
                  (acc.by_severity[severity] || 0) + count;
              },
            );

            // Aggregate by implementation status
            Object.entries(project.stats.by_implementation_status).forEach(
              ([status, count]) => {
                acc.by_implementation_status[status] =
                  (acc.by_implementation_status[status] || 0) + count;
              },
            );

            return acc;
          },
          {
            total: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            by_category: {},
            by_severity: {},
            by_implementation_status: {},
          },
        );

        setFeedbackStats(aggregatedStats);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, timeRange]);

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
          <div className="flex items-center gap-2 relative">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => setTimeRangeMenuOpen(!timeRangeMenuOpen)}
            >
              <Calendar className="h-4 w-4" />
              <span>
                {timeRange === "week"
                  ? "This Week"
                  : timeRange === "month"
                    ? "This Month"
                    : timeRange === "quarter"
                      ? "This Quarter"
                      : "All Time"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {timeRangeMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-10">
                <div className="p-1">
                  <button
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${timeRange === "week" ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    onClick={() => {
                      setTimeRange("week");
                      setTimeRangeMenuOpen(false);
                    }}
                  >
                    This Week
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${timeRange === "month" ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    onClick={() => {
                      setTimeRange("month");
                      setTimeRangeMenuOpen(false);
                    }}
                  >
                    This Month
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${timeRange === "quarter" ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    onClick={() => {
                      setTimeRange("quarter");
                      setTimeRangeMenuOpen(false);
                    }}
                  >
                    This Quarter
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${timeRange === "all" ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    onClick={() => {
                      setTimeRange("all");
                      setTimeRangeMenuOpen(false);
                    }}
                  >
                    All Time
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => {
              if (feedbackStats.total > 0) {
                import("@/utils/exportData").then(({ downloadJSON }) => {
                  downloadJSON(
                    feedbackStats,
                    `analytics-export-${new Date().toISOString().split("T")[0]}.json`,
                  );
                });
              }
            }}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
                      {projectStats.length}
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
                        {feedbackStats.total}
                      </h3>
                      {feedbackStats.total > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center gap-1">
                          <ChevronUp className="h-3 w-3" />
                          New
                        </Badge>
                      )}
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
                      Positive Feedback
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {feedbackStats.positive}
                      </h3>
                      {feedbackStats.total > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                          {Math.round(
                            (feedbackStats.positive / feedbackStats.total) *
                              100,
                          )}
                          %
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <ThumbsUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Implementation Rate
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {feedbackStats.total > 0
                        ? Math.round(
                            ((feedbackStats.by_implementation_status
                              ?.implemented || 0) /
                              feedbackStats.total) *
                              100,
                          )
                        : 0}
                      %
                    </h3>
                  </div>
                  <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />
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
                  Feedback Sentiment
                </CardTitle>
                <CardDescription>
                  Analysis of the feedback you've received
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
                  </div>
                ) : feedbackStats.total > 0 ? (
                  <div>
                    <PieChartComponent
                      data={[
                        feedbackStats.positive,
                        feedbackStats.neutral,
                        feedbackStats.negative,
                      ]}
                      labels={["Positive", "Neutral", "Negative"]}
                      colors={["#10b981", "#6366f1", "#ef4444"]}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No feedback data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Trends Over Time */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Feedback Trends Over Time
                </CardTitle>
                <CardDescription>
                  How feedback volume has changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                        {timeRange === "week"
                          ? "Daily"
                          : timeRange === "month"
                            ? "Weekly"
                            : "Monthly"}{" "}
                        Trends
                      </h4>
                      <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                        {timeBasedTrends.daily.length > 0
                          ? "Live Data"
                          : "Sample Data"}
                      </Badge>
                    </div>

                    {timeBasedTrends.daily.length > 0 ? (
                      timeRange === "week" ? (
                        <LineChartComponent
                          data={timeBasedTrends.daily
                            .slice(-7)
                            .map((item) => item.count)}
                          labels={timeBasedTrends.daily
                            .slice(-7)
                            .map((item) => {
                              const date = new Date(item.date);
                              return date.toLocaleDateString("en-US", {
                                weekday: "short",
                              });
                            })}
                          height={150}
                        />
                      ) : timeRange === "month" ? (
                        <LineChartComponent
                          data={timeBasedTrends.weekly
                            .slice(-4)
                            .map((item) => item.count)}
                          labels={timeBasedTrends.weekly
                            .slice(-4)
                            .map((item) => {
                              const date = new Date(item.date);
                              return `Week ${date.getDate() <= 7 ? "1" : date.getDate() <= 14 ? "2" : date.getDate() <= 21 ? "3" : "4"}`;
                            })}
                          height={150}
                        />
                      ) : (
                        <LineChartComponent
                          data={timeBasedTrends.monthly
                            .slice(-6)
                            .map((item) => item.count)}
                          labels={timeBasedTrends.monthly
                            .slice(-6)
                            .map((item) => {
                              const date = new Date(item.date);
                              return date.toLocaleDateString("en-US", {
                                month: "short",
                              });
                            })}
                          height={150}
                        />
                      )
                    ) : (
                      <LineChartComponent
                        data={[5, 8, 12, 10, 15, 18, 14]}
                        labels={[
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ]}
                        height={150}
                      />
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                      Feedback Growth Rate
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {timeBasedTrends.weekly.length > 1
                            ? `${Math.round(
                                (timeBasedTrends.weekly[
                                  timeBasedTrends.weekly.length - 1
                                ].count /
                                  Math.max(
                                    1,
                                    timeBasedTrends.weekly[
                                      timeBasedTrends.weekly.length - 2
                                    ].count,
                                  ) -
                                  1) *
                                  100,
                              )}%`
                            : "+15%"}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Week-over-Week
                        </div>
                      </div>
                      <Badge
                        className={`${
                          timeBasedTrends.weekly.length > 1 &&
                          timeBasedTrends.weekly[
                            timeBasedTrends.weekly.length - 1
                          ].count >
                            timeBasedTrends.weekly[
                              timeBasedTrends.weekly.length - 2
                            ].count
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        }`}
                      >
                        {timeBasedTrends.weekly.length > 1 &&
                        timeBasedTrends.weekly[
                          timeBasedTrends.weekly.length - 1
                        ].count >
                          timeBasedTrends.weekly[
                            timeBasedTrends.weekly.length - 2
                          ].count ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" /> Increasing
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" /> Decreasing
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Feedback Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <FeedbackCategoryCard stats={feedbackStats} />
                <FeedbackSeverityCard stats={feedbackStats} />
                <ImplementationStatusCard stats={feedbackStats} />
              </div>

              {/* Projects with Most Feedback */}
              <Card className="bg-white dark:bg-slate-800 shadow-sm mb-8">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Projects with Most Feedback
                  </CardTitle>
                  <CardDescription>
                    Your most engaging projects by feedback count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projectStats.length > 0 ? (
                    <div className="space-y-4">
                      {projectStats
                        .sort((a, b) => b.stats.total - a.stats.total)
                        .slice(0, 5)
                        .map((project, index) => (
                          <div key={project.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {project.title}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {project.category}
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                                {project.stats.total} feedback
                              </Badge>
                            </div>
                            <Progress
                              value={
                                (project.stats.total /
                                  Math.max(
                                    ...projectStats.map((p) => p.stats.total),
                                    1,
                                  )) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No project data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="projects">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
