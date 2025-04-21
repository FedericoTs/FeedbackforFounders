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
      // Check if an activity record already exists, but don't make assumptions yet
      let existingActivityFound = false;
      if (params.projectId) {
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", params.userId)
          .eq("activity_type", params.activityType)
          .eq("project_id", params.projectId)
          .limit(1);

        if (!checkError && existingActivity && existingActivity.length > 0) {
          console.log(
            `[Gamification Service] Activity ${params.activityType} may already exist for project ${params.projectId}, will verify after processing`,
          );
          existingActivityFound = true;
          // We'll still update the points, and verify activity recording later
        }
      }

      // Try to invoke the gamification function to award points
      try {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-gamification",
          {
            method: "POST",
            body: params,
          },
        );

        if (error) {
          console.error(
            "[Gamification Service] Error awarding points via edge function:",
            error,
          );
          // Don't throw here, continue to fallback
        } else {
          // Edge function worked, still do the fallback update for consistency
          await this.updateUserPointsDirectly(params.userId, params.points);
          return data;
        }
      } catch (edgeFunctionError) {
        console.error(
          "[Gamification Service] Exception in edge function call:",
          edgeFunctionError,
        );
        // Continue to fallback
      }

      // Fallback: Directly update the users table if edge function fails
      console.log(
        "[Gamification Service] Using direct database update fallback",
      );

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
        throw new Error("Failed to fetch user data for points update");
      }

      // Calculate new points and level
      const currentPoints = userData?.points || 0;
      const currentLevel = userData?.level || 1;
      const pointsToNextLevel = userData?.points_to_next_level || 100;

      const newPoints = currentPoints + params.points;
      let newLevel = currentLevel;
      let newPointsToNextLevel = pointsToNextLevel;
      let didLevelUp = false;

      // Check if user leveled up
      if (newPoints >= pointsToNextLevel) {
        newLevel = currentLevel + 1;
        newPointsToNextLevel = Math.round(pointsToNextLevel * 1.5); // Increase points needed for next level
        didLevelUp = true;
      }

      // Update user points and level
      const { error: updateError } = await supabase
        .from("users")
        .update({
          points: newPoints,
          level: newLevel,
          points_to_next_level: newPointsToNextLevel,
        })
        .eq("id", params.userId);

      if (updateError) {
        console.error(
          "[Gamification Service] Error updating user points directly:",
          updateError,
        );
        throw new Error("Failed to update user points");
      }

      console.log(
        `[Gamification Service] Successfully updated user ${params.userId} points to ${newPoints} via fallback`,
      );

      // Check if activity already exists before recording
      let activityExists = false;
      if (params.projectId) {
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", params.userId)
          .eq("activity_type", params.activityType)
          .eq("project_id", params.projectId)
          .limit(1);

        activityExists =
          !checkError && existingActivity && existingActivity.length > 0;
      }

      // Record activity directly if we're using the fallback and activity doesn't exist
      if (!activityExists) {
        try {
          await supabase.from("user_activity").insert({
            user_id: params.userId,
            activity_type: params.activityType,
            description: params.description,
            points: params.points,
            metadata: params.metadata,
            project_id: params.projectId,
          });
        } catch (activityError) {
          console.error(
            "[Gamification Service] Error recording activity in fallback:",
            activityError,
          );
          // Continue even if activity recording fails
        }
      }

      // If user leveled up, record that as a separate activity
      if (didLevelUp) {
        try {
          await supabase.from("user_activity").insert({
            user_id: params.userId,
            activity_type: "level_up",
            description: `Congratulations! You've reached level ${newLevel}!`,
            points: 0,
            metadata: { oldLevel: currentLevel, newLevel },
          });
        } catch (levelUpError) {
          console.error(
            "[Gamification Service] Error recording level up activity:",
            levelUpError,
          );
          // Continue even if level up activity recording fails
        }
      }

      // Return a response similar to what the edge function would return
      return {
        success: true,
        points: newPoints,
        level: newLevel,
        leveledUp: didLevelUp,
      };
    } catch (error) {
      console.error(
        "[Gamification Service] Unexpected error in awardPoints:",
        error,
      );

      // Last resort fallback - just try to update points without any other logic
      try {
        await this.updateUserPointsDirectly(params.userId, params.points);
        return {
          success: true,
          points: params.points,
          level: 1,
          leveledUp: false,
        };
      } catch (lastResortError) {
        console.error(
          "[Gamification Service] Last resort fallback also failed:",
          lastResortError,
        );
        throw error; // Throw the original error
      }
    }
  },

  /**
   * Helper method to directly update user points
   * Used as a fallback when the edge function fails
   */
  async updateUserPointsDirectly(
    userId: string,
    pointsToAdd: number,
  ): Promise<boolean> {
    if (pointsToAdd === 0) return true; // No need to update if points is 0

    try {
      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error(
          "[Gamification Service] Error fetching user data for direct update:",
          userError,
        );
        return false;
      }

      // Calculate new points
      const newPoints = (userData?.points || 0) + pointsToAdd;

      // Update user points directly
      const { error: updateError } = await supabase
        .from("users")
        .update({ points: newPoints })
        .eq("id", userId);

      if (updateError) {
        console.error(
          "[Gamification Service] Error in direct points update:",
          updateError,
        );
        return false;
      }

      console.log(
        `[Gamification Service] Successfully updated user ${userId} points to ${newPoints} directly`,
      );
      return true;
    } catch (error) {
      console.error(
        "[Gamification Service] Unexpected error in direct points update:",
        error,
      );
      return false;
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
