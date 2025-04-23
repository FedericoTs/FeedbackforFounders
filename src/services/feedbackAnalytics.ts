import { supabase } from "../../supabase/supabase";

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

export const feedbackAnalyticsService = {
  /**
   * Get feedback analytics for a project or user
   */
  async getFeedbackAnalytics(params: {
    projectId?: string;
    userId?: string;
    timeframe?: "week" | "month" | "year" | "all";
    includeQualityMetrics?: boolean;
  }): Promise<FeedbackAnalytics> {
    try {
      const {
        projectId,
        userId,
        timeframe = "month",
        includeQualityMetrics = true,
      } = params;

      // Call the feedback-analytics edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-feedback-analytics",
        {
          body: { projectId, userId, timeframe, includeQualityMetrics },
        },
      );

      if (error) {
        console.error("Error fetching feedback analytics:", error);
        throw error;
      }

      return data as FeedbackAnalytics;
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
        topCategories: [],
        qualityTrend: [],
      };
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
