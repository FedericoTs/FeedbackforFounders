import { supabase } from "../../supabase/supabase";
import { rewardsService } from "./rewards";

export interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment: number;
  category?: string;
  subcategory?: string;
}

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
  pageUrl?: string; // Store the iframe URL for multi-page feedback
  elementSelector?: string | null; // DOM selector for the element being commented on
}

export const feedbackService = {
  /**
   * Submit feedback and calculate quality points
   */
  async submitFeedback(feedback: FeedbackSubmission): Promise<{
    success: boolean;
    feedbackId?: string;
    points?: number;
    qualityMetrics?: FeedbackQualityMetrics;
    message?: string;
  }> {
    try {
      console.log("Starting feedback submission process", feedback);

      // First, analyze feedback quality using AI
      const qualityMetrics = await this.analyzeFeedbackQuality(
        feedback.content,
      );
      console.log("Quality metrics analyzed:", qualityMetrics);

      let feedbackId: string | undefined;
      let insertSuccess = false;

      // Insert feedback into database with error handling for missing columns
      try {
        // First check if the user has permission to submit feedback for this project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, visibility")
          .eq("id", feedback.projectId)
          .single();

        if (projectError) {
          console.warn(
            "Could not verify project access, but will try to submit feedback anyway",
            projectError,
          );
        }

        // Prepare feedback data with only essential fields
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
        };

        // Add optional fields if they exist
        if (qualityMetrics.sentiment !== undefined)
          feedbackData.sentiment = qualityMetrics.sentiment;
        if (qualityMetrics.actionabilityScore !== undefined)
          feedbackData.actionability_score = qualityMetrics.actionabilityScore;
        if (qualityMetrics.specificityScore !== undefined)
          feedbackData.specificity_score = qualityMetrics.specificityScore;
        if (qualityMetrics.noveltyScore !== undefined)
          feedbackData.novelty_score = qualityMetrics.noveltyScore;
        if (feedback.subcategory)
          feedbackData.subcategory = feedback.subcategory;
        if (feedback.pageUrl) feedbackData.page_url = feedback.pageUrl;
        if (feedback.screenshotUrl)
          feedbackData.screenshot_url = feedback.screenshotUrl;

        // Try the new RPC function first
        try {
          const { data: insertedData, error: feedbackError } =
            await supabase.rpc("submit_feedback_v2", {
              feedback_data: feedbackData,
            });

          if (feedbackError) {
            console.warn(
              "New RPC method failed, trying original RPC",
              feedbackError,
            );
            throw feedbackError; // Will be caught by the next try/catch
          }

          if (!insertedData.success) {
            console.warn(
              "New RPC method returned failure:",
              insertedData.error,
            );
            throw new Error(insertedData.error || "Unknown error"); // Will be caught by the next try/catch
          }

          feedbackId = insertedData.id;
          insertSuccess = true;
          console.log(
            "Successfully inserted feedback using submit_feedback_v2",
          );

          // Return success response
          return {
            success: true,
            feedbackId,
            points: 10 + this.calculateQualityPoints(qualityMetrics),
            qualityMetrics,
            message: "Feedback submitted successfully",
          };
        } catch (newRpcError) {
          // Try original RPC call
          try {
            console.log("Trying original submit_feedback RPC...");
            const { data: insertedData, error: feedbackError } =
              await supabase.rpc("submit_feedback", {
                feedback_data: feedbackData,
              });

            if (feedbackError) {
              console.warn(
                "Original RPC method failed, falling back to direct insert",
                feedbackError,
              );
              throw feedbackError; // Will be caught by the outer try/catch
            }

            feedbackId = insertedData.id;
            insertSuccess = true;
            console.log("Successfully inserted feedback using submit_feedback");

            // Return success response
            return {
              success: true,
              feedbackId,
              points: 10 + this.calculateQualityPoints(qualityMetrics),
              qualityMetrics,
              message: "Feedback submitted successfully",
            };
          } catch (rpcError) {
            // Fall back to direct insert
            try {
              console.log("Trying direct insert as last resort...");
              const { data: directData, error: directError } = await supabase
                .from("feedback")
                .insert(feedbackData)
                .select("id")
                .single();

              if (directError) {
                console.error("Direct insert failed:", directError);
                throw directError;
              }

              feedbackId = directData.id;
              insertSuccess = true;
              console.log("Successfully inserted feedback using direct insert");

              // Return success response
              return {
                success: true,
                feedbackId,
                points: 10 + this.calculateQualityPoints(qualityMetrics),
                qualityMetrics,
                message: "Feedback submitted successfully",
              };
            } catch (directInsertError) {
              console.error("All insertion methods failed:", directInsertError);
              throw directInsertError;
            }
          }
        }
      } catch (insertError) {
        console.error("Error during feedback insertion:", insertError);
        throw insertError;
      }
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
   * Analyze feedback quality using AI
   */
  async analyzeFeedbackQuality(
    content: string,
  ): Promise<FeedbackQualityMetrics> {
    try {
      // Try to call the feedback-analysis edge function
      try {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-feedback-analysis",
          {
            body: { content },
          },
        );

        if (!error && data) {
          return data;
        }
      } catch (edgeFunctionError) {
        console.warn(
          "Edge function error, using fallback analysis",
          edgeFunctionError,
        );
      }

      // If edge function fails, use local analysis
      console.log("Using local fallback for feedback quality analysis");

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
    } catch (error) {
      console.error("Error in analyzeFeedbackQuality:", error);
      // Return default metrics if analysis fails
      return {
        specificityScore: 0.5,
        actionabilityScore: 0.5,
        noveltyScore: 0.5,
        sentiment: 0,
        category: "Other",
        subcategory: "General Feedback",
      };
    }
  },

  /**
   * Calculate quality points based on metrics
   */
  calculateQualityPoints(metrics: FeedbackQualityMetrics): number {
    try {
      // Start with base calculation
      let qualityPoints = 0;

      // Apply multipliers based on AI analysis
      const specificityMultiplier = 0.5 + metrics.specificityScore * 1.5; // 0.5-2x range
      const actionabilityMultiplier = 0.5 + metrics.actionabilityScore * 1.5; // 0.5-2x range
      const noveltyMultiplier = 0.5 + metrics.noveltyScore * 1.5; // 0.5-2x range

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
   * Update section feedback count
   */
  async updateSectionFeedbackCount(
    projectId: string,
    sectionId: string,
  ): Promise<void> {
    try {
      // Check if section exists
      const { data: sectionData, error: sectionError } = await supabase
        .from("project_sections")
        .select("id, feedback_count")
        .eq("project_id", projectId)
        .eq("section_id", sectionId)
        .single();

      if (sectionError) {
        // Section doesn't exist, create it
        await supabase.from("project_sections").insert({
          project_id: projectId,
          section_id: sectionId,
          section_name: "Unknown Section", // Will be updated later
          section_type: "unknown", // Will be updated later
          feedback_count: 1,
        });
      } else {
        // Update existing section
        await supabase
          .from("project_sections")
          .update({ feedback_count: (sectionData.feedback_count || 0) + 1 })
          .eq("id", sectionData.id);
      }
    } catch (error) {
      console.error("Error updating section feedback count:", error);
    }
  },

  /**
   * Check for feedback-related achievements
   */
  async checkFeedbackAchievements(userId: string): Promise<void> {
    try {
      // Count total feedback provided
      const { count: feedbackCount, error: countError } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) throw countError;

      // Check for Feedback Champion achievement (10 different projects)
      if (feedbackCount && feedbackCount >= 10) {
        // Count unique projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("feedback")
          .select("project_id")
          .eq("user_id", userId)
          .limit(1000);

        if (projectsError) throw projectsError;

        // Get unique project count
        const uniqueProjects = new Set(
          projectsData.map((item) => item.project_id),
        ).size;

        if (uniqueProjects >= 10) {
          // Check if achievement already earned
          const { data: achievementData, error: achievementError } =
            await supabase
              .from("user_achievements")
              .select("id")
              .eq("user_id", userId)
              .eq("achievement_name", "Feedback Champion")
              .limit(1);

          if (
            !achievementError &&
            (!achievementData || achievementData.length === 0)
          ) {
            // Award achievement
            await supabase.from("user_achievements").insert({
              user_id: userId,
              achievement_name: "Feedback Champion",
              earned_at: new Date().toISOString(),
            });

            // Process achievement reward
            await rewardsService.processReward({
              userId,
              activityType: "achievement_earned",
              description: "Earned Feedback Champion achievement",
              metadata: {
                achievementName: "Feedback Champion",
                achievementDescription:
                  "Give feedback to 10 different projects",
              },
            });
          }
        }
      }

      // Check for Quality Reviewer achievement (average quality score >= 0.8)
      const { data: qualityData, error: qualityError } = await supabase
        .from("feedback")
        .select("specificity_score, actionability_score, novelty_score")
        .eq("user_id", userId)
        .limit(1000);

      if (!qualityError && qualityData && qualityData.length >= 5) {
        // Calculate average quality score
        let totalQualityScore = 0;
        let validScores = 0;

        qualityData.forEach((item) => {
          if (
            item.specificity_score &&
            item.actionability_score &&
            item.novelty_score
          ) {
            const avgScore =
              (item.specificity_score +
                item.actionability_score +
                item.novelty_score) /
              3;
            totalQualityScore += avgScore;
            validScores++;
          }
        });

        const averageQualityScore =
          validScores > 0 ? totalQualityScore / validScores : 0;

        if (averageQualityScore >= 0.8 && validScores >= 5) {
          // Check if achievement already earned
          const { data: achievementData, error: achievementError } =
            await supabase
              .from("user_achievements")
              .select("id")
              .eq("user_id", userId)
              .eq("achievement_name", "Quality Reviewer")
              .limit(1);

          if (
            !achievementError &&
            (!achievementData || achievementData.length === 0)
          ) {
            // Award achievement
            await supabase.from("user_achievements").insert({
              user_id: userId,
              achievement_name: "Quality Reviewer",
              earned_at: new Date().toISOString(),
            });

            // Process achievement reward
            await rewardsService.processReward({
              userId,
              activityType: "achievement_earned",
              description: "Earned Quality Reviewer achievement",
              metadata: {
                achievementName: "Quality Reviewer",
                achievementDescription:
                  "Achieve an average feedback quality score of 0.8+",
                averageQualityScore,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking feedback achievements:", error);
    }
  },

  /**
   * Get feedback for a project
   */
  async getProjectFeedback(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
          *,
          user:user_id (id, name, avatar_url, level)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting project feedback:", error);
      return [];
    }
  },

  /**
   * Get feedback for a specific section
   */
  async getSectionFeedback(
    projectId: string,
    sectionId: string,
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
          *,
          user:user_id (id, name, avatar_url, level)
        `,
        )
        .eq("project_id", projectId)
        .eq("section_id", sectionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting section feedback:", error);
      return [];
    }
  },

  /**
   * Get project sections with feedback counts
   */
  async getProjectSections(projectId: string): Promise<any[]> {
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
};
