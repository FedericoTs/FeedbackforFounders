import { supabase } from "../supabase/supabase";

export interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment?: number;
  qualityScore?: number;
}

export interface FeedbackQualitySuggestion {
  metric: string;
  suggestion: string;
  examples: string[];
}

export const feedbackQualityService = {
  /**
   * Analyze feedback text for quality metrics
   */
  async analyzeFeedback(text: string): Promise<FeedbackQualityMetrics> {
    try {
      // In a real implementation, this would call an API or edge function
      // For now, we'll use a simplified approach based on text characteristics

      // Simple metrics calculation based on text length and characteristics
      const specificity = Math.min(text.length / 200, 0.9);
      const actionability = Math.min(text.length / 150, 0.9);
      const novelty = 0.5 + Math.random() * 0.3; // Random for demo
      const sentiment = Math.min(Math.max(Math.random() * 2 - 1, -0.9), 0.9); // Between -0.9 and 0.9

      // Calculate overall quality score (weighted average)
      const qualityScore =
        (specificity * 0.4 +
          actionability * 0.4 +
          novelty * 0.2 +
          ((sentiment + 1) / 2) * 0.1) /
        1.1; // Normalize by sum of weights

      return {
        specificityScore: specificity,
        actionabilityScore: actionability,
        noveltyScore: novelty,
        sentiment,
        qualityScore,
      };
    } catch (error) {
      console.error("Error in analyzeFeedback:", error);
      // Return default values if analysis fails
      return {
        specificityScore: 0.5,
        actionabilityScore: 0.5,
        noveltyScore: 0.5,
        sentiment: 0,
        qualityScore: 0.5,
      };
    }
  },

  /**
   * Get suggestions to improve feedback quality
   */
  getSuggestions(metrics: FeedbackQualityMetrics): FeedbackQualitySuggestion[] {
    const suggestions: FeedbackQualitySuggestion[] = [];

    if (metrics.specificityScore < 0.4) {
      suggestions.push({
        metric: "specificity",
        suggestion: "Add more specific details about what you observed",
        examples: [
          "Mention specific elements or features you're providing feedback on",
          "Include exact steps to reproduce an issue",
          "Reference specific sections or pages",
        ],
      });
    }

    if (metrics.actionabilityScore < 0.4) {
      suggestions.push({
        metric: "actionability",
        suggestion: "Include clear suggestions for improvement",
        examples: [
          "Suggest specific changes that would address your concerns",
          "Provide alternative approaches or solutions",
          "Explain how your suggestions would improve the experience",
        ],
      });
    }

    if (metrics.noveltyScore < 0.4) {
      suggestions.push({
        metric: "novelty",
        suggestion: "Try to provide unique insights not mentioned before",
        examples: [
          "Review existing feedback to avoid duplication",
          "Consider different use cases or perspectives",
          "Share personal experiences that provide new context",
        ],
      });
    }

    if (metrics.sentiment && metrics.sentiment < -0.3) {
      suggestions.push({
        metric: "sentiment",
        suggestion: "Consider using more constructive language",
        examples: [
          "Focus on the issue rather than assigning blame",
          "Balance criticism with positive observations",
          "Use neutral language to describe problems",
        ],
      });
    }

    return suggestions;
  },

  /**
   * Save feedback quality metrics to the database
   */
  async saveFeedbackQualityMetrics(
    feedbackId: string,
    metrics: FeedbackQualityMetrics,
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({
          specificity_score: metrics.specificityScore,
          actionability_score: metrics.actionabilityScore,
          novelty_score: metrics.noveltyScore,
          sentiment: metrics.sentiment,
          quality_score: metrics.qualityScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feedbackId);

      if (error) {
        console.error("Error saving feedback quality metrics:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in saveFeedbackQualityMetrics:", error);
      return false;
    }
  },

  /**
   * Get feedback quality metrics for a specific feedback
   */
  async getFeedbackQualityMetrics(
    feedbackId: string,
  ): Promise<FeedbackQualityMetrics | null> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          "specificity_score, actionability_score, novelty_score, sentiment, quality_score",
        )
        .eq("id", feedbackId)
        .single();

      if (error) {
        console.error("Error getting feedback quality metrics:", error);
        return null;
      }

      return {
        specificityScore: data.specificity_score,
        actionabilityScore: data.actionability_score,
        noveltyScore: data.novelty_score,
        sentiment: data.sentiment,
        qualityScore: data.quality_score,
      };
    } catch (error) {
      console.error("Error in getFeedbackQualityMetrics:", error);
      return null;
    }
  },
};
