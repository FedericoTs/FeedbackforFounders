import { supabase } from "../../supabase/supabase";

export type ActivityType =
  | "feedback_given"
  | "feedback_received"
  | "project_created"
  | "achievement_earned"
  | "level_up";

export interface AwardPointsParams {
  userId: string;
  points: number;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, any>;
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
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-gamification",
      {
        method: "POST",
        body: params,
      },
    );

    if (error) {
      console.error("Error awarding points:", error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Get point values for different activities
   */
  getPointValues(): Record<ActivityType, number> {
    return {
      feedback_given: 10,
      feedback_received: 5,
      project_created: 20,
      achievement_earned: 0, // Variable based on achievement
      level_up: 0, // No points for leveling up
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
};
