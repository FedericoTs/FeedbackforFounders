import { supabase } from "@/supabase/supabase";
import { activityService } from "./activity";
import { pointsService } from "./points";

export type ActivityType =
  | "feedback_given"
  | "feedback_quality"
  | "project_created"
  | "project_updated"
  | "daily_login"
  | "profile_completed"
  | "feedback_received"
  | "goal_created"
  | "goal_completed"
  | "questionnaire_created"
  | "questionnaire_response"
  | "streak_milestone"
  | "feedback_response"
  | "level_up";

export interface AwardPointsParams {
  userId: string;
  points: number;
  activityType: ActivityType | string;
  description?: string;
  metadata?: Record<string, any>;
  projectId?: string;
}

export interface AwardPointsResult {
  success: boolean;
  message?: string;
  points?: number;
  totalPoints?: number;
  level?: number;
  pointsToNextLevel?: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
}

export const gamificationService = {
  /**
   * Award points to a user - this is the legacy method, use pointsService.awardPoints instead
   */
  async awardPoints(params: AwardPointsParams): Promise<AwardPointsResult> {
    try {
      const { userId, points, activityType, description, metadata, projectId } =
        params;

      console.warn(
        "[Gamification Service] awardPoints is deprecated, use pointsService.awardPoints instead",
      );

      // Convert to the new format and use pointsService
      const result = await pointsService.awardPoints({
        userId,
        actionType: activityType,
        description,
        metadata: { ...metadata, projectId, legacyPoints: points },
      });

      return {
        success: result.success,
        message: result.message,
        points: result.points,
        totalPoints: result.totalPoints,
        level: result.level,
        pointsToNextLevel: result.pointsToNextLevel,
        leveledUp: result.leveledUp,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
      };
    } catch (error) {
      console.error("[Gamification Service] Error in awardPoints:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  },

  /**
   * Calculate user's level based on points
   */
  calculateLevel(points: number): { level: number; pointsToNextLevel: number } {
    // Simple level calculation formula
    // Level 1: 0-99 points
    // Level 2: 100-249 points
    // Level 3: 250-449 points
    // Each level requires 50% more points than the previous

    let level = 1;
    let threshold = 100; // Points needed for level 2
    let prevThreshold = 0;

    while (points >= threshold) {
      level++;
      prevThreshold = threshold;
      threshold = Math.round(threshold + (threshold - prevThreshold) * 1.5);
    }

    return {
      level,
      pointsToNextLevel: threshold,
    };
  },

  /**
   * Record activity and award points in a single operation
   */
  async recordActivityWithPoints(params: {
    userId: string;
    activityType: ActivityType;
    description?: string;
    metadata?: Record<string, any>;
    projectId?: string;
  }): Promise<AwardPointsResult> {
    try {
      const { userId, activityType, description, metadata, projectId } = params;

      // First award points using the points service
      const pointsResult = await pointsService.awardPoints({
        userId,
        actionType: activityType,
        description,
        metadata: { ...metadata, projectId },
      });

      // Then record the activity
      if (pointsResult.success) {
        try {
          await activityService.recordActivity({
            user_id: userId,
            activity_type: activityType,
            description: description || `Performed ${activityType}`,
            points: pointsResult.points || 0,
            metadata: { ...metadata, projectId },
            project_id: projectId,
          });
        } catch (activityError) {
          console.error(
            "[Gamification Service] Error recording activity:",
            activityError,
          );
          // Continue execution even if recording the activity fails
        }

        // If user leveled up, record a level_up activity
        if (pointsResult.leveledUp) {
          try {
            await activityService.recordActivity({
              user_id: userId,
              activity_type: "level_up",
              description: `Leveled up to level ${pointsResult.newLevel}!`,
              points: 0, // No points for leveling up (already awarded)
              metadata: {
                oldLevel: pointsResult.oldLevel,
                newLevel: pointsResult.newLevel,
                pointsToNextLevel: pointsResult.pointsToNextLevel,
              },
            });
          } catch (levelError) {
            console.error(
              "[Gamification Service] Error recording level up activity:",
              levelError,
            );
            // Continue execution even if recording the level up activity fails
          }
        }
      }

      return pointsResult;
    } catch (error) {
      console.error(
        "[Gamification Service] Error in recordActivityWithPoints:",
        error,
      );
      return { success: false, message: "An unexpected error occurred" };
    }
  },

  /**
   * Get user's gamification profile including points, level, and achievements
   */
  async getUserGamificationProfile(userId: string): Promise<{
    points: number;
    level: number;
    pointsToNextLevel: number;
    progressPercentage: number;
    recentActivities: any[];
    statistics: any;
    achievements?: any[];
  }> {
    try {
      // Get user level info
      const levelInfo = await pointsService.getUserLevelInfo(userId);

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activitiesError) throw activitiesError;

      // Get point statistics
      const statistics = await pointsService.getUserPointStatistics(userId);

      // In the future, we'll add achievements here

      return {
        ...levelInfo,
        recentActivities: activities || [],
        statistics: statistics || null,
        achievements: [], // Placeholder for future implementation
      };
    } catch (error) {
      console.error(
        "[Gamification Service] Error getting user gamification profile:",
        error,
      );
      return {
        points: 0,
        level: 1,
        pointsToNextLevel: 100,
        progressPercentage: 0,
        recentActivities: [],
        statistics: null,
      };
    }
  },
};
