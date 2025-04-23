import { supabase } from "../../supabase/supabase";

/**
 * Enum for activity types to ensure consistency across the application
 */
export enum ActivityType {
  PROJECT = "project",
  FEEDBACK = "feedback",
  REWARD = "reward",
  ACHIEVEMENT = "achievement",
  LOGIN = "login",
  SYSTEM = "system",
}

/**
 * Generic interface for activity metadata
 * This allows for type-safe metadata for different activity types
 */
export interface BaseActivityMetadata {
  timestamp?: string; // ISO string timestamp when the activity occurred
}

export interface ProjectActivityMetadata extends BaseActivityMetadata {
  projectId: string;
  projectTitle: string;
  version?: number;
}

export interface GoalActivityMetadata extends BaseActivityMetadata {
  projectId: string;
  goalId: string;
  goalTitle: string;
}

export interface QuestionnaireActivityMetadata extends BaseActivityMetadata {
  projectId: string;
  questionnaireId: string;
  questionnaireTitle: string;
}

export interface FeedbackActivityMetadata extends BaseActivityMetadata {
  projectId: string;
  feedbackId?: string;
  sectionId?: string;
  sectionName?: string;
  sentiment?: number; // -1 to 1 range
  specificityScore?: number;
  actionabilityScore?: number;
  noveltyScore?: number;
  qualityScore?: number;
  category?: string;
  subcategory?: string;
}

export interface LoginActivityMetadata extends BaseActivityMetadata {
  streak?: number;
  maxStreak?: number;
  bonusPoints?: number;
}

export interface ProfileActivityMetadata extends BaseActivityMetadata {
  completionPercentage?: number;
}

export type ActivityMetadata =
  | BaseActivityMetadata
  | ProjectActivityMetadata
  | GoalActivityMetadata
  | QuestionnaireActivityMetadata
  | FeedbackActivityMetadata
  | LoginActivityMetadata
  | ProfileActivityMetadata
  | Record<string, any>; // For backward compatibility

export interface ActivityData {
  user_id: string;
  activity_type: string;
  description: string;
  points?: number;
  metadata?: ActivityMetadata;
  project_id?: string;
}

/**
 * Helper function to generate a standardized activity description
 * based on the activity type and metadata
 */
export function generateActivityDescription(
  activityType: string,
  metadata?: ActivityMetadata,
): string {
  switch (activityType) {
    case "project_created":
      return metadata && "projectTitle" in metadata
        ? `Created project: ${metadata.projectTitle}`
        : "Created a new project";

    case "project_updated":
      return metadata && "projectTitle" in metadata
        ? `Updated project: ${metadata.projectTitle}${metadata.version ? ` (v${metadata.version})` : ""}`
        : "Updated a project";

    case "goal_created":
      return metadata && "goalTitle" in metadata
        ? `Created goal: ${metadata.goalTitle}`
        : "Created a new goal";

    case "goal_completed":
      return metadata && "goalTitle" in metadata
        ? `Completed goal: ${metadata.goalTitle}`
        : "Completed a goal";

    case "questionnaire_created":
      return metadata && "questionnaireTitle" in metadata
        ? `Created questionnaire: ${metadata.questionnaireTitle}`
        : "Created a new questionnaire";

    case "questionnaire_response":
      return metadata && "questionnaireTitle" in metadata
        ? `Received response for questionnaire: ${metadata.questionnaireTitle}`
        : "Received a questionnaire response";

    case "feedback_given":
      return metadata && "sectionName" in metadata
        ? `Provided feedback on ${metadata.sectionName}`
        : "Provided feedback on a project";

    case "feedback_quality":
      return metadata && "qualityScore" in metadata
        ? `Provided high-quality feedback (${Math.round((metadata.qualityScore as number) * 100)}%)`
        : "Provided high-quality feedback";

    case "feedback_received":
      return "Received feedback on your project";

    case "daily_login":
      return metadata &&
        "streak" in metadata &&
        metadata.streak &&
        metadata.streak > 1
        ? `Logged in for ${metadata.streak} days in a row!`
        : "Logged in for the day";

    case "profile_completed":
      return "Completed your profile";

    case "level_up":
      return "Reached a new level!";

    default:
      return `Activity: ${activityType}`;
  }
}

/**
 * Creates a standardized activity record based on the activity type and metadata
 */
export function createActivityRecord(
  userId: string,
  activityType: string,
  options: {
    points?: number;
    description?: string;
    metadata?: ActivityMetadata;
    projectId?: string;
  } = {},
): ActivityData {
  const { points = 0, metadata = {}, projectId } = options;

  // Extract projectId from metadata if not explicitly provided
  const derivedProjectId =
    projectId ||
    (metadata && "projectId" in metadata ? metadata.projectId : undefined);

  // Generate description if not provided
  const description =
    options.description || generateActivityDescription(activityType, metadata);

  // Create timestamp if not already in metadata
  const enrichedMetadata = {
    ...metadata,
    timestamp:
      metadata && "timestamp" in metadata
        ? metadata.timestamp
        : new Date().toISOString(),
  };

  return {
    user_id: userId,
    activity_type: activityType,
    description,
    points,
    metadata: enrichedMetadata,
    project_id: derivedProjectId,
  };
}

export const activityService = {
  /**
   * Record a user activity with improved error handling and duplicate prevention
   * @param data ActivityData object or parameters to create one
   */
  async recordActivity(
    data:
      | ActivityData
      | {
          userId: string;
          activityType: string;
          points?: number;
          description?: string;
          metadata?: ActivityMetadata;
          projectId?: string;
        },
  ): Promise<{
    success: boolean;
    error?: any;
    data?: any;
    duplicate?: boolean;
  }> {
    // Convert from simplified format if needed
    const activityData: ActivityData =
      "user_id" in data
        ? data
        : createActivityRecord(data.userId, data.activityType, {
            points: data.points,
            description: data.description,
            metadata: data.metadata,
            projectId: data.projectId,
          });
    try {
      const {
        user_id,
        activity_type,
        description,
        points = 0,
        metadata = {},
        project_id,
      } = activityData;

      console.log(
        `[Activity Service] Recording activity: ${activity_type} for user ${user_id}`,
      );
      console.log(`[Activity Service] Activity details:`, {
        type: activity_type,
        description,
        points,
        project_id: project_id || "none",
      });

      // Validate data before inserting
      if (!user_id) {
        const error = new Error("Cannot record activity: missing user_id");
        console.error("[Activity Service] " + error.message);
        return { success: false, error };
      }

      if (!activity_type) {
        const error = new Error(
          "Cannot record activity: missing activity_type",
        );
        console.error("[Activity Service] " + error.message);
        return { success: false, error };
      }

      // Enhanced duplicate check for activities
      if (project_id) {
        // For project-related activities, check based on user_id, activity_type, and project_id
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", user_id)
          .eq("activity_type", activity_type)
          .eq("project_id", project_id)
          .limit(1);

        if (!checkError && existingActivity && existingActivity.length > 0) {
          console.log(
            `[Activity Service] Activity ${activity_type} already exists for project ${project_id}, skipping duplicate`,
          );
          return { success: true, data: existingActivity[0], duplicate: true };
        }
      } else {
        // For non-project activities, check for recent duplicates (within last minute)
        const oneMinuteAgo = new Date();
        oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

        const { data: recentActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id, created_at")
          .eq("user_id", user_id)
          .eq("activity_type", activity_type)
          .gt("created_at", oneMinuteAgo.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        if (!checkError && recentActivity && recentActivity.length > 0) {
          console.log(
            `[Activity Service] Recent activity ${activity_type} already exists for user ${user_id}, skipping duplicate`,
          );
          return { success: true, data: recentActivity[0], duplicate: true };
        }
      }

      // Add additional logging for debugging
      console.log(
        `[Activity Service] No duplicate found for ${activity_type}, proceeding with insert`,
      );

      // Ensure metadata is an object
      const safeMetadata =
        typeof metadata === "object" && metadata !== null ? metadata : {};

      console.log(
        "[Activity Service] Inserting activity into user_activity table:",
        {
          user_id,
          activity_type,
          description: description || `Activity: ${activity_type}`,
          points,
          metadata: safeMetadata,
          project_id,
        },
      );

      // First check if the user_activity table exists
      console.log("[Activity Service] Checking if user_activity table exists");
      try {
        const { count, error: checkError } = await supabase
          .from("user_activity")
          .select("*", { count: "exact", head: true });

        if (checkError) {
          console.error(
            "[Activity Service] Error checking user_activity table:",
            checkError,
          );
          // Table might not exist, try to create it
          console.log(
            "[Activity Service] Attempting to create user_activity table via migration",
          );
          return { success: false, error: checkError };
        }
        console.log(
          `[Activity Service] user_activity table exists with ${count} records`,
        );
      } catch (tableCheckError) {
        console.error(
          "[Activity Service] Exception checking user_activity table:",
          tableCheckError,
        );
        return { success: false, error: tableCheckError };
      }

      // Proceed with inserting the activity
      console.log("[Activity Service] Inserting activity with data:", {
        user_id,
        activity_type,
        description: description || `Activity: ${activity_type}`,
        points,
        project_id: project_id || "none",
      });

      const { data: insertData, error } = await supabase
        .from("user_activity")
        .insert({
          user_id,
          activity_type,
          description: description || `Activity: ${activity_type}`,
          points,
          metadata: safeMetadata,
          project_id,
        })
        .select();

      if (error) {
        console.error("[Activity Service] Error recording activity:", error);
        console.log(
          "[Activity Service] Attempting retry with simplified data...",
        );

        // Try a more direct approach with fewer fields if the first attempt failed
        const { data: retryData, error: retryError } = await supabase
          .from("user_activity")
          .insert({
            user_id,
            activity_type,
            description: description || `Activity: ${activity_type}`,
            points,
            // Omit metadata and project_id in the retry attempt
          })
          .select();

        if (retryError) {
          console.error(
            "[Activity Service] Retry error recording activity:",
            retryError,
          );
          return { success: false, error: retryError };
        } else {
          console.log(
            "[Activity Service] Activity recorded successfully on retry (without metadata):",
            retryData,
          );
          return { success: true, data: retryData };
        }
      } else {
        console.log(
          "[Activity Service] Activity recorded successfully:",
          insertData,
        );
        return { success: true, data: insertData };
      }
    } catch (error) {
      console.error("[Activity Service] Error in recordActivity:", error);
      // Return the error instead of just logging it
      return { success: false, error };
    }
  },

  /**
   * Get recent activities for a user
   */
  async getUserActivities(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: ActivityType | "all";
      timeRange?: string;
    } = {},
  ): Promise<any[]> {
    try {
      const { limit = 10, offset = 0, type, timeRange } = options;

      console.log(
        `[Activity Service] Fetching activities for user ${userId} with limit ${limit}, offset ${offset}`,
      );

      let query = supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply type filter if specified
      if (type && type !== "all") {
        query = query.eq("activity_type", type);
      }

      // Apply time range filter if specified
      if (timeRange && timeRange !== "all") {
        const now = new Date();
        let cutoffDate = new Date();

        switch (timeRange) {
          case "today":
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case "month":
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }

        query = query.gte("created_at", cutoffDate.toISOString());
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error(
          "[Activity Service] Error fetching user activities:",
          error,
        );
        return [];
      }

      console.log(
        `[Activity Service] Successfully fetched ${data?.length || 0} activities`,
      );
      return data || [];
    } catch (error) {
      console.error("[Activity Service] Error in getUserActivities:", error);
      return [];
    }
  },
};
