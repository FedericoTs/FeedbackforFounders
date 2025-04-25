import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase/supabase";

interface FeedbackAnalyticsDashboardProps {
  projectId?: string;
  className?: string;
}

interface FeedbackAnalyticsData {
  feedbackVolume: { date: string; count: number }[];
  qualityDistribution: {
    excellent: number;
    good: number;
    average: number;
    basic: number;
  };
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryDistribution: {
    categoryId: string;
    categoryName: string;
    count: number;
  }[];
  topProviders: {
    userId: string;
    userName: string;
    count: number;
    averageQuality: number;
  }[];
  responseRate: number;
  averageResponseTime: number; // in hours
}

interface FeedbackAnalyticsFilters {
  projectId?: string;
  dateRange: { start: Date; end: Date };
  categoryIds?: string[];
  qualityThreshold?: number;
}

// Mock service for feedback analytics
const feedbackAnalyticsService = {
  getFeedbackAnalytics: async (
    filters: FeedbackAnalyticsFilters,
  ): Promise<FeedbackAnalyticsData> => {
    // In a real implementation, this would call the Supabase edge function
    // For now, we'll simulate the data with a delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      feedbackVolume: [
        { date: "2023-10-01", count: 5 },
        { date: "2023-10-08", count: 8 },
        { date: "2023-10-15", count: 12 },
        { date: "2023-10-22", count: 10 },
        { date: "2023-10-29", count: 15 },
        { date: "2023-11-05", count: 18 },
      ],
      qualityDistribution: {
        excellent: 42,
        good: 56,
        average: 18,
        basic: 12,
      },
      sentimentAnalysis: {
        positive: 68,
        neutral: 42,
        negative: 18,
      },
      categoryDistribution: [
        { categoryId: "1", categoryName: "UI/UX", count: 45 },
        { categoryId: "2", categoryName: "Performance", count: 32 },
        { categoryId: "3", categoryName: "Features", count: 28 },
        { categoryId: "4", categoryName: "Bugs", count: 15 },
        { categoryId: "5", categoryName: "Documentation", count: 8 },
      ],
      topProviders: [
        { userId: "1", userName: "John Doe", count: 12, averageQuality: 0.85 },
        {
          userId: "2",
          userName: "Jane Smith",
          count: 10,
          averageQuality: 0.92,
        },
        {
          userId: "3",
          userName: "Alex Johnson",
          count: 8,
          averageQuality: 0.78,
        },
        { userId: "4", userName: "Sam Wilson", count: 7, averageQuality: 0.81 },
        {
          userId: "5",
          userName: "Taylor Brown",
          count: 6,
          averageQuality: 0.73,
        },
      ],
      responseRate: 0.82,
      averageResponseTime: 14.5,
    };
  },

  getComparisonAnalytics: async (
    filters: FeedbackAnalyticsFilters,
    days: number,
  ): Promise<{
    previous: FeedbackAnalyticsData;
    changes: any;
  }> => {
    // In a real implementation, this would call the Supabase edge function
    // For now, we'll simulate the data with a delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const previousData: FeedbackAnalyticsData = {
      feedbackVolume: [
        { date: "2023-09-01", count: 4 },
        { date: "2023-09-08", count: 7 },
        { date: "2023-09-15", count: 9 },
        { date: "2023-09-22", count: 11 },
        { date: "2023-09-29", count: 13 },
      ],
      qualityDistribution: {
        excellent: 35,
        good: 48,
        average: 22,
        basic: 15,
      },
      sentimentAnalysis: {
        positive: 58,
        neutral: 45,
        negative: 22,
      },
      categoryDistribution: [
        { categoryId: "1", categoryName: "UI/UX", count: 38 },
        { categoryId: "2", categoryName: "Performance", count: 28 },
        { categoryId: "3", categoryName: "Features", count: 25 },
        { categoryId: "4", categoryName: "Bugs", count: 18 },
        { categoryId: "5", categoryName: "Documentation", count: 6 },
      ],
      topProviders: [
        { userId: "1", userName: "John Doe", count: 10, averageQuality: 0.82 },
        { userId: "2", userName: "Jane Smith", count: 9, averageQuality: 0.88 },
        {
          userId: "3",
          userName: "Alex Johnson",
          count: 7,
          averageQuality: 0.75,
        },
        { userId: "4", userName: "Sam Wilson", count: 6, averageQuality: 0.79 },
        {
          userId: "5",
          userName: "Taylor Brown",
          count: 5,
          averageQuality: 0.7,
        },
      ],
      responseRate: 0.75,
      averageResponseTime: 18.2,
    };

    // Calculate changes (simplified)
    const changes = {
      feedbackVolume: 0.15, // 15% increase
      qualityScore: 0.08, // 8% increase
      responseRate: 0.09, // 9% increase
      responseTime: -0.2, // 20% decrease (faster response time is good)
    };

    return { previous: previousData, changes };
  },

  exportToCsv: (data: FeedbackAnalyticsData, filename: string) => {
    console.log(`Exporting data to CSV: ${filename}`);
    // In a real implementation, this would generate and download a CSV file
  },

  exportToPdf: (data: FeedbackAnalyticsData, filename: string) => {
    console.log(`Exporting data to PDF: ${filename}`);
    // In a real implementation, this would generate and download a PDF file
  },
};

// Mock service for feedback categories
const feedbackCategoriesService = {
  getCategories: async (projectId?: string): Promise<any[]> => {
    // In a real implementation, this would fetch from Supabase
    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
      { id: "1", name: "UI/UX", color: "#8884d8" },
      { id: "2", name: "Performance", color: "#82ca9d" },
      { id: "3", name: "Features", color: "#ffc658" },
      { id: "4", name: "Bugs", color: "#ff8042" },
      { id: "5", name: "Documentation", color: "#0088fe" },
    ];
  },
};

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

        const data =
          await feedbackAnalyticsService.getFeedbackAnalytics(filters);
        setAnalyticsData(data);

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

  useEffect(() => {
    let start: Date;
    let end = new Date();

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
        end = endOfMonth(lastMonth);
        break;
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          start = customDateRange.from;
          end = customDateRange.to;
        } else {
          start = subDays(end, 30); // Default to 30 days if custom range is not set
        }
        break;
      default:
        start = subDays(end, 30);
    }

    setDateRange({ start, end });
  }, [dateRangeType, customDateRange]);

  const handleCustomDateSelect = (range: { from: Date; to: Date }) => {
    if (range.from && range.to) {
      setCustomDateRange(range);
      setShowCustomDatePicker(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
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

  const handleExport = (format: "csv" | "pdf") => {
    if (!analyticsData) return;

    const filename = `feedback-analytics-${format === "csv" ? "csv" : "pdf"}`;

    if (format === "csv") {
      feedbackAnalyticsService.exportToCsv(analyticsData, filename);
    } else {
      feedbackAnalyticsService.exportToPdf(analyticsData, filename);
    }
  };

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

  const getTotalFeedbackCount = () => {
    if (!analyticsData) return 0;

    return analyticsData.feedbackVolume.reduce(
      (sum, item) => sum + item.count,
      0,
    );
  };

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

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

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

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-7 w-1/2 mb-2" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-5 w-1/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analyticsData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-slate-500 text-sm font-medium mb-2">
                  Total Feedback
                </h3>
                <div className="text-3xl font-bold">
                  {getTotalFeedbackCount()}
                </div>
                {comparisonData && (
                  <div className="mt-2">
                    {formatChange(comparisonData.changes.feedbackVolume)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-slate-500 text-sm font-medium mb-2">
                  Quality Score
                </h3>
                <div className="text-3xl font-bold">
                  {(getAverageQualityScore() * 100).toFixed(0)}%
                </div>
                {comparisonData && (
                  <div className="mt-2">
                    {formatChange(comparisonData.changes.qualityScore)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-slate-500 text-sm font-medium mb-2">
                  Response Rate
                </h3>
                <div className="text-3xl font-bold">
                  {(analyticsData.responseRate * 100).toFixed(0)}%
                </div>
                {comparisonData && (
                  <div className="mt-2">
                    {formatChange(comparisonData.changes.responseRate)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-slate-500 text-sm font-medium mb-2">
                  Avg. Response Time
                </h3>
                <div className="text-3xl font-bold">
                  {analyticsData.averageResponseTime.toFixed(1)}h
                </div>
                {comparisonData && (
                  <div className="mt-2">
                    {formatChange(comparisonData.changes.responseTime)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No analytics data available.</p>
        </div>
      )}

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Target className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="trends">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="providers">
            <Users className="h-4 w-4 mr-2" />
            Providers
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyticsData ? (
          <>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2 text-teal-500" />
                      Feedback by Category
                    </CardTitle>
                    <CardDescription>
                      Distribution of feedback across categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categoryDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="categoryName"
                            label={({ categoryName, percent }) =>
                              `${categoryName}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {analyticsData.categoryDistribution.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} feedback items`,
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-teal-500" />
                      Feedback by Quality
                    </CardTitle>
                    <CardDescription>
                      Distribution of feedback by quality rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prepareQualityDistributionData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${value} items`, "Count"]}
                          />
                          <Bar dataKey="value" fill="#0088FE">
                            {prepareQualityDistributionData().map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ),
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <LineChartIcon className="h-5 w-5 mr-2 text-teal-500" />
                      Feedback Over Time
                    </CardTitle>
                    <CardDescription>
                      Trend of feedback submissions over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.feedbackVolume}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${value} items`, "Count"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#0088FE"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <ThumbsUp className="h-5 w-5 mr-2 text-teal-500" />
                      Sentiment Distribution
                    </CardTitle>
                    <CardDescription>
                      Distribution of feedback by sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareSentimentData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {prepareSentimentData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} feedback items`,
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2 text-teal-500" />
                    Detailed Category Analysis
                  </CardTitle>
                  <CardDescription>
                    In-depth analysis of feedback categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.categoryDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="categoryName"
                            label={({ categoryName, count }) =>
                              `${categoryName}: ${count}`
                            }
                          >
                            {analyticsData.categoryDistribution.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    CHART_COLORS[index % CHART_COLORS.length]
                                  }
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} feedback items`,
                              name,
                            ]}
                          />
                          <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Category Breakdown
                      </h3>
                      <div className="space-y-4">
                        {analyticsData.categoryDistribution.map(
                          (category, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <div
                                  className="h-3 w-3 rounded-full mr-2"
                                  style={{
                                    backgroundColor:
                                      CHART_COLORS[index % CHART_COLORS.length],
                                  }}
                                />
                                <span className="font-medium">
                                  {category.categoryName}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-slate-600 mr-2">
                                  {category.count} items
                                </span>
                                <Badge>
                                  {(
                                    (category.count / getTotalFeedbackCount()) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </Badge>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                      <Separator className="my-4" />
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Insights</h4>
                        <p className="text-sm text-slate-600">
                          The most common feedback category is{" "}
                          <span className="font-medium">
                            {
                              analyticsData.categoryDistribution[0]
                                ?.categoryName
                            }
                          </span>{" "}
                          with {analyticsData.categoryDistribution[0]?.count}{" "}
                          items (
                          {(
                            (analyticsData.categoryDistribution[0]?.count /
                              getTotalFeedbackCount()) *
                            100
                          ).toFixed(1)}
                          % of total).
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          Consider focusing improvement efforts on the top
                          categories to address the most common feedback areas.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Target className="h-5 w-5 mr-2 text-teal-500" />
                    Quality Metrics Analysis
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of feedback quality metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareQualityDistributionData()}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip
                            formatter={(value) => [`${value} items`, "Count"]}
                          />
                          <Bar dataKey="value" fill="#0088FE">
                            {prepareQualityDistributionData().map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ),
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Quality Distribution
                      </h3>
                      <div className="space-y-4">
                        {prepareQualityDistributionData().map(
                          (quality, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <div
                                  className="h-3 w-3 rounded-full mr-2"
                                  style={{ backgroundColor: quality.color }}
                                />
                                <span className="font-medium">
                                  {quality.name}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-slate-600 mr-2">
                                  {quality.value} items
                                </span>
                                <Badge>
                                  {(
                                    (quality.value / getTotalFeedbackCount()) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </Badge>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                      <Separator className="my-4" />
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Quality Insights</h4>
                        <p className="text-sm text-slate-600">
                          {(
                            ((analyticsData.qualityDistribution.excellent +
                              analyticsData.qualityDistribution.good) /
                              getTotalFeedbackCount()) *
                            100
                          ).toFixed(1)}
                          % of feedback is rated as Good or Excellent.
                        </p>
                        <p className="text-sm text-slate-600 mt-2">
                          The average quality score is{" "}
                          {(getAverageQualityScore() * 100).toFixed(1)}%, which
                          indicates overall{" "}
                          {getAverageQualityScore() > 0.75
                            ? "high"
                            : getAverageQualityScore() > 0.5
                              ? "moderate"
                              : "low"}{" "}
                          quality feedback.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <LineChartIcon className="h-5 w-5 mr-2 text-teal-500" />
                    Feedback Trends Over Time
                  </CardTitle>
                  <CardDescription>
                    Analysis of feedback patterns and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.feedbackVolume}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} items`, "Count"]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Feedback Count"
                          stroke="#0088FE"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Trend Analysis</h4>
                    <p className="text-sm text-slate-600">
                      Feedback volume has{" "}
                      {analyticsData.feedbackVolume[
                        analyticsData.feedbackVolume.length - 1
                      ].count > analyticsData.feedbackVolume[0].count
                        ? "increased"
                        : "decreased"}{" "}
                      over the selected time period.
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      The highest volume was recorded on{" "}
                      {
                        analyticsData.feedbackVolume.reduce(
                          (max, item) => (item.count > max.count ? item : max),
                          { count: 0, date: "" },
                        ).date
                      }{" "}
                      with{" "}
                      {
                        analyticsData.feedbackVolume.reduce(
                          (max, item) => (item.count > max.count ? item : max),
                          { count: 0, date: "" },
                        ).count
                      }{" "}
                      feedback items.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-teal-500" />
                    Top Feedback Providers
                  </CardTitle>
                  <CardDescription>
                    Users who provide the most valuable feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">
                            User
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">
                            Feedback Count
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">
                            Avg. Quality
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">
                            Quality Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.topProviders.map((provider, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                                  {provider.userName.charAt(0)}
                                </div>
                                <span className="font-medium">
                                  {provider.userName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{provider.count}</td>
                            <td className="py-3 px-4">
                              {(provider.averageQuality * 100).toFixed(0)}%
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  provider.averageQuality > 0.8
                                    ? "bg-emerald-100 text-emerald-700"
                                    : provider.averageQuality > 0.6
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                }
                              >
                                {provider.averageQuality > 0.8
                                  ? "Excellent"
                                  : provider.averageQuality > 0.6
                                    ? "Good"
                                    : "Average"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Provider Insights</h4>
                    <p className="text-sm text-slate-600">
                      Your top feedback provider is{" "}
                      {analyticsData.topProviders[0]?.userName} with{" "}
                      {analyticsData.topProviders[0]?.count} feedback
                      submissions and an average quality score of{" "}
                      {(
                        analyticsData.topProviders[0]?.averageQuality * 100
                      ).toFixed(0)}
                      %.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No analytics data available.
            </p>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default FeedbackAnalyticsDashboard;
