import { supabase } from "../../supabase/supabase";
import { rewardsService } from "./rewards";

export interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment: number;
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

      // Insert feedback into database
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .insert({
          project_id: feedback.projectId,
          user_id: feedback.userId,
          section_id: feedback.sectionId,
          section_name: feedback.sectionName,
          section_type: feedback.sectionType,
          content: feedback.content,
          sentiment: qualityMetrics.sentiment,
          category: feedback.category,
          subcategory: feedback.subcategory,
          actionability_score: qualityMetrics.actionabilityScore,
          specificity_score: qualityMetrics.specificityScore,
          novelty_score: qualityMetrics.noveltyScore,
          screenshot_url: feedback.screenshotUrl,
          screenshot_annotations: feedback.screenshotAnnotations,
          quick_reactions: feedback.quickReactions,
          rating: 5, // Default rating if not provided
        })
        .select("id")
        .single();

      if (feedbackError) {
        console.error("Error inserting feedback:", feedbackError);
        throw new Error(`Failed to submit feedback: ${feedbackError.message}`);
      }

      console.log("Feedback inserted successfully:", feedbackData);
      const feedbackId = feedbackData.id;

      try {
        // Award base points for feedback submission
        await rewardsService.processReward({
          userId: feedback.userId,
          activityType: "feedback_given",
          description: `Provided feedback on project`,
          projectId: feedback.projectId,
          metadata: {
            feedbackId,
            sectionId: feedback.sectionId,
            sectionName: feedback.sectionName,
          },
        });
        console.log("Base reward processed");

        // Calculate quality points
        const qualityPoints = this.calculateQualityPoints(qualityMetrics);
        console.log("Quality points calculated:", qualityPoints);

        // Award quality points if above threshold
        if (qualityPoints > 0) {
          await rewardsService.processReward({
            userId: feedback.userId,
            activityType: "feedback_quality",
            description: `Provided high-quality feedback`,
            projectId: feedback.projectId,
            metadata: {
              feedbackId,
              qualityMetrics,
              qualityPoints,
            },
          });
          console.log("Quality reward processed");
        }

        // Update feedback record with points awarded
        await supabase
          .from("feedback")
          .update({ points_awarded: 10 + qualityPoints })
          .eq("id", feedbackId);
        console.log("Feedback record updated with points");

        // Update project section feedback count
        await this.updateSectionFeedbackCount(
          feedback.projectId,
          feedback.sectionId,
        );
        console.log("Section feedback count updated");

        // Check for achievements
        await this.checkFeedbackAchievements(feedback.userId);
        console.log("Achievements checked");
      } catch (rewardError) {
        console.error("Error processing rewards (non-critical):", rewardError);
        // Continue even if rewards processing fails
      }

      return {
        success: true,
        feedbackId,
        points: 10 + this.calculateQualityPoints(qualityMetrics), // Base points + quality points
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
   * Analyze feedback quality using AI
   */
  async analyzeFeedbackQuality(
    content: string,
  ): Promise<FeedbackQualityMetrics> {
    try {
      // Call the feedback-analysis edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-feedback-analysis",
        {
          body: { content },
        },
      );

      if (error) {
        console.error("Error analyzing feedback:", error);
        // Return default metrics if analysis fails
        return {
          specificityScore: 0.5,
          actionabilityScore: 0.5,
          noveltyScore: 0.5,
          sentiment: 0,
        };
      }

      return data;
    } catch (error) {
      console.error("Error in analyzeFeedbackQuality:", error);
      // Return default metrics if analysis fails
      return {
        specificityScore: 0.5,
        actionabilityScore: 0.5,
        noveltyScore: 0.5,
        sentiment: 0,
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
