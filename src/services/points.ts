import { supabase } from "@/supabase/supabase";
import { ActivityType } from "./gamification";
import { useToast } from "@/components/ui/use-toast";

export interface PointRule {
  id: string;
  action_type: string;
  points: number;
  description: string;
  is_active: boolean;
  cooldown_minutes: number;
  max_daily: number | null;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  action_type: string;
  points: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AwardPointsParams {
  userId: string;
  actionType: ActivityType | string;
  description?: string;
  metadata?: Record<string, any>;
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
  cooldownRemainingMinutes?: number;
}

export interface UserPointStatistics {
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  progressPercentage: number;
  pointsToday: number;
  pointsYesterday: number;
  pointsThisWeek: number;
  pointsThisMonth: number;
  topPointSources: Record<string, number>;
}

export const pointsService = {
  /**
   * Award points to a user based on an action, applying rules
   */
  async awardPoints(params: AwardPointsParams): Promise<AwardPointsResult> {
    try {
      const { userId, actionType, description, metadata = {} } = params;

      // Call the database function to award points with rules
      const { data, error } = await supabase.rpc("award_points_with_rules", {
        p_user_id: userId,
        p_action_type: actionType,
        p_description: description,
        p_metadata: metadata,
      });

      if (error) {
        console.error("[Points Service] Error awarding points:", error);
        return { success: false, message: error.message };
      }

      if (!data.success) {
        return {
          success: false,
          message: data.message,
          cooldownRemainingMinutes: data.cooldown_remaining_minutes,
        };
      }

      // Dispatch event for toast notification
      this.dispatchPointsAwardedEvent({
        points: data.points,
        message: data.leveled_up
          ? `Awarded ${data.points} points and leveled up to level ${data.level}!`
          : `Awarded ${data.points} points!`,
        leveledUp: data.leveled_up,
        oldLevel: data.old_level,
        newLevel: data.new_level,
      });

      return {
        success: true,
        points: data.points,
        totalPoints: data.total_points,
        level: data.level,
        pointsToNextLevel: data.points_to_next_level,
        leveledUp: data.leveled_up,
        oldLevel: data.old_level,
        newLevel: data.new_level,
      };
    } catch (error) {
      console.error("[Points Service] Unexpected error in awardPoints:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  },

  /**
   * Dispatch an event for points awarded to show a toast notification
   */
  dispatchPointsAwardedEvent(params: {
    points: number;
    message: string;
    leveledUp?: boolean;
    oldLevel?: number;
    newLevel?: number;
  }) {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        const eventDetail = {
          points: params.points,
          title: params.leveledUp ? "Level Up!" : "Points Awarded!",
          description: params.message,
          variant: params.leveledUp ? "level" : "default",
          oldLevel: params.oldLevel,
          newLevel: params.newLevel,
        };

        // Use setTimeout to ensure the event is dispatched after the component is mounted
        setTimeout(() => {
          try {
            const awardEvent = new CustomEvent("award:received", {
              detail: eventDetail,
            });

            window.dispatchEvent(awardEvent);
            console.log("[Points Service] Award event dispatched");
          } catch (error) {
            console.error(
              "[Points Service] Error dispatching award event:",
              error,
            );
          }
        }, 100);
      }
    } catch (error) {
      console.error(
        "[Points Service] Error in dispatchPointsAwardedEvent:",
        error,
      );
    }
  },

  /**
   * Get point rules
   */
  async getPointRules(): Promise<PointRule[]> {
    try {
      const { data, error } = await supabase
        .from("point_rules")
        .select("*")
        .order("action_type");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[Points Service] Error fetching point rules:", error);
      return [];
    }
  },

  /**
   * Get point transactions for a user
   */
  async getUserPointTransactions(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(
        "[Points Service] Error fetching user point transactions:",
        error,
      );
      return [];
    }
  },

  /**
   * Get point statistics for a user
   */
  async getUserPointStatistics(
    userId: string,
  ): Promise<UserPointStatistics | null> {
    try {
      const { data, error } = await supabase.rpc("get_user_point_statistics", {
        p_user_id: userId,
      });

      if (error) throw error;

      if (!data) return null;

      return {
        totalPoints: data.total_points,
        level: data.level,
        pointsToNextLevel: data.points_to_next_level,
        progressPercentage: data.progress_percentage,
        pointsToday: data.points_today,
        pointsYesterday: data.points_yesterday,
        pointsThisWeek: data.points_this_week,
        pointsThisMonth: data.points_this_month,
        topPointSources: data.top_point_sources || {},
      };
    } catch (error) {
      console.error(
        "[Points Service] Error fetching user point statistics:",
        error,
      );
      return null;
    }
  },

  /**
   * Get user's current level and points
   */
  async getUserLevelInfo(userId: string): Promise<{
    level: number;
    points: number;
    pointsToNextLevel: number;
    progressPercentage: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("level, points, points_to_next_level")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const progressPercentage = data
        ? Math.round((data.points / (data.points_to_next_level || 100)) * 100)
        : 0;

      return {
        level: data?.level || 1,
        points: data?.points || 0,
        pointsToNextLevel: data?.points_to_next_level || 100,
        progressPercentage,
      };
    } catch (error) {
      console.error("[Points Service] Error getting user level info:", error);
      return {
        level: 1,
        points: 0,
        pointsToNextLevel: 100,
        progressPercentage: 0,
      };
    }
  },

  /**
   * Award points for a specific action and show a toast notification
   */
  async awardPointsWithNotification(
    params: AwardPointsParams,
  ): Promise<AwardPointsResult> {
    const result = await this.awardPoints(params);
    return result;
  },

  /**
   * Get leaderboard data
   */
  async getLeaderboard(
    timeframe: "all" | "month" | "week" = "all",
    limit = 10,
    offset = 0,
  ): Promise<any[]> {
    try {
      let query = supabase
        .from("users")
        .select("id, name, avatar_url, level, points")
        .order("points", { ascending: false })
        .range(offset, offset + limit - 1);

      // For future implementation: filter by timeframe using point_transactions
      // This would require a more complex query or a materialized view

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[Points Service] Error fetching leaderboard:", error);
      return [];
    }
  },

  /**
   * Get user's rank on the leaderboard
   */
  async getUserRank(userId: string): Promise<{ rank: number; total: number }> {
    try {
      // Get user's points
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      if (!userData) return { rank: 0, total: 0 };

      // Count users with more points
      const { count: higherRank, error: rankError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gt("points", userData.points);

      if (rankError) throw rankError;

      // Count total users
      const { count: total, error: totalError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      if (totalError) throw totalError;

      // Rank is users with more points + 1
      return {
        rank: (higherRank || 0) + 1,
        total: total || 0,
      };
    } catch (error) {
      console.error("[Points Service] Error getting user rank:", error);
      return { rank: 0, total: 0 };
    }
  },
};
