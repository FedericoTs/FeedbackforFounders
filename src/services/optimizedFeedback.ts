/**
 * Optimized Feedback Service
 *
 * Enhanced version of the feedback service with caching, pagination, and error handling.
 */

import { supabase } from "../../supabase/supabase";
import { requestCache, retryWithBackoff } from "@/utils/requestCache";
import {
  createPaginatedQuery,
  executePaginatedQuery,
  handleApiError,
  PaginationParams,
  PaginatedResponse,
} from "./apiUtils";
import { FeedbackCategory } from "@/components/feedback/FeedbackCategorySelector";
import { FeedbackQualityMetrics } from "./feedbackQuality";

export interface FeedbackSubmission {
  projectId: string;
  userId: string;
  sectionId: string;
  sectionName: string;
  sectionType: string;
  content: string;
  category: string;
  subcategory?: string;
  screenshotUrl?: string;
  screenshotAnnotations?: any;
  quickReactions?: any;
  rating?: number;
  pageUrl?: string;
  elementSelector?: string | null;
  customCategories?: FeedbackCategory[];
}

export interface Feedback {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  element_selector?: string;
  screenshot_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  quality_score?: number;
  specificity_score?: number;
  actionability_score?: number;
  sentiment?: number;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

export interface FeedbackQueryParams extends PaginationParams {
  projectId?: string;
  userId?: string;
  sectionId?: string;
  status?: string;
  category?: string;
  minQuality?: number;
}

export const optimizedFeedbackService = {
  /**
   * Get feedback with pagination and caching
   */
  async getFeedback(
    params: FeedbackQueryParams,
  ): Promise<PaginatedResponse<Feedback>> {
    try {
      const {
        projectId,
        userId,
        sectionId,
        status,
        category,
        minQuality,
        ...paginationParams
      } = params;

      // Create base query
      let query = supabase.from("feedback").select(
        `
          *,
          user:user_id (id, name, avatar_url, level)
        `,
      );

      // Apply filters
      if (projectId) query = query.eq("project_id", projectId);
      if (userId) query = query.eq("user_id", userId);
      if (sectionId) query = query.eq("section_id", sectionId);
      if (status) query = query.eq("status", status);
      if (category) query = query.eq("category", category);
      if (minQuality) query = query.gte("quality_score", minQuality);

      // Apply pagination
      query = createPaginatedQuery(query, {
        ...paginationParams,
        sortBy: paginationParams.sortBy || "created_at",
        sortOrder: paginationParams.sortOrder || "desc",
      });

      // Execute query with pagination metadata
      return await executePaginatedQuery<Feedback>(query, paginationParams, {
        countTotal: true,
        cursorField: paginationParams.sortBy || "created_at",
      });
    } catch (error) {
      return handleApiError(error, "getFeedback");
    }
  },

  /**
   * Submit feedback with optimistic update and error handling
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<{
    success: boolean;
    feedbackId?: string;
    points?: number;
    qualityMetrics?: FeedbackQualityMetrics;
    message?: string;
  }> {
    try {
      // First, analyze feedback quality using AI
      const qualityMetrics = await this.analyzeFeedbackQuality(
        feedback.content,
      );

      // Prepare feedback data
      const feedbackData: any = {
        project_id: feedback.projectId,
        user_id: feedback.userId,
        section_id: feedback.sectionId,
        section_name: feedback.sectionName,
        section_type: feedback.sectionType,
        content: feedback.content,
        category: feedback.category,
        rating: feedback.rating || 5,
        element_selector: feedback.elementSelector,
        specificity_score: qualityMetrics.specificityScore,
        actionability_score: qualityMetrics.actionabilityScore,
        novelty_score: qualityMetrics.noveltyScore,
        sentiment: qualityMetrics.sentiment,
        quality_score:
          (qualityMetrics.specificityScore +
            qualityMetrics.actionabilityScore +
            qualityMetrics.noveltyScore) /
          3,
      };

      // Add optional fields
      if (feedback.subcategory) feedbackData.subcategory = feedback.subcategory;
      if (feedback.pageUrl) feedbackData.page_url = feedback.pageUrl;
      if (feedback.screenshotUrl)
        feedbackData.screenshot_url = feedback.screenshotUrl;

      // Submit feedback using RPC function with retry
      const { data, error } = await retryWithBackoff(() =>
        supabase.rpc("submit_feedback_v2", {
          feedback_data: feedbackData,
        }),
      );

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Unknown error");

      // Handle custom categories if provided
      if (feedback.customCategories?.length && data.id) {
        await this.handleCustomCategories(data.id, feedback.customCategories);
      }

      // Calculate points based on quality
      const points = 10 + this.calculateQualityPoints(qualityMetrics);

      // Invalidate related caches
      this.invalidateRelatedCaches(feedback.projectId);

      return {
        success: true,
        feedbackId: data.id,
        points,
        qualityMetrics,
        message: "Feedback submitted successfully",
      };
    } catch (error) {
      console.error("Error in submitFeedback:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to submit feedback",
      };
    }
  },

  /**
   * Handle custom categories for feedback
   */
  async handleCustomCategories(
    feedbackId: string,
    categories: FeedbackCategory[],
  ): Promise<void> {
    try {
      // Get category IDs, filtering out temporary categories
      const validCategoryIds = categories
        .filter(
          (cat) => !cat.id.startsWith("temp-") && !cat.id.startsWith("ai-"),
        )
        .map((cat) => cat.id);

      // Create mappings for valid categories
      if (validCategoryIds.length > 0) {
        const mappings = validCategoryIds.map((categoryId) => ({
          feedback_id: feedbackId,
          category_id: categoryId,
        }));

        await supabase.from("feedback_category_mappings").insert(mappings);
      }

      // Handle temporary categories
      const tempCategories = categories.filter(
        (cat) => cat.id.startsWith("temp-") || cat.id.startsWith("ai-"),
      );

      for (const tempCat of tempCategories) {
        // Create the category
        const { data: categoryData } = await supabase
          .from("feedback_categories")
          .insert({
            name: tempCat.name,
            description: tempCat.description || null,
            color: tempCat.color || null,
          })
          .select("id")
          .single();

        if (categoryData?.id) {
          // Map the new category to the feedback
          await supabase.from("feedback_category_mappings").insert({
            feedback_id: feedbackId,
            category_id: categoryData.id,
          });
        }
      }
    } catch (error) {
      console.error("Error handling custom categories:", error);
    }
  },

  /**
   * Analyze feedback quality using AI with caching
   */
  async analyzeFeedbackQuality(
    content: string,
  ): Promise<FeedbackQualityMetrics> {
    const cacheKey = `feedback-quality:${content.substring(0, 100)}`;

    return requestCache.withCache(
      async () => {
        try {
          // Try to call the feedback-analysis edge function
          const { data, error } = await supabase.functions.invoke(
            "supabase-functions-feedback-analysis",
            { body: { content } },
          );

          if (!error && data) return data;
          throw new Error("Edge function failed");
        } catch (edgeFunctionError) {
          console.warn(
            "Edge function error, using fallback analysis",
            edgeFunctionError,
          );

          // Fallback to local analysis
          return this.analyzeLocally(content);
        }
      },
      { key: cacheKey, ttl: 30 * 60 * 1000 }, // Cache for 30 minutes
    );
  },

  /**
   * Local fallback analysis
   */
  analyzeLocally(content: string): FeedbackQualityMetrics {
    // Simple sentiment analysis based on positive/negative words
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "love",
      "like",
      "helpful",
      "useful",
      "impressive",
    ];
    const negativeWords = [
      "bad",
      "poor",
      "terrible",
      "awful",
      "hate",
      "dislike",
      "confusing",
      "difficult",
      "frustrating",
    ];

    const words = content.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalWords = words.length;
    const specificityScore = Math.min(0.5 + totalWords / 100, 0.9); // Longer feedback tends to be more specific
    const actionabilityScore =
      content.includes("should") ||
      content.includes("could") ||
      content.includes("would")
        ? 0.7
        : 0.5;
    const noveltyScore = 0.6; // Default value
    const sentiment =
      (positiveCount - negativeCount) /
      Math.max(1, positiveCount + negativeCount);

    return {
      specificityScore,
      actionabilityScore,
      noveltyScore,
      sentiment,
      category: "User Experience",
      subcategory: "General Feedback",
    };
  },

  /**
   * Calculate quality points based on metrics
   */
  calculateQualityPoints(metrics: FeedbackQualityMetrics): number {
    try {
      // Start with base calculation
      let qualityPoints = 0;

      // Calculate combined quality score (0-1 range)
      const qualityScore =
        (metrics.specificityScore +
          metrics.actionabilityScore +
          metrics.noveltyScore) /
        3;

      // Only award quality points if above threshold
      if (qualityScore >= 0.6) {
        // Maximum 25 points for perfect quality
        qualityPoints = Math.round(qualityScore * 25);
      }

      // Cap at maximum
      return Math.min(qualityPoints, 25);
    } catch (error) {
      console.error("Error calculating quality points:", error);
      return 0;
    }
  },

  /**
   * Invalidate related caches when feedback is submitted
   */
  invalidateRelatedCaches(projectId: string): void {
    // Clear any cached feedback for this project
    const cacheKeyPattern = `feedback:${projectId}`;

    // In a real implementation, we would have a more sophisticated way to
    // invalidate specific cache entries that match a pattern
    requestCache.clear();
  },

  /**
   * Get feedback for a specific section with caching
   */
  async getSectionFeedback(
    projectId: string,
    sectionId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Feedback>> {
    const cacheKey = requestCache.createKey(
      `feedback:${projectId}:${sectionId}`,
      params,
    );

    return requestCache.withCache(
      () =>
        this.getFeedback({
          projectId,
          sectionId,
          ...params,
        }),
      { key: cacheKey, ttl: 5 * 60 * 1000 }, // Cache for 5 minutes
    );
  },

  /**
   * Get project sections with feedback counts
   */
  async getProjectSections(projectId: string): Promise<any[]> {
    const cacheKey = `project-sections:${projectId}`;

    return requestCache.withCache(
      async () => {
        try {
          const { data, error } = await supabase
            .from("project_sections")
            .select("*")
            .eq("project_id", projectId)
            .order("priority", { ascending: true });

          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error("Error getting project sections:", error);
          return [];
        }
      },
      { key: cacheKey, ttl: 10 * 60 * 1000 }, // Cache for 10 minutes
    );
  },
};
