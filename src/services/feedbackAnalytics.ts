import { supabase } from "../supabase/supabase";

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageQuality: number;
  qualityDistribution: {
    excellent: number; // 0.8-1.0
    good: number; // 0.6-0.79
    average: number; // 0.4-0.59
    basic: number; // 0-0.39
  };
  topCategories: Array<{ category: string; count: number }>;
  qualityTrend: Array<{ date: string; averageQuality: number }>;
  userPerformance?: {
    totalFeedbackGiven: number;
    averageQuality: number;
    pointsEarned: number;
    rank: number;
    percentile: number;
  };
}

export interface FeedbackAnalyticsData {
  totalFeedback: number;
  averageQuality: number;
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
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    qualityScore?: number;
  }>;
  feedbackVolume: Array<{
    date: string;
    count: number;
  }>;
  topProviders: Array<{
    userId: string;
    userName: string;
    avatarUrl?: string;
    feedbackCount: number;
    averageQuality: number;
  }>;
  responseRate: number;
  averageResponseTime: number;
  qualityTrend: Array<{
    date: string;
    averageQuality: number;
  }>;
}

export interface FeedbackAnalyticsFilters {
  projectId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  categoryIds?: string[];
  qualityThreshold?: number;
}

export const feedbackAnalyticsService = {
  /**
   * Get feedback analytics for a project or user
   */
  async getFeedbackAnalytics(
    params:
      | {
          projectId?: string;
          userId?: string;
          timeframe?: "week" | "month" | "year" | "all";
          includeQualityMetrics?: boolean;
        }
      | FeedbackAnalyticsFilters,
  ): Promise<FeedbackAnalytics | FeedbackAnalyticsData> {
    try {
      // Handle both old and new parameter formats
      let projectId,
        userId,
        timeframe,
        includeQualityMetrics,
        dateRange,
        categoryIds,
        qualityThreshold;

      if ("timeframe" in params) {
        // Old format
        projectId = params.projectId;
        userId = params.userId;
        timeframe = params.timeframe || "month";
        includeQualityMetrics = params.includeQualityMetrics !== false;
      } else {
        // New format
        projectId = params.projectId;
        userId = params.userId;
        dateRange = params.dateRange;
        categoryIds = params.categoryIds;
        qualityThreshold = params.qualityThreshold;
      }

      // Call the feedback-analytics edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-feedback-analytics",
        {
          body: {
            projectId,
            userId,
            timeframe,
            includeQualityMetrics,
            dateRange: dateRange
              ? {
                  start: dateRange.start.toISOString(),
                  end: dateRange.end.toISOString(),
                }
              : undefined,
            categoryIds,
            qualityThreshold,
          },
        },
      );

      if (error) {
        console.error("Error fetching feedback analytics:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error in getFeedbackAnalytics:", error);
      // Return default analytics if the edge function fails
      return {
        totalFeedback: 0,
        averageQuality: 0,
        qualityDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          basic: 0,
        },
        sentimentAnalysis: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        categoryDistribution: [],
        feedbackVolume: [],
        topProviders: [],
        responseRate: 0,
        averageResponseTime: 0,
        qualityTrend: [],
        topCategories: [],
      };
    }
  },

  /**
   * Get comparison analytics for a previous period
   */
  async getComparisonAnalytics(
    filters: FeedbackAnalyticsFilters,
    daysToCompare: number = 30,
  ): Promise<{ previous: FeedbackAnalyticsData; changes: any }> {
    try {
      if (!filters.dateRange) {
        throw new Error("Date range is required for comparison analytics");
      }

      // Calculate previous period date range
      const currentStart = new Date(filters.dateRange.start);
      const currentEnd = new Date(filters.dateRange.end);
      const duration = currentEnd.getTime() - currentStart.getTime();

      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const previousStart = new Date(previousEnd);
      previousStart.setTime(previousStart.getTime() - duration);

      // Get analytics for previous period
      const previousFilters = {
        ...filters,
        dateRange: {
          start: previousStart,
          end: previousEnd,
        },
      };

      const previousData = (await this.getFeedbackAnalytics(
        previousFilters,
      )) as FeedbackAnalyticsData;
      const currentData = (await this.getFeedbackAnalytics(
        filters,
      )) as FeedbackAnalyticsData;

      // Calculate changes
      const changes = {
        feedbackVolume: calculatePercentageChange(
          previousData.totalFeedback,
          currentData.totalFeedback,
        ),
        qualityScore: calculatePercentageChange(
          previousData.averageQuality,
          currentData.averageQuality,
        ),
        responseRate: calculatePercentageChange(
          previousData.responseRate,
          currentData.responseRate,
        ),
        responseTime: calculatePercentageChange(
          previousData.averageResponseTime,
          currentData.averageResponseTime,
        ),
      };

      return {
        previous: previousData,
        changes,
      };
    } catch (error) {
      console.error("Error in getComparisonAnalytics:", error);
      // Return default comparison data
      return {
        previous: {
          totalFeedback: 0,
          averageQuality: 0,
          qualityDistribution: { excellent: 0, good: 0, average: 0, basic: 0 },
          sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
          categoryDistribution: [],
          feedbackVolume: [],
          topProviders: [],
          responseRate: 0,
          averageResponseTime: 0,
          qualityTrend: [],
        },
        changes: {
          feedbackVolume: 0,
          qualityScore: 0,
          responseRate: 0,
          responseTime: 0,
        },
      };
    }
  },

  /**
   * Export analytics data to CSV
   */
  exportToCsv(
    data: FeedbackAnalyticsData,
    filename: string = "feedback-analytics.csv",
  ): void {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add headers
      csvContent += "Category,Metric,Value\n";

      // Add overview metrics
      csvContent += `Overview,Total Feedback,${data.totalFeedback}\n`;
      csvContent += `Overview,Average Quality,${(data.averageQuality * 100).toFixed(1)}%\n`;
      csvContent += `Overview,Response Rate,${(data.responseRate * 100).toFixed(1)}%\n`;
      csvContent += `Overview,Average Response Time,${data.averageResponseTime.toFixed(1)} hours\n`;

      // Add quality distribution
      csvContent += `Quality,Excellent,${data.qualityDistribution.excellent}\n`;
      csvContent += `Quality,Good,${data.qualityDistribution.good}\n`;
      csvContent += `Quality,Average,${data.qualityDistribution.average}\n`;
      csvContent += `Quality,Basic,${data.qualityDistribution.basic}\n`;

      // Add sentiment analysis
      csvContent += `Sentiment,Positive,${data.sentimentAnalysis.positive}\n`;
      csvContent += `Sentiment,Neutral,${data.sentimentAnalysis.neutral}\n`;
      csvContent += `Sentiment,Negative,${data.sentimentAnalysis.negative}\n`;

      // Add category distribution
      data.categoryDistribution.forEach((category) => {
        csvContent += `Category,${category.categoryName},${category.count}\n`;
      });

      // Add feedback volume over time
      data.feedbackVolume.forEach((item) => {
        csvContent += `Volume,${item.date},${item.count}\n`;
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export data to CSV");
    }
  },

  /**
   * Export analytics data to PDF
   */
  exportToPdf(
    data: FeedbackAnalyticsData,
    filename: string = "feedback-analytics.pdf",
  ): void {
    try {
      alert(
        "PDF export functionality is not yet implemented. Please use CSV export instead.",
      );
      // In a real implementation, you would use a library like jsPDF to generate a PDF
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export data to PDF");
    }
  },

  /**
   * Get feedback quality level description based on score
   */
  getQualityLevelDescription(score: number): {
    level: string;
    description: string;
    color: string;
  } {
    if (score >= 0.8) {
      return {
        level: "Excellent",
        description: "Highly specific, actionable, and novel feedback",
        color: "green",
      };
    } else if (score >= 0.6) {
      return {
        level: "Good",
        description: "Clear, helpful feedback with specific points",
        color: "teal",
      };
    } else if (score >= 0.4) {
      return {
        level: "Average",
        description: "Somewhat helpful feedback that could be more specific",
        color: "amber",
      };
    } else {
      return {
        level: "Basic",
        description: "General feedback that lacks specificity or actionability",
        color: "slate",
      };
    }
  },

  /**
   * Calculate combined quality score from individual metrics
   */
  calculateCombinedQualityScore(metrics: {
    specificityScore: number;
    actionabilityScore: number;
    noveltyScore: number;
  }): number {
    return (
      (metrics.specificityScore +
        metrics.actionabilityScore +
        metrics.noveltyScore) /
      3
    );
  },
};

// Helper function to calculate percentage change
function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}
