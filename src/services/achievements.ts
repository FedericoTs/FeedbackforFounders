import { supabase } from "@/supabase/supabase";
import { pointsService } from "./points";
import { activityService } from "./activity";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  points_reward: number;
  criteria: Record<string, any>;
  category: string;
  difficulty: string;
  is_hidden: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  metadata: Record<string, any>;
  achievement?: Achievement;
}

export interface AchievementCategory {
  name: string;
  count: number;
  achievements: Achievement[];
}

export const achievementsService = {
  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("points_reward");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(
        "[Achievements Service] Error getting achievements:",
        error,
      );
      return [];
    }
  },

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(): Promise<AchievementCategory[]> {
    try {
      const achievements = await this.getAllAchievements();

      // Group achievements by category
      const categories: Record<string, Achievement[]> = {};

      achievements.forEach((achievement) => {
        const category = achievement.category || "Other";
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(achievement);
      });

      // Convert to array of categories
      return Object.entries(categories).map(([name, achievements]) => ({
        name,
        count: achievements.length,
        achievements,
      }));
    } catch (error) {
      console.error(
        "[Achievements Service] Error getting achievements by category:",
        error,
      );
      return [];
    }
  },

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievement:achievements(*)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(
        "[Achievements Service] Error getting user achievements:",
        error,
      );
      return [];
    }
  },

  /**
   * Get user achievement progress
   */
  async getUserAchievementProgress(userId: string): Promise<{
    earned: number;
    total: number;
    categories: Record<string, { earned: number; total: number }>;
  }> {
    try {
      // Get all achievements
      const allAchievements = await this.getAllAchievements();

      // Get user achievements
      const userAchievements = await this.getUserAchievements(userId);

      // Calculate progress
      const earned = userAchievements.length;
      const total = allAchievements.length;

      // Calculate progress by category
      const categories: Record<string, { earned: number; total: number }> = {};

      // Initialize categories with all achievements
      allAchievements.forEach((achievement) => {
        const category = achievement.category || "Other";
        if (!categories[category]) {
          categories[category] = { earned: 0, total: 0 };
        }
        categories[category].total++;
      });

      // Count earned achievements by category
      userAchievements.forEach((userAchievement) => {
        const achievement = userAchievement.achievement;
        if (achievement) {
          const category = achievement.category || "Other";
          if (!categories[category]) {
            categories[category] = { earned: 0, total: 0 };
          }
          categories[category].earned++;
        }
      });

      return { earned, total, categories };
    } catch (error) {
      console.error(
        "[Achievements Service] Error getting user achievement progress:",
        error,
      );
      return { earned: 0, total: 0, categories: {} };
    }
  },

  /**
   * Award an achievement to a user
   */
  async awardAchievement(
    userId: string,
    achievementId: string,
    metadata: Record<string, any> = {},
  ): Promise<{
    success: boolean;
    message?: string;
    achievement?: Achievement;
  }> {
    try {
      // Check if user already has this achievement
      const { data: existingAchievement, error: checkError } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_id", achievementId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAchievement) {
        return {
          success: false,
          message: "User already has this achievement",
        };
      }

      // Get achievement details
      const { data: achievement, error: achievementError } = await supabase
        .from("achievements")
        .select("*")
        .eq("id", achievementId)
        .single();

      if (achievementError) throw achievementError;

      if (!achievement) {
        return {
          success: false,
          message: "Achievement not found",
        };
      }

      // Award the achievement
      const { error: awardError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          metadata,
        });

      if (awardError) throw awardError;

      // Award points for the achievement
      if (achievement.points_reward > 0) {
        await pointsService.awardPoints({
          userId,
          actionType: "achievement_earned",
          description: `Earned achievement: ${achievement.name}`,
          metadata: { achievementId, ...metadata },
        });

        // Record activity
        await activityService.recordActivity({
          user_id: userId,
          activity_type: "achievement_earned",
          description: `Earned achievement: ${achievement.name}`,
          points: achievement.points_reward,
          metadata: { achievementId, ...metadata },
        });
      }

      // Dispatch event for toast notification
      if (typeof window !== "undefined" && window.dispatchEvent) {
        const eventDetail = {
          points: achievement.points_reward,
          title: "Achievement Unlocked!",
          description: achievement.name,
          variant: "achievement",
          achievement: achievement,
        };

        const awardEvent = new CustomEvent("award:received", {
          detail: eventDetail,
        });

        window.dispatchEvent(awardEvent);
      }

      return {
        success: true,
        message: `Achievement awarded: ${achievement.name}`,
        achievement,
      };
    } catch (error) {
      console.error(
        "[Achievements Service] Error awarding achievement:",
        error,
      );
      return {
        success: false,
        message: "Error awarding achievement",
      };
    }
  },

  /**
   * Check and award achievements based on criteria
   */
  async checkAndAwardAchievements(
    userId: string,
    actionType: string,
    actionData: Record<string, any> = {},
  ): Promise<{
    awarded: Achievement[];
  }> {
    try {
      // Get achievements that match the action type
      const { data: eligibleAchievements, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .filter("criteria->action", "eq", actionType);

      if (error) throw error;

      if (!eligibleAchievements || eligibleAchievements.length === 0) {
        return { awarded: [] };
      }

      const awardedAchievements: Achievement[] = [];

      // Check each eligible achievement
      for (const achievement of eligibleAchievements) {
        const criteria = achievement.criteria || {};
        let shouldAward = true;

        // Check count criteria
        if (criteria.count && typeof criteria.count === "number") {
          // Get count of activities of this type
          const { count, error: countError } = await supabase
            .from("user_activity")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("activity_type", actionType);

          if (countError) throw countError;

          if (!count || count < criteria.count) {
            shouldAward = false;
          }
        }

        // Check threshold criteria (for quality scores, etc.)
        if (
          shouldAward &&
          criteria.threshold &&
          typeof criteria.threshold === "number"
        ) {
          if (!actionData.score || actionData.score < criteria.threshold) {
            shouldAward = false;
          }
        }

        // Check streak criteria
        if (shouldAward && criteria.days && typeof criteria.days === "number") {
          if (!actionData.streak || actionData.streak < criteria.days) {
            shouldAward = false;
          }
        }

        // If all criteria are met, award the achievement
        if (shouldAward) {
          const result = await this.awardAchievement(
            userId,
            achievement.id,
            actionData,
          );
          if (result.success && result.achievement) {
            awardedAchievements.push(result.achievement);
          }
        }
      }

      return { awarded: awardedAchievements };
    } catch (error) {
      console.error(
        "[Achievements Service] Error checking achievements:",
        error,
      );
      return { awarded: [] };
    }
  },

  /**
   * Get recent achievements across all users (for leaderboards, etc.)
   */
  async getRecentAchievements(limit = 10): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(
          "*, achievement:achievements(*), user:users(id, name, avatar_url)",
        )
        .order("earned_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(
        "[Achievements Service] Error getting recent achievements:",
        error,
      );
      return [];
    }
  },
};
