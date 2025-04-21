/**
 * Activity Workflows Library
 *
 * This file contains standardized workflow functions for different activity types
 * based on the Workflow_documentation.md specifications.
 */

import { rewardsService } from "@/services/rewards";
import { activityService } from "@/services/activity";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../supabase/supabase";

/**
 * Helper function to dispatch award event
 */
function dispatchAwardEvent(params: {
  points: number;
  title: string;
  description: string;
  variant?: "default" | "achievement" | "streak" | "level";
}) {
  if (typeof window !== "undefined" && window.dispatchEvent) {
    try {
      const awardEvent = new CustomEvent("award:received", {
        detail: params,
      });
      window.dispatchEvent(awardEvent);
      console.log("Award event dispatched:", params);

      // Also try with setTimeout to ensure the event is dispatched after any potential rendering
      setTimeout(() => {
        try {
          const delayedEvent = new CustomEvent("award:received", {
            detail: params,
          });
          window.dispatchEvent(delayedEvent);
          console.log("Award event dispatched (delayed):", params);
        } catch (delayedError) {
          console.error("Error dispatching delayed award event:", delayedError);
        }
      }, 100);
    } catch (error) {
      console.error("Error dispatching award event:", error);
    }
  } else {
    console.warn("Window or dispatchEvent not available for award event");
  }
}

/**
 * Process a goal creation activity
 * Awards 5 points as per gamification.md
 */
export async function processGoalCreationActivity(params: {
  userId: string;
  goalTitle: string;
  goalType: string;
  projectId: string;
}) {
  const { userId, goalTitle, goalType, projectId } = params;

  console.log("Goal creation workflow: Recording activity");
  try {
    // Create standardized activity metadata
    const metadata = {
      goalTitle,
      goalType,
      projectId,
      timestamp: new Date().toISOString(),
    };

    // Process reward with standardized approach
    console.log("Processing reward for goal creation");
    const rewardResult = await rewardsService.processReward({
      userId,
      activityType: "goal_created",
      description: `Created goal: ${goalTitle}`,
      projectId,
      metadata,
    });

    console.log("Reward processing result:", rewardResult);

    // Dispatch award event for UI notification
    if (rewardResult.success && rewardResult.points > 0) {
      dispatchAwardEvent({
        points: rewardResult.points,
        title: "Goal Created!",
        description: `You earned ${rewardResult.points} points for creating a goal`,
        variant: "default",
      });
    }

    // Ensure points are updated in the users table as a final fallback
    if (!rewardResult.success || rewardResult.points === 0) {
      try {
        console.log("Attempting direct points update as fallback");
        // Get current user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("points")
          .eq("id", userId)
          .single();

        if (!userError && userData) {
          // Update points directly as a fallback
          const { error: updateError } = await supabase
            .from("users")
            .update({ points: (userData.points || 0) + 5 })
            .eq("id", userId);

          if (updateError) {
            console.error("Error in fallback points update:", updateError);
          } else {
            console.log("Successfully updated points via fallback");
            // Dispatch award event for fallback case
            dispatchAwardEvent({
              points: 5,
              title: "Goal Created!",
              description: "You earned 5 points for creating a goal (fallback)",
              variant: "default",
            });
          }
        }
      } catch (pointsError) {
        console.error("Error updating user points directly:", pointsError);
      }
    }

    return rewardResult;
  } catch (error) {
    console.error("Error processing goal creation reward:", error);
    // Return a basic result for error case
    return { success: false, points: 0, message: "Failed to process reward" };
  }
}

/**
 * Process a goal update activity
 * Awards 5 points as per gamification.md (subject to 24-hour cooldown)
 */
export async function processGoalUpdateActivity(params: {
  userId: string;
  goalTitle: string;
  goalType: string;
  projectId: string;
}) {
  const { userId, goalTitle, goalType, projectId } = params;

  console.log("Goal update workflow: Recording activity");
  try {
    // Create standardized activity metadata
    const metadata = {
      goalTitle,
      goalType,
      projectId,
      timestamp: new Date().toISOString(),
      action: "updated",
    };

    // Process reward with standardized approach - this will be subject to 24-hour cooldown
    // This will award 5 points as defined in the reward_rules for project_updated
    const rewardResult = await rewardsService.processReward({
      userId,
      activityType: "project_updated", // Using project_updated for goal updates
      description: `Updated goal: ${goalTitle}`,
      projectId,
      metadata,
    });

    // Dispatch award event for UI notification
    if (rewardResult.success && rewardResult.points > 0) {
      dispatchAwardEvent({
        points: rewardResult.points,
        title: "Goal Updated!",
        description: `You earned ${rewardResult.points} points for updating a goal`,
        variant: "default",
      });
    }

    return rewardResult;
  } catch (error) {
    console.error("Error processing goal update reward:", error);
    // Return a basic result for error case
    return { success: false, points: 0, message: "Failed to process reward" };
  }
}

/**
 * Process a goal completion activity
 * Awards 15 points as per gamification.md
 */
export async function processGoalCompletionActivity(params: {
  userId: string;
  goalTitle: string;
  goalType: string;
  projectId: string;
  currentValue?: number;
  targetValue?: number;
}) {
  const { userId, goalTitle, goalType, projectId, currentValue, targetValue } =
    params;

  console.log("Goal completion workflow: Recording activity");
  try {
    // Create standardized activity metadata
    const metadata = {
      goalTitle,
      goalType,
      projectId,
      timestamp: new Date().toISOString(),
      currentValue,
      targetValue,
    };

    // Process reward with standardized approach
    // This will award 15 points as defined in the reward_rules for goal_completed
    const rewardResult = await rewardsService.processReward({
      userId,
      activityType: "goal_completed",
      description: `Completed goal: ${goalTitle}`,
      projectId,
      metadata,
    });

    // Dispatch award event for UI notification
    if (rewardResult.success && rewardResult.points > 0) {
      dispatchAwardEvent({
        points: rewardResult.points,
        title: "Goal Completed!",
        description: `You earned ${rewardResult.points} points for completing a goal`,
        variant: "default",
      });
    }

    return rewardResult;
  } catch (error) {
    console.error("Error processing goal completion reward:", error);
    // Return a basic result for error case
    return { success: false, points: 0, message: "Failed to process reward" };
  }
}

/**
 * Process a goal deletion activity
 * No points awarded for deleting goals
 */
export async function processGoalDeletionActivity(params: {
  userId: string;
  goalTitle: string;
  goalType: string;
  projectId: string;
}) {
  const { userId, goalTitle, goalType, projectId } = params;

  console.log("Goal deletion workflow: Recording activity (no points)");
  try {
    // Create standardized activity metadata
    const metadata = {
      goalTitle,
      goalType,
      projectId,
      timestamp: new Date().toISOString(),
      action: "deleted",
    };

    // Record the activity without awarding points
    const activityResult = await activityService.recordActivity({
      user_id: userId,
      activity_type: "project_updated", // Using project_updated for goal deletions
      description: `Deleted goal: ${goalTitle}`,
      points: 0, // Explicitly set to 0 points
      metadata,
      project_id: projectId,
    });

    return {
      success: activityResult.success,
      points: 0,
      message: "Goal deleted successfully (no points awarded)",
    };
  } catch (error) {
    console.error("Error recording goal deletion activity:", error);
    // Return a basic result for error case
    return { success: false, points: 0, message: "Failed to record activity" };
  }
}
