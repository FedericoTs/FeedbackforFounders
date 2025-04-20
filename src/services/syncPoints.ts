import { supabase } from "../../supabase/supabase";

/**
 * Service to synchronize user points between the user_activity table and users table
 */
export const syncPointsService = {
  /**
   * Synchronize a user's points by calculating the total from activity records
   * and updating the users table if needed
   */
  async syncUserPoints(userId: string): Promise<{
    success: boolean;
    previousPoints?: number;
    newPoints?: number;
    message?: string;
  }> {
    try {
      console.log(`[Sync Points] Synchronizing points for user: ${userId}`);

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("[Sync Points] Error fetching user data:", userError);
        return {
          success: false,
          message: `Error fetching user data: ${userError.message}`,
        };
      }

      const previousPoints = userData?.points || 0;

      // Calculate total points from user_activity table
      const { data: activityData, error: activityError } = await supabase
        .from("user_activity")
        .select("points")
        .eq("user_id", userId);

      if (activityError) {
        console.error(
          "[Sync Points] Error fetching activity data:",
          activityError,
        );
        return {
          success: false,
          message: `Error fetching activity data: ${activityError.message}`,
        };
      }

      // Sum up all points from activities
      const calculatedPoints = activityData.reduce(
        (sum, activity) => sum + (activity.points || 0),
        0,
      );

      console.log(
        `[Sync Points] User ${userId} - Previous points: ${previousPoints}, Calculated points: ${calculatedPoints}`,
      );

      // If points match, no update needed
      if (previousPoints === calculatedPoints) {
        return {
          success: true,
          previousPoints,
          newPoints: calculatedPoints,
          message: "Points already in sync",
        };
      }

      // Update user's points in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({ points: calculatedPoints })
        .eq("id", userId);

      if (updateError) {
        console.error("[Sync Points] Error updating user points:", updateError);
        return {
          success: false,
          previousPoints,
          newPoints: calculatedPoints,
          message: `Error updating user points: ${updateError.message}`,
        };
      }

      console.log(
        `[Sync Points] Successfully updated user ${userId} points from ${previousPoints} to ${calculatedPoints}`,
      );

      return {
        success: true,
        previousPoints,
        newPoints: calculatedPoints,
        message: `Successfully updated points from ${previousPoints} to ${calculatedPoints}`,
      };
    } catch (error) {
      console.error("[Sync Points] Unexpected error:", error);
      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
      };
    }
  },

  /**
   * Recalculate a user's level based on their points
   */
  async recalculateUserLevel(userId: string): Promise<{
    success: boolean;
    previousLevel?: number;
    newLevel?: number;
    message?: string;
  }> {
    try {
      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points, level")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error(
          "[Sync Points] Error fetching user data for level recalculation:",
          userError,
        );
        return {
          success: false,
          message: `Error fetching user data: ${userError.message}`,
        };
      }

      const points = userData?.points || 0;
      const previousLevel = userData?.level || 1;

      // Calculate level based on points
      let newLevel = 1;
      if (points >= 10000) newLevel = 10;
      else if (points >= 7500) newLevel = 9;
      else if (points >= 5000) newLevel = 8;
      else if (points >= 3500) newLevel = 7;
      else if (points >= 2000) newLevel = 6;
      else if (points >= 1000) newLevel = 5;
      else if (points >= 500) newLevel = 4;
      else if (points >= 250) newLevel = 3;
      else if (points >= 100) newLevel = 2;

      // Calculate points needed for next level
      let pointsToNextLevel = 100;
      if (newLevel === 1) pointsToNextLevel = 100;
      else if (newLevel === 2) pointsToNextLevel = 250;
      else if (newLevel === 3) pointsToNextLevel = 500;
      else if (newLevel === 4) pointsToNextLevel = 1000;
      else if (newLevel === 5) pointsToNextLevel = 2000;
      else if (newLevel === 6) pointsToNextLevel = 3500;
      else if (newLevel === 7) pointsToNextLevel = 5000;
      else if (newLevel === 8) pointsToNextLevel = 7500;
      else if (newLevel === 9) pointsToNextLevel = 10000;
      else if (newLevel === 10) pointsToNextLevel = 15000;

      // If level is already correct, no update needed
      if (previousLevel === newLevel) {
        return {
          success: true,
          previousLevel,
          newLevel,
          message: "Level already correct",
        };
      }

      // Update user's level in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          level: newLevel,
          points_to_next_level: pointsToNextLevel,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[Sync Points] Error updating user level:", updateError);
        return {
          success: false,
          previousLevel,
          newLevel,
          message: `Error updating user level: ${updateError.message}`,
        };
      }

      console.log(
        `[Sync Points] Successfully updated user ${userId} level from ${previousLevel} to ${newLevel}`,
      );

      return {
        success: true,
        previousLevel,
        newLevel,
        message: `Successfully updated level from ${previousLevel} to ${newLevel}`,
      };
    } catch (error) {
      console.error(
        "[Sync Points] Unexpected error in recalculateUserLevel:",
        error,
      );
      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
      };
    }
  },

  /**
   * Fully synchronize a user's points and level
   */
  async fullSync(userId: string): Promise<{
    success: boolean;
    pointsUpdated: boolean;
    levelUpdated: boolean;
    message?: string;
  }> {
    try {
      // First sync points
      const pointsResult = await this.syncUserPoints(userId);

      // Then recalculate level based on the updated points
      const levelResult = await this.recalculateUserLevel(userId);

      return {
        success: pointsResult.success && levelResult.success,
        pointsUpdated:
          pointsResult.success &&
          pointsResult.previousPoints !== pointsResult.newPoints,
        levelUpdated:
          levelResult.success &&
          levelResult.previousLevel !== levelResult.newLevel,
        message: `Points: ${pointsResult.message}. Level: ${levelResult.message}`,
      };
    } catch (error) {
      console.error("[Sync Points] Unexpected error in fullSync:", error);
      return {
        success: false,
        pointsUpdated: false,
        levelUpdated: false,
        message: `Unexpected error: ${error.message}`,
      };
    }
  },
};
