import { supabase } from "../../supabase/supabase";

export type ActivityType =
  | "feedback_given"
  | "feedback_received"
  | "project_created"
  | "project_updated"
  | "project_promoted"
  | "achievement_earned"
  | "level_up"
  | "daily_login"
  | "profile_completed"
  | "goal_completed"
  | "questionnaire_created"
  | "questionnaire_response";

export interface AwardPointsParams {
  userId: string;
  points: number;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  projectId?: string;
}

export interface AwardPointsResponse {
  success: boolean;
  points: number;
  level: number;
  leveledUp: boolean;
}

export const gamificationService = {
  /**
   * Award points to a user for an activity
   */
  async awardPoints(params: AwardPointsParams): Promise<AwardPointsResponse> {
    console.log("[Gamification Service] Awarding points:", params);

    try {
      // First, invoke the gamification function to award points
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-gamification",
        {
          method: "POST",
          body: params,
        },
      );

      if (error) {
        console.error("[Gamification Service] Error awarding points:", error);
        throw new Error(error.message);
      }

      // As a fallback, also directly update the users table to ensure consistency
      if (data.success && params.points !== 0) {
        try {
          // Get current user data
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("points, level, points_to_next_level")
            .eq("id", params.userId)
            .single();

          if (userError) {
            console.error(
              "[Gamification Service] Error fetching user data:",
              userError,
            );
          } else if (userData) {
            // Calculate new points
            const newPoints = (userData.points || 0) + params.points;

            // Update user points directly as a fallback
            const { error: updateError } = await supabase
              .from("users")
              .update({ points: newPoints })
              .eq("id", params.userId);

            if (updateError) {
              console.error(
                "[Gamification Service] Error updating user points directly:",
                updateError,
              );
            } else {
              console.log(
                `[Gamification Service] Successfully updated user ${params.userId} points to ${newPoints}`,
              );
            }
          }
        } catch (fallbackError) {
          console.error(
            "[Gamification Service] Error in fallback update:",
            fallbackError,
          );
          // Continue with the original response even if the fallback fails
        }
      }

      return data;
    } catch (error) {
      console.error(
        "[Gamification Service] Unexpected error in awardPoints:",
        error,
      );
      throw error;
    }
  },

  /**
   * Get point values for different activities
   */
  getPointValues(): Record<ActivityType, number> {
    return {
      feedback_given: 10,
      feedback_received: 5,
      project_created: 20,
      project_updated: 5,
      project_promoted: 15,
      achievement_earned: 0, // Variable based on achievement
      level_up: 0, // No points for leveling up
      daily_login: 2,
      profile_completed: 15,
      goal_completed: 10,
      questionnaire_created: 10,
      questionnaire_response: 5,
    };
  },

  /**
   * Calculate level from points
   */
  calculateLevel(points: number): number {
    // Simple level calculation
    if (points < 100) return 1;
    if (points < 250) return 2;
    if (points < 500) return 3;
    if (points < 1000) return 4;
    if (points < 2000) return 5;
    if (points < 3500) return 6;
    if (points < 5000) return 7;
    if (points < 7500) return 8;
    if (points < 10000) return 9;
    return 10;
  },

  /**
   * Get points needed for next level
   */
  getPointsForNextLevel(currentLevel: number): number {
    const levelPoints = [
      0, // Level 0 -> 1
      100, // Level 1 -> 2
      250, // Level 2 -> 3
      500, // Level 3 -> 4
      1000, // Level 4 -> 5
      2000, // Level 5 -> 6
      3500, // Level 6 -> 7
      5000, // Level 7 -> 8
      7500, // Level 8 -> 9
      10000, // Level 9 -> 10
      15000, // Level 10 -> 11
    ];

    return currentLevel < levelPoints.length
      ? levelPoints[currentLevel]
      : levelPoints[levelPoints.length - 1] * 1.5;
  },

  /**
   * Check if a user has reached a specific level
   */
  async hasReachedLevel(userId: string, level: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("level")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return (data?.level || 1) >= level;
    } catch (error) {
      console.error("Error checking user level:", error);
      return false;
    }
  },

  /**
   * Get user's current level and points
   */
  async getUserLevelInfo(userId: string): Promise<{
    level: number;
    points: number;
    pointsToNextLevel: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("level, points, points_to_next_level")
        .eq("id", userId)
        .single();

      if (error) throw error;

      return {
        level: data?.level || 1,
        points: data?.points || 0,
        pointsToNextLevel: data?.points_to_next_level || 100,
      };
    } catch (error) {
      console.error("Error getting user level info:", error);
      return { level: 1, points: 0, pointsToNextLevel: 100 };
    }
  },
};
