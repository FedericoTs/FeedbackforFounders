import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Calendar,
  Download,
  FileDown,
  Filter,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Users,
  MessageSquare,
  Clock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Target,
  ThumbsUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, startOfMonth, endOfMonth, isValid } from "date-fns";
import {
  feedbackAnalyticsService,
  FeedbackAnalyticsData,
  FeedbackAnalyticsFilters,
} from "@/services/feedbackAnalytics";
import { feedbackCategoriesService } from "@/services/feedbackCategories";
import { cn } from "@/lib/utils";

interface FeedbackAnalyticsDashboardProps {
  projectId?: string;
  className?: string;
}

const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
  "#d0ed57",
];

const QUALITY_COLORS = {
  excellent: "#22c55e", // green-500
  good: "#14b8a6", // teal-500
  average: "#f59e0b", // amber-500
  basic: "#64748b", // slate-500
};

const SENTIMENT_COLORS = {
  positive: "#22c55e", // green-500
  neutral: "#f59e0b", // amber-500
  negative: "#ef4444", // red-500
};

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "Custom range", value: "custom" },
];

const FeedbackAnalyticsDashboard: React.FC<FeedbackAnalyticsDashboardProps> = ({
  projectId,
  className,
}) => {
  const [analyticsData, setAnalyticsData] =
    useState<FeedbackAnalyticsData | null>(null);
  const [comparisonData, setComparisonData] = useState<{
    previous: FeedbackAnalyticsData;
    changes: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRangeType, setDateRangeType] = useState("30days");
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>(() => {
    const end = new Date();
    const start = subDays(end, 30);
    return { start, end };
  });
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [qualityThreshold, setQualityThreshold] = useState<number | null>(null);

  // Fetch analytics data based on filters
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const filters: FeedbackAnalyticsFilters = {
          projectId,
          dateRange,
        };

        if (selectedCategories.length > 0) {
          filters.categoryIds = selectedCategories;
        }

        if (qualityThreshold !== null) {
          filters.qualityThreshold = qualityThreshold;
        }

        // Get analytics data
        const data =
          await feedbackAnalyticsService.getFeedbackAnalytics(filters);
        setAnalyticsData(data);

        // Get comparison data
        const comparison =
          await feedbackAnalyticsService.getComparisonAnalytics(filters, 30);
        setComparisonData({
          previous: comparison.previous,
          changes: comparison.changes,
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectId, dateRange, selectedCategories, qualityThreshold]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData =
          await feedbackCategoriesService.getCategories(projectId);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [projectId]);

  // Update date range based on selection
  useEffect(() => {
    const end = new Date();
    let start;

    switch (dateRangeType) {
      case "7days":
        start = subDays(end, 7);
        break;
      case "30days":
        start = subDays(end, 30);
        break;
      case "90days":
        start = subDays(end, 90);
        break;
      case "thisMonth":
        start = startOfMonth(end);
        break;
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(end), 1);
        start = startOfMonth(lastMonth);
        end.setTime(endOfMonth(lastMonth).getTime());
        break;
      case "custom":
        if (
          customDateRange.from &&
          customDateRange.to &&
          isValid(customDateRange.from) &&
          isValid(customDateRange.to)
        ) {
          start = customDateRange.from;
          end = customDateRange.to;
        } else {
          setShowCustomDatePicker(true);
          return; // Don't update date range until custom range is selected
        }
        break;
      default:
        start = subDays(end, 30);
    }

    setDateRange({ start, end });
  }, [dateRangeType, customDateRange]);

  // Handle custom date range selection
  const handleCustomDateSelect = (range: { from: Date; to: Date }) => {
    if (range.from && range.to) {
      setCustomDateRange(range);
      setShowCustomDatePicker(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    // Re-fetch data with current filters
    const filters: FeedbackAnalyticsFilters = {
      projectId,
      dateRange,
    };

    if (selectedCategories.length > 0) {
      filters.categoryIds = selectedCategories;
    }

    if (qualityThreshold !== null) {
      filters.qualityThreshold = qualityThreshold;
    }

    Promise.all([
      feedbackAnalyticsService.getFeedbackAnalytics(filters),
      feedbackAnalyticsService.getComparisonAnalytics(filters, 30),
    ])
      .then(([data, comparison]) => {
        setAnalyticsData(data);
        setComparisonData({
          previous: comparison.previous,
          changes: comparison.changes,
        });
      })
      .catch((error) => {
        console.error("Error refreshing analytics data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle export
  const handleExport = (format: "csv" | "pdf") => {
    if (!analyticsData) return;

    const filename = `feedback-analytics-${format === "csv" ? "csv" : "pdf"}`;

    if (format === "csv") {
      feedbackAnalyticsService.exportToCsv(analyticsData, filename);
    } else {
      feedbackAnalyticsService.exportToPdf(analyticsData, filename);
    }
  };

  // Format percentage change with arrow
  const formatChange = (value: number) => {
    const formatted = (value * 100).toFixed(1);
    const isPositive = value > 0;
    const isNegative = value < 0;

    return (
      <span
        className={cn(
          "flex items-center",
          isPositive
            ? "text-green-500"
            : isNegative
              ? "text-red-500"
              : "text-gray-500",
        )}
      >
        {isPositive ? (
          <ChevronUp className="h-4 w-4 mr-1" />
        ) : isNegative ? (
          <ChevronDown className="h-4 w-4 mr-1" />
        ) : null}
        {isPositive ? "+" : ""}
        {formatted}%
      </span>
    );
  };

  // Prepare data for quality distribution chart
  const prepareQualityDistributionData = () => {
    if (!analyticsData) return [];

    return [
      {
        name: "Excellent",
        value: analyticsData.qualityDistribution.excellent,
        color: QUALITY_COLORS.excellent,
      },
      {
        name: "Good",
        value: analyticsData.qualityDistribution.good,
        color: QUALITY_COLORS.good,
      },
      {
        name: "Average",
        value: analyticsData.qualityDistribution.average,
        color: QUALITY_COLORS.average,
      },
      {
        name: "Basic",
        value: analyticsData.qualityDistribution.basic,
        color: QUALITY_COLORS.basic,
      },
    ];
  };

  // Prepare data for sentiment analysis chart
  const prepareSentimentData = () => {
    if (!analyticsData) return [];

    return [
      {
        name: "Positive",
        value: analyticsData.sentimentAnalysis.positive,
        color: SENTIMENT_COLORS.positive,
      },
      {
        name: "Neutral",
        value: analyticsData.sentimentAnalysis.neutral,
        color: SENTIMENT_COLORS.neutral,
      },
      {
        name: "Negative",
        value: analyticsData.sentimentAnalysis.negative,
        color: SENTIMENT_COLORS.negative,
      },
    ];
  };

  // Calculate total feedback count
  const getTotalFeedbackCount = () => {
    if (!analyticsData) return 0;

    return analyticsData.feedbackVolume.reduce(
      (sum, item) => sum + item.count,
      0,
    );
  };

  // Calculate average quality score
  const getAverageQualityScore = () => {
    if (!analyticsData) return 0;

    const { excellent, good, average, basic } =
      analyticsData.qualityDistribution;
    const total = excellent + good + average + basic;

    if (total === 0) return 0;

    return (excellent * 0.9 + good * 0.7 + average * 0.5 + basic * 0.3) / total;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feedback Analytics</h2>
          <p className="text-muted-foreground">
            {dateRange.start && dateRange.end
              ? `${format(dateRange.start, "MMM d, yyyy")} - ${format(
                  dateRange.end,
                  "MMM d, yyyy",
                )}`
              : "Loading date range..."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range selector */}
          <Select
            value={dateRangeType}
            onValueChange={(value) => {
              setDateRangeType(value);
              if (value === "custom") {
                setShowCustomDatePicker(true);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom date picker */}
          {dateRangeType === "custom" && (
            <Popover
              open={showCustomDatePicker}
              onOpenChange={setShowCustomDatePicker}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {customDateRange.from && customDateRange.to
                    ? `${format(customDateRange.from, "MMM d")} - ${format(
                        customDateRange.to,
                        "MMM d",
                      )}`
                    : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: customDateRange.from,
                    to: customDateRange.to,
                  }}
                  onSelect={(range: any) => handleCustomDateSelect(range)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Filter button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Options</h4>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Categories</h5>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`category-${category.id}`}
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([
                                  ...selectedCategories,
                                  category.id,
                                ]);
                              } else {
                                setSelectedCategories(
                                  selectedCategories.filter(
                                    (id) => id !== category.id,
                                  ),
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Quality Threshold</h5>
                  <Select
                    value={qualityThreshold?.toString() || ""}
                    onValueChange={(value) =>
                      setQualityThreshold(value ? parseFloat(value) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any quality</SelectItem>
                      <SelectItem value="0.8">Excellent (0.8+)</SelectItem>
                      <SelectItem value="0.6">Good (0.6+)</SelectItem>
                      <SelectItem value="0.4">Average (0.4+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories([]);
                      setQualityThreshold(null);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          {/* Export dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleExport("csv")}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleExport("pdf")}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Feedback */}
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Feedback
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">
                      {getTotalFeedbackCount()}
                    </h3>
                  )}
                </div>
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              {comparisonData && (
                <div className="mt-2 text-xs">
                  {formatChange(comparisonData.changes.feedbackVolume)}{" "}
                  <span className="text-muted-foreground">
                    vs previous period
                  </span>
                </div>
              )}
            </Card>

            {/* Average Quality */}
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Quality
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">
                      {(getAverageQualityScore() * 100).toFixed(1)}%
                    </h3>
                  )}
                </div>
                <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              {comparisonData && (
                <div className="mt-2 text-xs">
                  {formatChange(comparisonData.changes.qualityScore)}{" "}
                  <span className="text-muted-foreground">
                    vs previous period
                  </span>
                </div>
              )}
            </Card>

            {/* Response Rate */}
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Response Rate
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">
                      {(analyticsData?.responseRate || 0) * 100}%
                    </h3>
                  )}
                </div>
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <ThumbsUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              {comparisonData && (
                <div className="mt-2 text-xs">
                  {formatChange(comparisonData.changes.responseRate)}{" "}
                  <span className="text-muted-foreground">
                    vs previous period
                  </span>
                </div>
              )}
            </Card>

            {/* Response Time */}
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Response Time
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold">
                      {(analyticsData?.averageResponseTime || 0).toFixed(1)}h
                    </h3>
                  )}
                </div>
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              {comparisonData && (
                <div className="mt-2 text-xs">
                  {formatChange(-comparisonData.changes.responseTime)}{" "}
                  <span className="text-muted-foreground">
                    vs previous period
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Feedback Volume Over Time */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Feedback Volume</h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : analyticsData?.feedbackVolume.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={analyticsData.feedbackVolume}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [value, "Count"]}
                      labelFormatter={(date) =>
                        format(new Date(date), "MMMM d, yyyy")
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No feedback data available for this period
                </div>
              )}
            </Card>

            {/* Quality Distribution */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Quality Distribution</h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={prepareQualityDistributionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {prepareQualityDistributionData().map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ),
                          )}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    {prepareQualityDistributionData().map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm">{entry.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sentiment and Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sentiment Analysis */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Sentiment Analysis</h3>
              {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={prepareSentimentData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {prepareSentimentData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-2">
                    {prepareSentimentData().map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm">{entry.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Top Categories */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Top Categories</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : analyticsData?.categoryDistribution.length ? (
                <div className="space-y-3">
                  {analyticsData.categoryDistribution
                    .slice(0, 5)
                    .map((category, index) => {
                      const total = analyticsData.categoryDistribution.reduce(
                        (sum, cat) => sum + cat.count,
                        0,
                      );
                      const percentage = total
                        ? (category.count / total) * 100
                        : 0;

                      return (
                        <div
                          key={category.categoryId || index}
                          className="space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              {category.categoryName}
                            </span>
                            <span className="text-sm font-medium">
                              {category.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-2"
                            indicatorClassName={`bg-${CHART_COLORS[index % CHART_COLORS.length]}`}
                          />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quality Metrics */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Quality Metrics</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Specificity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">Specificity</span>
                      </div>
                      <span className="text-sm">
                        {getAverageMetric(analyticsData, "specificityScore")}
                      </span>
                    </div>
                    <Progress
                      value={
                        getAverageMetric(
                          analyticsData,
                          "specificityScore",
                          true,
                        ) * 100
                      }
                      className="h-2"
                      indicatorClassName="bg-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      How detailed and precise the feedback is
                    </p>
                  </div>

                  {/* Actionability */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                        <span className="font-medium">Actionability</span>
                      </div>
                      <span className="text-sm">
                        {getAverageMetric(analyticsData, "actionabilityScore")}
                      </span>
                    </div>
                    <Progress
                      value={
                        getAverageMetric(
                          analyticsData,
                          "actionabilityScore",
                          true,
                        ) * 100
                      }
                      className="h-2"
                      indicatorClassName="bg-green-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      How implementable the suggestions are
                    </p>
                  </div>

                  {/* Novelty */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="font-medium">Novelty</span>
                      </div>
                      <span className="text-sm">
                        {getAverageMetric(analyticsData, "noveltyScore")}
                      </span>
                    </div>
                    <Progress
                      value={
                        getAverageMetric(analyticsData, "noveltyScore", true) *
                        100
                      }
                      className="h-2"
                      indicatorClassName="bg-amber-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      How unique and valuable the insights are
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Quality Distribution */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Quality Distribution</h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={prepareQualityDistributionData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value">
                      {prepareQualityDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Quality Trends */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Quality Trends</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Quality trends visualization would be implemented here
              </div>
            )}
          </Card>

          {/* Quality Improvement Suggestions */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Quality Improvement Suggestions
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <h4 className="font-medium flex items-center">
                    <Target className="h-4 w-4 mr-2 text-blue-500" />
                    Improve Specificity
                  </h4>
                  <p className="text-sm mt-1">
                    Encourage feedback providers to include specific details,
                    examples, and context in their feedback. Consider adding
                    prompts or templates to guide users.
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <h4 className="font-medium flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-green-500" />
                    Enhance Actionability
                  </h4>
                  <p className="text-sm mt-1">
                    Ask users to provide specific suggestions for improvement
                    rather than just pointing out issues. Encourage them to
                    explain why their suggestions would be beneficial.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                  <h4 className="font-medium flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                    Boost Novelty
                  </h4>
                  <p className="text-sm mt-1">
                    Prompt users to consider different perspectives or use
                    cases. Highlight unique insights in feedback summaries to
                    encourage more creative thinking.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">
                Category Distribution
              </h3>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : analyticsData?.categoryDistribution.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="categoryName"
                      label={(entry) => entry.categoryName}
                    >
                      {analyticsData.categoryDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, "Count"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </Card>

            {/* Category Breakdown */}
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : analyticsData?.categoryDistribution.length ? (
                <div className="space-y-3">
                  {analyticsData.categoryDistribution.map((category, index) => {
                    const total = analyticsData.categoryDistribution.reduce(
                      (sum, cat) => sum + cat.count,
                      0,
                    );
                    const percentage = total
                      ? (category.count / total) * 100
                      : 0;

                    return (
                      <div
                        key={category.categoryId || index}
                        className="space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">
                            {category.categoryName}
                          </span>
                          <span className="text-sm font-medium">
                            {category.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                          indicatorClassName={`bg-${CHART_COLORS[index % CHART_COLORS.length]}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No category data available
                </div>
              )}
            </Card>
          </div>

          {/* Category Quality Comparison */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Category Quality Comparison
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : analyticsData?.categoryDistribution.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareCategoryQualityData(analyticsData)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    name="Average Quality"
                    dataKey="quality"
                    fill="#8884d8"
                  />
                  <Bar name="Count" dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </Card>

          {/* Category Trends */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Category Trends</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Category trends visualization would be implemented here
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4 pt-4">
          {/* Top Feedback Providers */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Top Feedback Providers</h3>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                ))}
              </div>
            ) : analyticsData?.topProviders.length ? (
              <div className="space-y-4">
                {analyticsData.topProviders.map((provider, index) => (
                  <div
                    key={provider.userId || index}
                    className="flex items-center space-x-4"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {provider.avatarUrl ? (
                        <img
                          src={provider.avatarUrl}
                          alt={provider.userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{provider.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        Quality: {(provider.averageQuality * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Badge className="ml-auto">
                      {provider.feedbackCount} feedback
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No provider data available
              </div>
            )}
          </Card>

          {/* Provider Quality Distribution */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">
              Provider Quality Distribution
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : analyticsData?.topProviders.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={prepareProviderQualityData(analyticsData)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value: any) => [
                      `${(value * 100).toFixed(1)}%`,
                      "Quality Score",
                    ]}
                  />
                  <Bar dataKey="quality" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No provider data available
              </div>
            )}
          </Card>

          {/* Provider Activity */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Provider Activity</h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Provider activity visualization would be implemented here
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to get average metric value
function getAverageMetric(
  data: FeedbackAnalyticsData | null,
  metric: "specificityScore" | "actionabilityScore" | "noveltyScore",
  rawValue = false,
): string | number {
  if (!data) return rawValue ? 0 : "0%";

  // This is a simplified version - in a real implementation, you would
  // calculate this from the actual feedback data
  const qualityDistribution = data.qualityDistribution;
  const total =
    qualityDistribution.excellent +
    qualityDistribution.good +
    qualityDistribution.average +
    qualityDistribution.basic;

  let value = 0;

  switch (metric) {
    case "specificityScore":
      value =
        (qualityDistribution.excellent * 0.9 +
          qualityDistribution.good * 0.7 +
          qualityDistribution.average * 0.5 +
          qualityDistribution.basic * 0.3) /
        (total || 1);
      break;
    case "actionabilityScore":
      value =
        (qualityDistribution.excellent * 0.85 +
          qualityDistribution.good * 0.65 +
          qualityDistribution.average * 0.45 +
          qualityDistribution.basic * 0.25) /
        (total || 1);
      break;
    case "noveltyScore":
      value =
        (qualityDistribution.excellent * 0.8 +
          qualityDistribution.good * 0.6 +
          qualityDistribution.average * 0.4 +
          qualityDistribution.basic * 0.2) /
        (total || 1);
      break;
  }

  return rawValue ? value : `${(value * 100).toFixed(1)}%`;
}

// Helper function to prepare category quality data
function prepareCategoryQualityData(data: FeedbackAnalyticsData | null) {
  if (!data || !data.categoryDistribution.length) return [];

  return data.categoryDistribution.map((category) => ({
    name: category.categoryName,
    quality: Math.random() * 0.5 + 0.3, // Placeholder - would use real data
    count: category.count,
  }));
}

// Helper function to prepare provider quality data
function prepareProviderQualityData(data: FeedbackAnalyticsData | null) {
  if (!data || !data.topProviders.length) return [];

  return data.topProviders
    .slice(0, 10)
    .map((provider) => ({
      name: provider.userName,
      quality: provider.averageQuality,
    }))
    .sort((a, b) => b.quality - a.quality);
}

export default FeedbackAnalyticsDashboard;
