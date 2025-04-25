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
   * Get leaderboard data with filtering options
   */
  async getLeaderboard(
    timeframe: "all" | "month" | "week" = "all",
    limit = 10,
    offset = 0,
    category: "points" | "feedback" | "projects" | "achievements" = "points",
  ): Promise<any[]> {
    try {
      // Use the optimized RPC function for points category
      if (category === "points") {
        const { data, error } = await supabase.rpc("get_leaderboard", {
          p_timeframe: timeframe,
          p_category: category,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) throw error;
        return data || [];
      }

      // For other categories, use specific queries
      // These could be optimized with additional materialized views in the future
      else if (category === "feedback") {
        // Get users with most feedback given
        const { data, error } = await supabase
          .from("user_activity")
          .select(
            "user_id, users!user_activity_user_id_fkey(id, name, avatar_url, level), count(*)",
          )
          .in("activity_type", ["feedback_given", "feedback_quality"])
          .group("user_id, users.id, users.name, users.avatar_url, users.level")
          .order("count", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Transform the data to match the expected format
        return (data || []).map((item) => ({
          id: item.user_id,
          name: item.users?.name,
          avatar_url: item.users?.avatar_url,
          level: item.users?.level,
          points: parseInt(item.count),
          category: "feedback",
        }));
      } else if (category === "projects") {
        // Get users with most projects created
        const { data, error } = await supabase
          .from("user_activity")
          .select(
            "user_id, users!user_activity_user_id_fkey(id, name, avatar_url, level), count(*)",
          )
          .eq("activity_type", "project_created")
          .group("user_id, users.id, users.name, users.avatar_url, users.level")
          .order("count", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Transform the data to match the expected format
        return (data || []).map((item) => ({
          id: item.user_id,
          name: item.users?.name,
          avatar_url: item.users?.avatar_url,
          level: item.users?.level,
          points: parseInt(item.count),
          category: "projects",
        }));
      } else if (category === "achievements") {
        // Get users with most achievements
        const { data, error } = await supabase
          .from("user_achievements")
          .select(
            "user_id, users!user_achievements_user_id_fkey(id, name, avatar_url, level), count(*)",
          )
          .group("user_id, users.id, users.name, users.avatar_url, users.level")
          .order("count", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Transform the data to match the expected format
        return (data || []).map((item) => ({
          id: item.user_id,
          name: item.users?.name,
          avatar_url: item.users?.avatar_url,
          level: item.users?.level,
          points: parseInt(item.count),
          category: "achievements",
        }));
      }

      // Fallback to the default points leaderboard
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_timeframe: timeframe,
        p_category: "points",
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[Points Service] Error fetching leaderboard:", error);
      return [];
    }
  },

  /**
   * Get user's rank on the leaderboard with detailed information
   */
  async getUserRank(
    userId: string,
    timeframe: "all" | "month" | "week" = "all",
    category: "points" | "feedback" | "projects" | "achievements" = "points",
  ): Promise<{
    rank: number;
    total: number;
    percentile?: number;
    points?: number;
    highestRank?: number;
    highestLevel?: number;
  }> {
    try {
      // Use the optimized RPC function for points category
      if (category === "points") {
        const { data, error } = await supabase.rpc("get_user_rank_details", {
          p_user_id: userId,
          p_timeframe: timeframe,
          p_category: category,
        });

        if (error) throw error;
        if (!data || data.length === 0) return { rank: 0, total: 0 };

        return {
          rank: data[0].rank,
          total: data[0].total_users,
          percentile: data[0].percentile,
          points: data[0].points,
          highestRank: data[0].highest_rank,
          highestLevel: data[0].highest_level,
        };
      }

      // For other categories, calculate rank manually
      // This could be optimized with additional functions in the future
      const leaderboardData = await this.getLeaderboard(
        timeframe,
        1000, // Get a large number to ensure we find the user
        0,
        category,
      );

      // Find the user in the leaderboard
      const userIndex = leaderboardData.findIndex((item) => item.id === userId);

      if (userIndex === -1) {
        return { rank: 0, total: leaderboardData.length };
      }

      return {
        rank: userIndex + 1,
        total: leaderboardData.length,
        points: leaderboardData[userIndex].points,
      };
    } catch (error) {
      console.error("[Points Service] Error getting user rank:", error);
      return { rank: 0, total: 0 };
    }
  },

  /**
   * Refresh the leaderboard materialized view
   */
  async refreshLeaderboard(): Promise<boolean> {
    try {
      // Check if supabase is initialized
      if (!supabase) {
        console.error("[Points Service] Supabase client not initialized");
        return false;
      }

      const { data, error } = await supabase.rpc("refresh_leaderboard_mv");
      if (error) {
        console.error("[Points Service] Error refreshing leaderboard:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[Points Service] Error refreshing leaderboard:", error);
      return false;
    }
  },

  /**
   * Get user's rank history over time
   */
  async getUserRankHistory(
    userId: string,
    limit = 10,
  ): Promise<{ date: string; rank: number; total: number }[]> {
    try {
      // This is a simplified implementation that uses point_transactions to estimate historical ranks
      // A more accurate implementation would require storing rank history in a separate table
      const { data: transactions, error } = await supabase
        .from("point_transactions")
        .select("created_at, points")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!transactions || transactions.length === 0) return [];

      // Group transactions by day and calculate cumulative points
      const pointsByDay: Record<string, number> = {};
      let cumulativePoints = 0;

      transactions.forEach((transaction) => {
        const date = new Date(transaction.created_at)
          .toISOString()
          .split("T")[0];
        cumulativePoints += transaction.points;
        pointsByDay[date] = cumulativePoints;
      });

      // For each day, estimate the rank based on the points
      // This is a simplified approach and not entirely accurate
      const rankHistory = await Promise.all(
        Object.entries(pointsByDay).map(async ([date, points]) => {
          // Estimate rank based on current distribution
          const { data: usersWithMorePoints, error: rankError } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gt("points", points);

          if (rankError) throw rankError;

          // Get total users
          const { count: total, error: totalError } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true });

          if (totalError) throw totalError;

          return {
            date,
            rank: (usersWithMorePoints || 0) + 1,
            total: total || 0,
          };
        }),
      );

      return rankHistory;
    } catch (error) {
      console.error("[Points Service] Error getting user rank history:", error);
      return [];
    }
  },

  /**
   * Get leaderboard categories
   */
  getLeaderboardCategories(): {
    id: string;
    name: string;
    description: string;
  }[] {
    return [
      {
        id: "points",
        name: "Points",
        description: "Users with the most points overall",
      },
      {
        id: "feedback",
        name: "Feedback",
        description: "Users who have given the most feedback",
      },
      {
        id: "projects",
        name: "Projects",
        description: "Users who have created the most projects",
      },
      {
        id: "achievements",
        name: "Achievements",
        description: "Users who have earned the most achievements",
      },
    ];
  },

  /**
   * Get leaderboard timeframes
   */
  getLeaderboardTimeframes(): {
    id: string;
    name: string;
    description: string;
  }[] {
    return [
      {
        id: "all",
        name: "All Time",
        description: "Leaderboard rankings across all time",
      },
      {
        id: "month",
        name: "This Month",
        description: "Leaderboard rankings for the current month",
      },
      {
        id: "week",
        name: "This Week",
        description: "Leaderboard rankings for the current week",
      },
    ];
  },
};
