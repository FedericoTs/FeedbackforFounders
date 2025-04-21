import { supabase } from "../../supabase/supabase";
import { activityService } from "./activity";
import { gamificationService } from "./gamification";

export interface RewardRule {
  activityType: string;
  points: number;
  description: string;
  enabled: boolean;
  limit?: number; // Maximum times this reward can be earned
  cooldown?: number; // Cooldown period in hours before earning again
}

export interface ProjectLimits {
  maxProjects: number;
  maxRewardedProjects: number;
}

export const rewardsService = {
  /**
   * Default reward rules
   */
  getDefaultRewardRules(): Record<string, RewardRule> {
    return {
      project_created: {
        activityType: "project_created",
        points: 20,
        description: "Created a new project",
        enabled: true,
        limit: 3, // Only first 3 projects are rewarded
      },
      project_updated: {
        activityType: "project_updated",
        points: 5,
        description: "Updated a project",
        enabled: true,
        cooldown: 24, // Can only earn points once per day for updates
      },
      feedback_given: {
        activityType: "feedback_given",
        points: 10,
        description: "Provided feedback on a project",
        enabled: true,
      },
      feedback_received: {
        activityType: "feedback_received",
        points: 5,
        description: "Received feedback on your project",
        enabled: true,
      },
      goal_created: {
        activityType: "goal_created",
        points: 5,
        description: "Created a project goal",
        enabled: true,
      },
      goal_completed: {
        activityType: "goal_completed",
        points: 15,
        description: "Completed a project goal",
        enabled: true,
      },
      questionnaire_created: {
        activityType: "questionnaire_created",
        points: 10,
        description: "Created a questionnaire",
        enabled: true,
      },
      questionnaire_response: {
        activityType: "questionnaire_response",
        points: 5,
        description: "Received a questionnaire response",
        enabled: true,
      },
      project_promotion: {
        activityType: "project_promotion",
        points: -50, // Negative points for spending
        description: "Promoted a project",
        enabled: true,
      },
      daily_login: {
        activityType: "daily_login",
        points: 5,
        description: "Logged in for the day",
        enabled: true,
        cooldown: 24,
      },
      profile_completed: {
        activityType: "profile_completed",
        points: 10,
        description: "Completed your profile",
        enabled: true,
        limit: 1,
      },
    };
  },

  /**
   * Project limits configuration
   */
  getProjectLimits(): ProjectLimits {
    return {
      maxProjects: 3, // Maximum number of projects a user can have
      maxRewardedProjects: 3, // Maximum number of projects that will be rewarded
    };
  },

  /**
   * Check if a user has reached their project limit
   */
  async hasReachedProjectLimit(userId: string): Promise<boolean> {
    try {
      const limits = this.getProjectLimits();

      // Count active projects (not archived or deleted)
      const { count, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) throw error;

      return count !== null && count >= limits.maxProjects;
    } catch (error) {
      console.error("Error checking project limit:", error);
      return false; // Default to false to prevent blocking users if there's an error
    }
  },

  /**
   * Check if a user should be rewarded for creating a project
   */
  async shouldRewardProjectCreation(userId: string): Promise<boolean> {
    try {
      const limits = this.getProjectLimits();

      // Count how many times the user has been rewarded for creating projects
      const { count, error } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("activity_type", "project_created")
        .gt("points", 0); // Only count activities that awarded points

      if (error) throw error;

      return count !== null && count < limits.maxRewardedProjects;
    } catch (error) {
      console.error("Error checking project reward eligibility:", error);
      return false; // Default to false to prevent rewarding if there's an error
    }
  },

  /**
   * Check if an activity is on cooldown
   */
  async isActivityOnCooldown(
    userId: string,
    activityType: string,
    cooldownHours: number,
  ): Promise<boolean> {
    try {
      // Calculate the cooldown timestamp
      const cooldownDate = new Date();
      cooldownDate.setHours(cooldownDate.getHours() - cooldownHours);

      // Check if there's a recent activity of this type
      const { data, error } = await supabase
        .from("user_activity")
        .select("created_at")
        .eq("user_id", userId)
        .eq("activity_type", activityType)
        .gt("created_at", cooldownDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      // If there's data, the activity is on cooldown
      return data && data.length > 0;
    } catch (error) {
      console.error(`Error checking cooldown for ${activityType}:`, error);
      return false; // Default to false to prevent blocking rewards if there's an error
    }
  },

  /**
   * Check if a user has reached the limit for an activity
   */
  async hasReachedActivityLimit(
    userId: string,
    activityType: string,
    limit: number,
  ): Promise<boolean> {
    try {
      // Count how many times the user has performed this activity
      const { count, error } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("activity_type", activityType)
        .gt("points", 0); // Only count activities that awarded points

      if (error) throw error;

      return count !== null && count >= limit;
    } catch (error) {
      console.error(`Error checking limit for ${activityType}:`, error);
      return false; // Default to false to prevent blocking rewards if there's an error
    }
  },

  /**
   * Process a reward for an activity
   */
  async processReward(params: {
    userId: string;
    activityType: string;
    description?: string;
    metadata?: Record<string, any>;
    projectId?: string;
    skipActivityRecord?: boolean; // Parameter to skip activity recording
  }): Promise<{
    success: boolean;
    points: number;
    message?: string;
    activityRecorded?: boolean; // Return value to indicate if activity was recorded
  }> {
    try {
      console.log("[Rewards Service] Processing reward:", params);
      const {
        userId,
        activityType,
        description,
        metadata,
        projectId,
        skipActivityRecord = false,
      } = params;
      const rules = this.getDefaultRewardRules();
      const rule = rules[activityType];
      let activityRecorded = false;

      // First check if an activity record already exists to prevent duplicates
      if (!skipActivityRecord && projectId) {
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", activityType)
          .eq("project_id", projectId)
          .limit(1);

        if (!checkError && existingActivity && existingActivity.length > 0) {
          console.log(
            `[Rewards Service] Activity ${activityType} already recorded for project ${projectId}, skipping duplicate`,
          );
          // Activity already exists, but we'll still process the points
          activityRecorded = true;
        }
      }

      console.log(
        `[Rewards Service] Activity recorded status: ${activityRecorded}, skipActivityRecord: ${skipActivityRecord}`,
      );

      // If no rule exists or the rule is disabled, don't award points
      if (!rule || !rule.enabled) {
        console.log(
          `[Rewards Service] No reward rule for activity: ${activityType}`,
        );
        return {
          success: false,
          points: 0,
          message: "No reward rule for this activity",
          activityRecorded: false,
        };
      }

      // Special handling for project creation
      if (activityType === "project_created") {
        const shouldReward = await this.shouldRewardProjectCreation(userId);
        if (!shouldReward) {
          console.log(
            `[Rewards Service] Project creation limit reached for user: ${userId}`,
          );
          // Still record the activity but with 0 points
          if (!skipActivityRecord && !activityRecorded) {
            await activityService.recordActivity({
              user_id: userId,
              activity_type: activityType,
              description: description || rule.description,
              points: 0, // No points awarded
              metadata,
              project_id: projectId,
            });
            activityRecorded = true;
          }

          return {
            success: true,
            points: 0,
            message:
              "Project created successfully, but no points awarded (limit reached)",
            activityRecorded,
          };
        }
      }

      // Check for cooldown if applicable
      if (rule.cooldown && rule.cooldown > 0) {
        const onCooldown = await this.isActivityOnCooldown(
          userId,
          activityType,
          rule.cooldown,
        );
        if (onCooldown) {
          console.log(
            `[Rewards Service] Activity ${activityType} on cooldown for user: ${userId}`,
          );
          // Still record the activity but with 0 points
          if (!skipActivityRecord && !activityRecorded) {
            await activityService.recordActivity({
              user_id: userId,
              activity_type: activityType,
              description: description || rule.description,
              points: 0, // No points awarded
              metadata,
              project_id: projectId,
            });
            activityRecorded = true;
          }

          return {
            success: true,
            points: 0,
            message: `Activity recorded, but no points awarded (on cooldown for ${rule.cooldown} hours)`,
            activityRecorded,
          };
        }
      }

      // Check for limits if applicable
      if (rule.limit && rule.limit > 0) {
        const reachedLimit = await this.hasReachedActivityLimit(
          userId,
          activityType,
          rule.limit,
        );
        if (reachedLimit) {
          console.log(
            `[Rewards Service] Activity ${activityType} limit reached for user: ${userId}`,
          );
          // Still record the activity but with 0 points
          if (!skipActivityRecord && !activityRecorded) {
            await activityService.recordActivity({
              user_id: userId,
              activity_type: activityType,
              description: description || rule.description,
              points: 0, // No points awarded
              metadata,
              project_id: projectId,
            });
            activityRecorded = true;
          }

          return {
            success: true,
            points: 0,
            message: `Activity recorded, but no points awarded (limit of ${rule.limit} reached)`,
            activityRecorded,
          };
        }
      }

      console.log(
        `[Rewards Service] Awarding ${rule.points} points for ${activityType} to user: ${userId}`,
      );

      // Award points using gamificationService
      const awardResult = await gamificationService.awardPoints({
        userId,
        points: rule.points,
        activityType,
        description: description || rule.description,
        metadata,
        projectId, // Pass projectId to gamificationService
      });

      // Record the activity if it hasn't been recorded yet and we're not skipping it
      if (!skipActivityRecord && !activityRecorded) {
        // Double-check for existing activity to prevent duplicates
        let existingActivity = false;
        if (projectId) {
          const { data: existingData } = await supabase
            .from("user_activity")
            .select("id")
            .eq("user_id", userId)
            .eq("activity_type", activityType)
            .eq("project_id", projectId)
            .limit(1);

          existingActivity = existingData && existingData.length > 0;
        }

        if (!existingActivity) {
          console.log(
            `[Rewards Service] Recording activity for ${activityType} with ${rule.points} points`,
          );
          const recordResult = await activityService.recordActivity({
            user_id: userId,
            activity_type: activityType,
            description: description || rule.description,
            points: rule.points,
            metadata,
            project_id: projectId,
          });
          activityRecorded = recordResult.success;
          console.log(
            `[Rewards Service] Activity recording result:`,
            recordResult,
          );
        } else {
          console.log(
            `[Rewards Service] Activity for ${activityType} already exists, skipping record`,
          );
          activityRecorded = true;
        }
      }

      // Ensure the user's total points are updated in the users table
      try {
        // Get current user data to ensure we have the latest values
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("points, level, points_to_next_level")
          .eq("id", userId)
          .single();

        if (!userError && userData) {
          // Calculate total points from user_activity table as a source of truth
          const { data: activityData, error: activityError } = await supabase
            .from("user_activity")
            .select("points")
            .eq("user_id", userId);

          if (!activityError && activityData && activityData.length > 0) {
            // Sum up all points from activities
            const totalPoints = activityData.reduce(
              (sum, activity) => sum + (activity.points || 0),
              0,
            );

            // Update user's points if different from calculated total
            if (totalPoints !== userData.points) {
              console.log(
                `[Rewards Service] Updating user ${userId} points from ${userData.points} to ${totalPoints} based on activity records`,
              );

              const { error: updateError } = await supabase
                .from("users")
                .update({ points: totalPoints })
                .eq("id", userId);

              if (updateError) {
                console.error(
                  "[Rewards Service] Error updating user points:",
                  updateError,
                );
              }
            }
          }
        }
      } catch (syncError) {
        console.error(
          "[Rewards Service] Error syncing user points:",
          syncError,
        );
        // Continue with the original response even if the sync fails
      }

      // Prepare the result message
      const resultMessage = awardResult.leveledUp
        ? `Awarded ${rule.points} points and leveled up to level ${awardResult.level}!`
        : `Awarded ${rule.points} points!`;

      // Trigger toast notification if available in window context
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          console.log(
            "[Rewards Service] Dispatching award:received event with points:",
            rule.points,
          );

          const eventDetail = {
            points: rule.points,
            title:
              activityType === "level_up" ? "Level Up!" : "Points Awarded!",
            description: resultMessage,
            variant:
              activityType === "level_up"
                ? "level"
                : activityType === "achievement_earned"
                  ? "achievement"
                  : activityType === "daily_login"
                    ? "streak"
                    : "default",
          };

          console.log("[Rewards Service] Event detail:", eventDetail);

          // Use setTimeout to ensure the event is dispatched after the component is mounted
          setTimeout(() => {
            try {
              const awardEvent = new CustomEvent("award:received", {
                detail: eventDetail,
              });

              window.dispatchEvent(awardEvent);
              console.log(
                "[Rewards Service] Event dispatched successfully after timeout",
              );
            } catch (delayedError) {
              console.error(
                "[Rewards Service] Error in delayed dispatch:",
                delayedError,
              );
            }
          }, 100);

          // Also try immediate dispatch
          try {
            const awardEvent = new CustomEvent("award:received", {
              detail: eventDetail,
            });

            window.dispatchEvent(awardEvent);
            console.log(
              "[Rewards Service] Event dispatched successfully (immediate)",
            );
          } catch (immediateError) {
            console.error(
              "[Rewards Service] Error in immediate dispatch:",
              immediateError,
            );
          }

          // Try one more time with a different approach
          setTimeout(() => {
            try {
              // Use document.dispatchEvent as an alternative
              if (document && document.dispatchEvent) {
                const docEvent = new CustomEvent("award:received", {
                  detail: eventDetail,
                });
                document.dispatchEvent(docEvent);
                console.log("[Rewards Service] Event dispatched via document");
              }
            } catch (docError) {
              console.error(
                "[Rewards Service] Error in document dispatch:",
                docError,
              );
            }
          }, 200);
        } else {
          console.warn(
            "[Rewards Service] Window or dispatchEvent not available",
          );
        }
      } catch (toastError) {
        console.error(
          "[Rewards Service] Error showing award toast:",
          toastError,
        );
        // Continue execution even if toast fails
      }

      return {
        success: true,
        points: rule.points,
        message: resultMessage,
        activityRecorded,
      };
    } catch (error) {
      console.error("[Rewards Service] Error processing reward:", error);
      return { success: false, points: 0, message: "Error processing reward" };
    }
  },

  /**
   * Record a daily login reward with streak bonus
   */
  async recordDailyLogin(userId: string): Promise<{
    success: boolean;
    points: number;
    message?: string;
  }> {
    try {
      // First check the streak status using the daily-streak function
      const { data: streakData, error: streakError } =
        await supabase.functions.invoke("supabase-functions-daily-streak", {
          body: { userId },
        });

      if (streakError) {
        console.error("Error checking login streak:", streakError);
        // Fall back to basic login reward if streak function fails
        return this.processReward({
          userId,
          activityType: "daily_login",
          metadata: { loginDate: new Date().toISOString() },
        });
      }

      // If already logged in today or streak processing failed, return basic result
      if (!streakData.success || streakData.alreadyLoggedIn) {
        return {
          success: true,
          points: 0,
          message: "You've already claimed your daily login reward today.",
        };
      }

      // Process the reward with bonus points if applicable
      const totalPoints = streakData.basePoints + (streakData.bonusPoints || 0);
      const metadata = {
        loginDate: new Date().toISOString(),
        streak: streakData.streak,
        maxStreak: streakData.maxStreak,
        bonusPoints: streakData.bonusPoints || 0,
        streakBroken: streakData.streakBroken || false,
        newRecord: streakData.newRecord || false,
      };

      // Override the default points with our calculated total
      const result = await this.processReward({
        userId,
        activityType: "daily_login",
        description: streakData.message || "Daily login reward",
        metadata,
        // The processReward function will use the rule's points value,
        // but we'll update the activity record with the correct total afterward
      });

      // If the reward was processed successfully, update the activity record with the correct points
      if (result.success) {
        // Find the most recent daily_login activity
        const { data: activities, error: activityError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", "daily_login")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!activityError && activities && activities.length > 0) {
          // Update the points to include the bonus
          await supabase
            .from("user_activity")
            .update({ points: totalPoints })
            .eq("id", activities[0].id);
        }

        return {
          success: true,
          points: totalPoints,
          message:
            streakData.message ||
            `You earned ${totalPoints} points for logging in today!`,
        };
      }

      return result;
    } catch (error) {
      console.error("Error in recordDailyLogin:", error);
      // Fall back to basic login reward if there's an error
      return this.processReward({
        userId,
        activityType: "daily_login",
        metadata: { loginDate: new Date().toISOString() },
      });
    }
  },

  /**
   * Record profile completion reward
   */
  async recordProfileCompletion(userId: string): Promise<{
    success: boolean;
    points: number;
    message?: string;
  }> {
    return this.processReward({
      userId,
      activityType: "profile_completed",
    });
  },
};
