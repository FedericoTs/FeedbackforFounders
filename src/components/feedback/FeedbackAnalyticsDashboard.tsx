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
    const end = new Date();
    const endDate = new Date();
    endDate.setTime(endOfMonth(lastMonth).getTime());
    end = endDate;

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ... (rest of the code remains unchanged) */}
      </Tabs>
    </div>
  );
};

function getAverageMetric(
  data: FeedbackAnalyticsData | null,
  metric: "specificityScore" | "actionabilityScore" | "noveltyScore",
  rawValue = false,
): string | number {
  if (!data) return rawValue ? 0 : "0%";

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

function prepareCategoryQualityData(data: FeedbackAnalyticsData | null) {
  if (!data || !data.categoryDistribution.length) return [];

  return data.categoryDistribution.map((category) => ({
    name: category.categoryName,
    quality: Math.random() * 0.5 + 0.3,
    count: category.count,
  }));
}

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
