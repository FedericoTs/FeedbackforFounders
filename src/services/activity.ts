import { supabase } from "../../supabase/supabase";

export interface ActivityData {
  user_id: string;
  activity_type: string;
  description: string;
  points?: number;
  metadata?: Record<string, any>;
  project_id?: string;
}

export const activityService = {
  /**
   * Record a user activity
   */
  /**
   * Record a user activity with improved error handling and debugging
   */
  async recordActivity(
    data: ActivityData,
  ): Promise<{ success: boolean; error?: any; data?: any }> {
    try {
      const {
        user_id,
        activity_type,
        description,
        points = 0,
        metadata = {},
        project_id,
      } = data;

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
  async getUserActivities(userId: string, limit = 10): Promise<any[]> {
    try {
      console.log(
        `[Activity Service] Fetching activities for user ${userId} with limit ${limit}`,
      );

      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

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
