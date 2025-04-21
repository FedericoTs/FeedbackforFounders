import { supabase } from "../../supabase/supabase";
import { rewardsService } from "./rewards";

export interface FeedbackItem {
  id: string;
  project_id: string;
  user_id: string;
  element_selector: string;
  element_xpath: string;
  element_screenshot_url?: string;
  content: string;
  category: string;
  subcategory?: string;
  severity: number;
  sentiment?: number;
  actionability_score?: number;
  quality_score?: number;
  is_duplicate: boolean;
  similar_feedback_ids?: string[];
  implementation_status:
    | "pending"
    | "planned"
    | "implemented"
    | "declined"
    | "considered";
  points_awarded?: number;
  final_points_awarded?: number;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  responses?: FeedbackResponse[];
}

export interface FeedbackSubmission {
  projectId: string;
  elementSelector: string;
  elementXPath: string;
  elementScreenshotUrl?: string;
  content: string;
  category: string;
  subcategory?: string;
  severity: number;
  metadata?: Record<string, any>;
}

export interface FeedbackAnalysis {
  sentiment: number;
  key_suggestions: string[];
  detected_categories: string[];
  quality_score: number;
  actionability_score: number;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  by_category: Record<string, number>;
  by_severity: Record<number, number>;
  by_implementation_status: Record<string, number>;
}

export interface FeedbackTimeTrends {
  daily: { date: string; count: number }[];
  weekly: { date: string; count: number }[];
  monthly: { date: string; count: number }[];
}

export interface ElementFeedbackSummary {
  element_selector: string;
  element_type: string;
  feedback_count: number;
  average_sentiment: number;
  average_severity: number;
  category_distribution: Record<string, number>;
  pros: string[];
  cons: string[];
  action_recommendations: {
    text: string;
    priority: "high" | "medium" | "low";
    estimated_impact: "high" | "medium" | "low";
  }[];
}

export interface FeedbackResponse {
  id: string;
  feedback_id: string;
  user_id: string;
  content: string;
  is_official: boolean;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface FeedbackHeatmapData {
  points: {
    id: string;
    element_selector: string;
    element_type: string;
    x: number;
    y: number;
    category: string;
    severity: number;
    count: number;
  }[];
}

export const feedbackService = {
  /**
   * Submit feedback for a project
   */
  async submitFeedback(
    submission: FeedbackSubmission,
    userId: string,
  ): Promise<{ feedback: FeedbackItem; points: number }> {
    try {
      console.log("Submitting feedback:", submission);

      // Check for duplicate feedback
      const { data: existingFeedback, error: duplicateError } = await supabase
        .from("feedback")
        .select("id")
        .eq("project_id", submission.projectId)
        .eq("element_selector", submission.elementSelector)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      // If there's a similar feedback from the same user on the same element, mark as potential duplicate
      const isDuplicate = existingFeedback && existingFeedback.length > 0;

      // Step 1: Insert the feedback record
      const { data: feedback, error } = await supabase
        .from("feedback")
        .insert({
          project_id: submission.projectId,
          user_id: userId,
          element_selector: submission.elementSelector,
          element_xpath: submission.elementXPath,
          element_screenshot_url: submission.elementScreenshotUrl,
          content: submission.content,
          category: submission.category,
          subcategory: submission.subcategory || null,
          severity: submission.severity,
          implementation_status: "pending",
          is_duplicate: isDuplicate,
          similar_feedback_ids: isDuplicate ? [existingFeedback[0].id] : null,
        })
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .single();

      if (error) throw error;

      // Step 2: Process the feedback through OpenAI for analysis
      // This would typically be done via an edge function or background job
      // For now, we'll simulate this with a direct call
      try {
        const { data: analysisData, error: analysisError } =
          await supabase.functions.invoke(
            "supabase-functions-feedback-analysis",
            {
              body: {
                feedbackId: feedback.id,
                content: submission.content,
                category: submission.category,
                subcategory: submission.subcategory,
                severity: submission.severity,
              },
            },
          );

        if (analysisError) {
          console.error("Error analyzing feedback:", analysisError);
          // Continue even if analysis fails
        } else {
          console.log("Feedback analysis result:", analysisData);
          // Update the feedback record with analysis results
          await supabase
            .from("feedback")
            .update({
              sentiment: analysisData.sentiment,
              actionability_score: analysisData.actionability_score,
              quality_score: analysisData.quality_score,
            })
            .eq("id", feedback.id);

          // Update the feedback object with the analysis results
          feedback.sentiment = analysisData.sentiment;
          feedback.actionability_score = analysisData.actionability_score;
          feedback.quality_score = analysisData.quality_score;
        }
      } catch (analysisError) {
        console.error("Error in feedback analysis:", analysisError);
        // Continue even if analysis fails
      }

      // Step 3: Award points to the user
      const rewardResult = await rewardsService.processReward({
        userId,
        activityType: "feedback_given",
        description: `Provided feedback on project: ${submission.projectId}`,
        projectId: submission.projectId,
        metadata: {
          feedbackId: feedback.id,
          category: submission.category,
          severity: submission.severity,
        },
      });

      console.log("Feedback reward result:", rewardResult);

      // Step 4: Update the feedback record with the points awarded
      if (rewardResult.success && rewardResult.points > 0) {
        await supabase
          .from("feedback")
          .update({
            points_awarded: rewardResult.points,
            final_points_awarded: rewardResult.points,
          })
          .eq("id", feedback.id);

        // Update the feedback object with the points awarded
        feedback.points_awarded = rewardResult.points;
        feedback.final_points_awarded = rewardResult.points;
      }

      // Step 5: Update project feedback counters
      try {
        // Increment the feedback count
        await supabase.rpc("increment_project_feedback_count", {
          p_project_id: submission.projectId,
        });

        // Update sentiment counters
        if (feedback.sentiment !== undefined) {
          if (feedback.sentiment > 0) {
            await supabase.rpc("increment_project_positive_feedback", {
              p_project_id: submission.projectId,
            });
          } else if (feedback.sentiment < 0) {
            await supabase.rpc("increment_project_negative_feedback", {
              p_project_id: submission.projectId,
            });
          } else {
            await supabase.rpc("increment_project_neutral_feedback", {
              p_project_id: submission.projectId,
            });
          }
        }
      } catch (counterError) {
        console.error(
          "Error updating project feedback counters:",
          counterError,
        );
        // Continue even if counter updates fail
      }

      // Step 6: Notify the project owner
      try {
        // Get project owner
        const { data: projectData } = await supabase
          .from("projects")
          .select("user_id, title")
          .eq("id", submission.projectId)
          .single();

        if (projectData && projectData.user_id !== userId) {
          // Award points to the project owner for receiving feedback
          await rewardsService.processReward({
            userId: projectData.user_id,
            activityType: "feedback_received",
            description: `Received feedback on your project`,
            projectId: submission.projectId,
            metadata: {
              feedbackId: feedback.id,
              category: submission.category,
              severity: submission.severity,
            },
          });

          // Trigger award toast for the feedback provider
          const awardEvent = new CustomEvent("award:received", {
            detail: {
              points: rewardResult.success ? rewardResult.points : 0,
              title: "Feedback Submitted!",
              description: `You earned points for providing feedback on ${projectData.title}`,
              variant: "default",
            },
          });

          // Dispatch the event
          if (typeof window !== "undefined") {
            window.dispatchEvent(awardEvent);
          }
        }
      } catch (notifyError) {
        console.error("Error notifying project owner:", notifyError);
        // Continue even if notification fails
      }

      return {
        feedback: feedback as FeedbackItem,
        points: rewardResult.success ? rewardResult.points : 0,
      };
    } catch (error) {
      console.error("Error submitting feedback:", error);
      throw error;
    }
  },

  /**
   * Get feedback for a project
   */
  async getProjectFeedback(projectId: string): Promise<FeedbackItem[]> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeedbackItem[];
    } catch (error) {
      console.error("Error fetching project feedback:", error);
      return [];
    }
  },

  /**
   * Get feedback by ID
   */
  async getFeedbackById(feedbackId: string): Promise<FeedbackItem | null> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("id", feedbackId)
        .single();

      if (error) throw error;
      return data as FeedbackItem;
    } catch (error) {
      console.error("Error fetching feedback by ID:", error);
      return null;
    }
  },

  /**
   * Update feedback implementation status
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: "pending" | "planned" | "implemented" | "declined" | "considered",
    userId: string,
  ): Promise<FeedbackItem> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .update({ implementation_status: status })
        .eq("id", feedbackId)
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: data.project_id,
        user_id: userId,
        activity_type: "feedback_status_updated",
        description: `Feedback status updated to ${status}`,
        metadata: { feedbackId, status },
      });

      return data as FeedbackItem;
    } catch (error) {
      console.error("Error updating feedback status:", error);
      throw error;
    }
  },

  /**
   * Rate feedback quality (by project owner)
   */
  async rateFeedbackQuality(
    feedbackId: string,
    rating: number,
    comment: string,
    userId: string,
  ): Promise<FeedbackItem> {
    try {
      // First get the current feedback to check points
      const { data: currentFeedback, error: fetchError } = await supabase
        .from("feedback")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("id", feedbackId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate adjusted points based on rating
      // Rating is 1-5, we'll adjust points by -20% to +20%
      const pointsAdjustment = ((rating - 3) / 2) * 0.2; // -0.2 to +0.2
      const originalPoints = currentFeedback.points_awarded || 0;
      const adjustedPoints = Math.round(
        originalPoints * (1 + pointsAdjustment),
      );

      // Update the feedback with the rating and adjusted points
      const { data, error } = await supabase
        .from("feedback")
        .update({
          owner_rating: rating,
          owner_comment: comment,
          final_points_awarded: adjustedPoints,
        })
        .eq("id", feedbackId)
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .single();

      if (error) throw error;

      // If points were adjusted, update the user's points
      if (originalPoints !== adjustedPoints && currentFeedback.user_id) {
        const pointsDifference = adjustedPoints - originalPoints;

        // Record points adjustment
        await supabase.from("points_adjustments").insert({
          feedback_id: feedbackId,
          reason: `Owner rated feedback as ${rating}/5`,
          points_delta: pointsDifference,
        });

        // Update user points
        if (pointsDifference !== 0) {
          await supabase.rpc("adjust_user_points", {
            p_user_id: currentFeedback.user_id,
            p_points_delta: pointsDifference,
          });
        }
      }

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: data.project_id,
        user_id: userId,
        activity_type: "feedback_rated",
        description: `Feedback rated ${rating}/5`,
        metadata: { feedbackId, rating, comment },
      });

      return data as FeedbackItem;
    } catch (error) {
      console.error("Error rating feedback:", error);
      throw error;
    }
  },

  /**
   * Get feedback statistics for a project with optional time range filtering
   * @param projectId The project ID
   * @param timeRange Optional time range filter: 'week', 'month', 'quarter', or 'all'
   */
  async getProjectFeedbackStats(
    projectId: string,
    timeRange: string = "all",
  ): Promise<FeedbackStats> {
    try {
      // Get basic stats from the project_feedback_sentiment table
      const { data: sentimentData, error: sentimentError } = await supabase
        .from("project_feedback_sentiment")
        .select("positive, negative, neutral")
        .eq("project_id", projectId)
        .single();

      if (sentimentError) throw sentimentError;

      // Get detailed stats by querying the feedback table with time range filter
      let query = supabase
        .from("feedback")
        .select("category, severity, implementation_status, created_at")
        .eq("project_id", projectId);

      // Apply time range filter
      const now = new Date();
      if (timeRange === "week") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", oneWeekAgo.toISOString());
      } else if (timeRange === "month") {
        const oneMonthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        query = query.gte("created_at", oneMonthAgo.toISOString());
      } else if (timeRange === "quarter") {
        const oneQuarterAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate(),
        );
        query = query.gte("created_at", oneQuarterAgo.toISOString());
      }

      const { data: feedbackData, error: feedbackError } = await query;

      if (feedbackError) throw feedbackError;

      // Calculate stats by category
      const byCategory: Record<string, number> = {};
      const bySeverity: Record<number, number> = {};
      const byImplementationStatus: Record<string, number> = {};

      feedbackData.forEach((item) => {
        // By category
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;

        // By severity
        bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;

        // By implementation status
        byImplementationStatus[item.implementation_status] =
          (byImplementationStatus[item.implementation_status] || 0) + 1;
      });

      return {
        total:
          sentimentData.positive +
          sentimentData.negative +
          sentimentData.neutral,
        positive: sentimentData.positive,
        negative: sentimentData.negative,
        neutral: sentimentData.neutral,
        by_category: byCategory,
        by_severity: bySeverity,
        by_implementation_status: byImplementationStatus,
      };
    } catch (error) {
      console.error("Error fetching project feedback stats:", error);
      return {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        by_category: {},
        by_severity: {},
        by_implementation_status: {},
      };
    }
  },

  /**
   * Get element feedback summary
   */
  async getElementFeedbackSummary(
    elementSelector: string,
    projectId: string,
  ): Promise<ElementFeedbackSummary | null> {
    try {
      // First check if we have a pre-computed summary
      const { data: summaryData, error: summaryError } = await supabase
        .from("element_feedback_summary")
        .select("*")
        .eq("project_id", projectId)
        .eq("element_selector", elementSelector)
        .single();

      if (!summaryError && summaryData) {
        return {
          element_selector: summaryData.element_selector,
          element_type: summaryData.element_selector.split(".")[0] || "element",
          feedback_count: summaryData.feedback_count,
          average_sentiment: summaryData.average_sentiment,
          average_severity: summaryData.average_severity,
          category_distribution: summaryData.category_distribution,
          pros: summaryData.pros || [],
          cons: summaryData.cons || [],
          action_recommendations: summaryData.action_recommendations || [],
        };
      }

      // If no pre-computed summary, fetch all feedback for this element and compute it
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("project_id", projectId)
        .eq("element_selector", elementSelector);

      if (feedbackError || !feedbackData || feedbackData.length === 0) {
        return null;
      }

      // Compute summary metrics
      const feedbackCount = feedbackData.length;
      let totalSentiment = 0;
      let totalSeverity = 0;
      const categoryDistribution: Record<string, number> = {};
      const pros: string[] = [];
      const cons: string[] = [];

      feedbackData.forEach((feedback) => {
        totalSentiment += feedback.sentiment || 0;
        totalSeverity += feedback.severity || 3;

        // Update category distribution
        categoryDistribution[feedback.category] =
          (categoryDistribution[feedback.category] || 0) + 1;

        // Add to pros/cons based on sentiment
        if (feedback.sentiment > 0.3) {
          pros.push(feedback.content.substring(0, 100));
        } else if (feedback.sentiment < -0.3) {
          cons.push(feedback.content.substring(0, 100));
        }
      });

      const averageSentiment = totalSentiment / feedbackCount;
      const averageSeverity = totalSeverity / feedbackCount;

      // Generate action recommendations (simplified version)
      const actionRecommendations = [
        {
          text: "Review and address the most common feedback issues",
          priority:
            averageSeverity > 3.5
              ? "high"
              : averageSeverity > 2.5
                ? "medium"
                : "low",
          estimated_impact:
            averageSeverity > 3.5
              ? "high"
              : averageSeverity > 2.5
                ? "medium"
                : "low",
        },
      ] as {
        text: string;
        priority: "high" | "medium" | "low";
        estimated_impact: "high" | "medium" | "low";
      }[];

      // Create a summary object
      const summary: ElementFeedbackSummary = {
        element_selector: elementSelector,
        element_type: elementSelector.split(".")[0] || "element",
        feedback_count: feedbackCount,
        average_sentiment: averageSentiment,
        average_severity: averageSeverity,
        category_distribution: categoryDistribution,
        pros: pros.slice(0, 5), // Limit to 5 pros
        cons: cons.slice(0, 5), // Limit to 5 cons
        action_recommendations: actionRecommendations,
      };

      // Store the computed summary for future use
      try {
        await supabase.from("element_feedback_summary").upsert({
          project_id: projectId,
          element_selector: elementSelector,
          feedback_count: feedbackCount,
          average_sentiment: averageSentiment,
          average_severity: averageSeverity,
          category_distribution: categoryDistribution,
          pros: pros.slice(0, 5),
          cons: cons.slice(0, 5),
          action_recommendations: actionRecommendations,
          last_updated: new Date().toISOString(),
        });
      } catch (storeError) {
        console.error("Error storing element feedback summary:", storeError);
        // Continue even if storage fails
      }

      return summary;
    } catch (error) {
      console.error("Error getting element feedback summary:", error);
      return null;
    }
  },

  /**
   * Get feedback heatmap data for a project
   */
  async getFeedbackHeatmapData(
    projectId: string,
  ): Promise<FeedbackHeatmapData> {
    try {
      // Fetch all feedback for the project
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select(
          "id, element_selector, element_xpath, category, severity, created_at",
        )
        .eq("project_id", projectId);

      if (feedbackError) throw feedbackError;

      // Group feedback by element selector
      const elementGroups: Record<string, any[]> = {};
      feedbackData.forEach((feedback) => {
        if (!elementGroups[feedback.element_selector]) {
          elementGroups[feedback.element_selector] = [];
        }
        elementGroups[feedback.element_selector].push(feedback);
      });

      // Create heatmap points
      const points = Object.entries(elementGroups).map(([selector, items]) => {
        // In a real implementation, we would use the actual position of the element
        // For this example, we'll generate random positions
        const x = Math.floor(Math.random() * 80) + 10; // 10-90%
        const y = Math.floor(Math.random() * 80) + 10; // 10-90%

        // Get the most common category
        const categories: Record<string, number> = {};
        let maxCategory = "";
        let maxCount = 0;

        items.forEach((item) => {
          categories[item.category] = (categories[item.category] || 0) + 1;
          if (categories[item.category] > maxCount) {
            maxCount = categories[item.category];
            maxCategory = item.category;
          }
        });

        // Calculate average severity
        const totalSeverity = items.reduce(
          (sum, item) => sum + item.severity,
          0,
        );
        const avgSeverity = totalSeverity / items.length;

        return {
          id: items[0].id, // Use the first feedback item's ID
          element_selector: selector,
          element_type: selector.split(".")[0] || "element",
          x,
          y,
          category: maxCategory,
          severity: avgSeverity,
          count: items.length,
        };
      });

      return { points };
    } catch (error) {
      console.error("Error getting feedback heatmap data:", error);
      return { points: [] };
    }
  },

  /**
   * Add a response to feedback
   */
  async addFeedbackResponse(
    feedbackId: string,
    content: string,
    userId: string,
    isOfficial: boolean = true,
  ): Promise<FeedbackResponse> {
    try {
      const { data, error } = await supabase
        .from("feedback_response")
        .insert({
          feedback_id: feedbackId,
          user_id: userId,
          content,
          is_official: isOfficial,
        })
        .select("*, user:user_id(id, full_name, avatar_url)")
        .single();

      if (error) throw error;

      // Get feedback and project details
      const feedbackDetails = await this.getFeedbackById(feedbackId);
      const projectId = feedbackDetails?.project_id || "";

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "feedback_response_added",
        description: `Response added to feedback`,
        metadata: { feedbackId, isOfficial },
      });

      // Award points for responding to feedback
      if (isOfficial && feedbackDetails) {
        const rewardResult = await rewardsService.processReward({
          userId,
          activityType: "feedback_response_added",
          description: `Responded to feedback as project owner`,
          projectId,
          metadata: {
            feedbackId,
            isOfficial,
          },
        });

        // Trigger award toast for the responder
        if (rewardResult.success && rewardResult.points > 0) {
          const awardEvent = new CustomEvent("award:received", {
            detail: {
              points: rewardResult.points,
              title: "Response Added!",
              description: `You earned points for responding to feedback`,
              variant: "default",
            },
          });

          // Dispatch the event
          if (typeof window !== "undefined") {
            window.dispatchEvent(awardEvent);
          }
        }
      }

      return data as FeedbackResponse;
    } catch (error) {
      console.error("Error adding feedback response:", error);
      throw error;
    }
  },

  /**
   * Get responses for a feedback item
   */
  async getFeedbackResponses(feedbackId: string): Promise<FeedbackResponse[]> {
    try {
      const { data, error } = await supabase
        .from("feedback_response")
        .select("*, user:user_id(id, full_name, avatar_url)")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as FeedbackResponse[];
    } catch (error) {
      console.error("Error fetching feedback responses:", error);
      return [];
    }
  },

  /**
   * Get feedback with responses for a project
   */
  async getFeedbackWithResponses(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc(
        "get_feedback_with_responses",
        {
          p_project_id: projectId,
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching feedback with responses:", error);
      return [];
    }
  },

  /**
   * Get feedback time-based trends for projects
   */
  async getFeedbackTimeTrends(
    projectIds: string[],
  ): Promise<FeedbackTimeTrends> {
    try {
      if (!projectIds.length) {
        return {
          daily: [],
          weekly: [],
          monthly: [],
        };
      }

      // Get all feedback for the projects
      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .select("created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!feedbackData || feedbackData.length === 0) {
        return {
          daily: [],
          weekly: [],
          monthly: [],
        };
      }

      // Process daily trends
      const dailyMap = new Map<string, number>();
      const weeklyMap = new Map<string, number>();
      const monthlyMap = new Map<string, number>();

      feedbackData.forEach((item) => {
        const date = new Date(item.created_at);

        // Format for daily (YYYY-MM-DD)
        const dailyKey = date.toISOString().split("T")[0];
        dailyMap.set(dailyKey, (dailyMap.get(dailyKey) || 0) + 1);

        // Format for weekly (YYYY-[W]WW)
        const weekNum = Math.ceil(
          (date.getDate() +
            new Date(date.getFullYear(), date.getMonth(), 1).getDay()) /
            7,
        );
        const weeklyKey = `${date.getFullYear()}-W${weekNum}`;
        weeklyMap.set(weeklyKey, (weeklyMap.get(weeklyKey) || 0) + 1);

        // Format for monthly (YYYY-MM)
        const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(monthlyKey, (monthlyMap.get(monthlyKey) || 0) + 1);
      });

      // Convert maps to arrays
      const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));
      const weekly = Array.from(weeklyMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));
      const monthly = Array.from(monthlyMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      return { daily, weekly, monthly };
    } catch (error) {
      console.error("Error fetching feedback time trends:", error);
      return {
        daily: [],
        weekly: [],
        monthly: [],
      };
    }
  },
};
