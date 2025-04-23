import { supabase } from "../supabase/supabase";

export interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment?: number;
  qualityScore?: number;
  category?: string;
  subcategory?: string;
}

export interface FeedbackQualitySuggestion {
  metric: string;
  suggestion: string;
  examples: string[];
}

export const feedbackQualityService = {
  /**
   * Analyze feedback text for quality metrics using the edge function
   */
  async analyzeFeedback(text: string): Promise<FeedbackQualityMetrics> {
    try {
      // Call the feedback-analysis edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-feedback-analysis",
        {
          body: { content: text },
        },
      );

      if (error) {
        console.error("Error calling feedback analysis function:", error);
        throw error;
      }

      // Calculate overall quality score (weighted average)
      const metrics = data as FeedbackQualityMetrics;
      const qualityScore =
        (metrics.specificityScore * 0.4 +
          metrics.actionabilityScore * 0.4 +
          metrics.noveltyScore * 0.2) /
        1.0; // Normalize by sum of weights

      return {
        ...metrics,
        qualityScore,
      };
    } catch (error) {
      console.error("Error in analyzeFeedback:", error);
      // Fallback to local analysis if the edge function fails
      return this.analyzeLocally(text);
    }
  },

  /**
   * Fallback local analysis when the edge function is unavailable
   */
  analyzeLocally(text: string): FeedbackQualityMetrics {
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
      category: this.determineCategory(text),
      subcategory: this.determineSubcategory(text),
    };
  },

  /**
   * Simple category determination based on keywords
   */
  determineCategory(text: string): string {
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("design") ||
      lowerText.includes("look") ||
      lowerText.includes("ui") ||
      lowerText.includes("interface")
    ) {
      return "UI Design";
    } else if (
      lowerText.includes("use") ||
      lowerText.includes("experience") ||
      lowerText.includes("ux") ||
      lowerText.includes("flow")
    ) {
      return "User Experience";
    } else if (
      lowerText.includes("text") ||
      lowerText.includes("content") ||
      lowerText.includes("wording") ||
      lowerText.includes("message")
    ) {
      return "Content";
    } else if (
      lowerText.includes("function") ||
      lowerText.includes("feature") ||
      lowerText.includes("work") ||
      lowerText.includes("bug")
    ) {
      return "Functionality";
    } else if (
      lowerText.includes("slow") ||
      lowerText.includes("fast") ||
      lowerText.includes("speed") ||
      lowerText.includes("performance")
    ) {
      return "Performance";
    }
    return "Other";
  },

  /**
   * Simple subcategory determination
   */
  determineSubcategory(text: string): string {
    const category = this.determineCategory(text);
    const lowerText = text.toLowerCase();

    switch (category) {
      case "UI Design":
        if (lowerText.includes("color") || lowerText.includes("theme"))
          return "Color Scheme";
        if (lowerText.includes("button") || lowerText.includes("icon"))
          return "UI Elements";
        if (lowerText.includes("layout") || lowerText.includes("position"))
          return "Layout";
        return "General Design";
      case "User Experience":
        if (lowerText.includes("navigation") || lowerText.includes("menu"))
          return "Navigation";
        if (lowerText.includes("form") || lowerText.includes("input"))
          return "Forms & Inputs";
        if (lowerText.includes("flow") || lowerText.includes("process"))
          return "User Flow";
        return "General UX";
      case "Functionality":
        if (lowerText.includes("bug") || lowerText.includes("error"))
          return "Bug Report";
        if (lowerText.includes("feature") || lowerText.includes("add"))
          return "Feature Request";
        return "General Functionality";
      default:
        return "General Feedback";
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

    if (metrics.sentiment !== undefined && metrics.sentiment < -0.3) {
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
          category: metrics.category,
          subcategory: metrics.subcategory,
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
          "specificity_score, actionability_score, novelty_score, sentiment, quality_score, category, subcategory",
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
        category: data.category,
        subcategory: data.subcategory,
      };
    } catch (error) {
      console.error("Error in getFeedbackQualityMetrics:", error);
      return null;
    }
  },

  /**
   * Get feedback quality analytics for a project
   */
  async getFeedbackQualityAnalytics(projectId: string) {
    try {
      const { data, error } = await supabase
        .from("feedback_quality_analytics")
        .select("*")
        .eq("project_id", projectId)
        .single();

      if (error) {
        console.error("Error getting feedback quality analytics:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getFeedbackQualityAnalytics:", error);
      return null;
    }
  },

  /**
   * Get feedback quality suggestions from the database
   */
  async getFeedbackQualitySuggestionsFromDB(
    specificityScore: number,
    actionabilityScore: number,
    noveltyScore: number,
    sentiment: number,
  ): Promise<FeedbackQualitySuggestion[]> {
    try {
      const { data, error } = await supabase.rpc(
        "get_feedback_quality_suggestions",
        {
          p_specificity: specificityScore,
          p_actionability: actionabilityScore,
          p_novelty: noveltyScore,
          p_sentiment: sentiment,
        },
      );

      if (error) {
        console.error("Error getting feedback quality suggestions:", error);
        // Fall back to client-side suggestions
        return this.getSuggestions({
          specificityScore,
          actionabilityScore,
          noveltyScore,
          sentiment,
        });
      }

      return data as FeedbackQualitySuggestion[];
    } catch (error) {
      console.error("Error in getFeedbackQualitySuggestionsFromDB:", error);
      // Fall back to client-side suggestions
      return this.getSuggestions({
        specificityScore,
        actionabilityScore,
        noveltyScore,
        sentiment,
      });
    }
  },
};
