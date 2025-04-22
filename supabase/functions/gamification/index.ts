import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface AwardPointsParams {
  userId: string;
  points: number;
  activityType:
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
  description: string;
  metadata?: Record<string, any>;
  projectId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      const { userId, points, activityType, description, metadata, projectId } =
        (await req.json()) as AwardPointsParams;

      // Validate input
      if (!userId || !points || !activityType || !description) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, points, level, points_to_next_level")
        .eq("id", userId)
        .single();

      if (userError) {
        return new Response(JSON.stringify({ error: userError.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Calculate new points and check for level up
      const currentPoints = userData.points || 0;
      const currentLevel = userData.level || 1;
      const pointsToNextLevel = userData.points_to_next_level || 100;

      const newPoints = currentPoints + points;
      let newLevel = currentLevel;
      let newPointsToNextLevel = pointsToNextLevel;
      let didLevelUp = false;

      // Special handling for feedback quality points
      if (activityType === "feedback_quality" && metadata) {
        // Apply quality multipliers if available in metadata
        if (
          metadata.specificityScore !== undefined &&
          metadata.actionabilityScore !== undefined &&
          metadata.noveltyScore !== undefined
        ) {
          // Calculate combined quality score (0-1 range)
          const qualityScore =
            (metadata.specificityScore +
              metadata.actionabilityScore +
              metadata.novelityScore) /
            3;

          // Add quality score to metadata for activity record
          metadata.qualityScore = qualityScore;

          // Log quality metrics
          console.log(
            `Feedback quality metrics - Specificity: ${metadata.specificityScore}, Actionability: ${metadata.actionabilityScore}, Novelty: ${metadata.noveltyScore}`,
          );
          console.log(`Combined quality score: ${qualityScore}`);
        }
      }

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
        .eq("id", userId);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }

      // Check if activity already exists to prevent duplicates
      let activityRecorded = false;
      let activityExists = false;

      if (projectId) {
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", activityType)
          .eq("project_id", projectId)
          .limit(1);

        activityExists =
          !checkError && existingActivity && existingActivity.length > 0;

        if (activityExists) {
          console.log(
            `Activity ${activityType} already exists for project ${projectId}, skipping duplicate record`,
          );
          activityRecorded = true; // Mark as recorded since it already exists
        }
      } else {
        // If no projectId, check based on user_id and activity_type only
        // This helps prevent duplicates for non-project activities
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", activityType)
          .order("created_at", { ascending: false })
          .limit(1);

        // For non-project activities, only consider it a duplicate if created within the last minute
        if (!checkError && existingActivity && existingActivity.length > 0) {
          const lastActivity = existingActivity[0];
          const lastActivityTime = new Date(lastActivity.created_at).getTime();
          const currentTime = new Date().getTime();
          const timeDiff = currentTime - lastActivityTime;

          // If activity was created in the last 60 seconds, consider it a duplicate
          if (timeDiff < 60000) {
            activityExists = true;
            activityRecorded = true;
            console.log(
              `Recent activity ${activityType} already exists for user ${userId}, skipping duplicate record`,
            );
          }
        }
      }

      // Only record activity if it doesn't already exist
      if (!activityExists) {
        const { error: activityError } = await supabase
          .from("user_activity")
          .insert({
            user_id: userId,
            activity_type: activityType,
            description,
            points,
            metadata,
            project_id: projectId,
          });

        if (activityError) {
          return new Response(
            JSON.stringify({ error: activityError.message }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            },
          );
        }
        activityRecorded = true;
      } else {
        console.log("Activity already exists, skipping duplicate record");
      }

      // If user leveled up, record that as a separate activity
      if (didLevelUp) {
        await supabase.from("user_activity").insert({
          user_id: userId,
          activity_type: "level_up",
          description: `Congratulations! You've reached level ${newLevel}!`,
          points: 0,
          metadata: { oldLevel: currentLevel, newLevel },
        });

        // Check for level-based achievements
        if (newLevel === 5) {
          // Get the achievement ID for Level 5
          const { data: achievementData } = await supabase
            .from("achievements")
            .select("id")
            .eq("title", "Level 5 Achieved")
            .single();

          if (achievementData) {
            // Award the achievement
            await supabase.from("user_achievements").insert({
              user_id: userId,
              achievement_id: achievementData.id,
            });

            // Record activity for earning achievement
            await supabase.from("user_activity").insert({
              user_id: userId,
              activity_type: "achievement_earned",
              description: `You earned the "Level 5 Achieved" achievement!`,
              points: 150, // Points reward for this achievement
              metadata: { achievementId: achievementData.id },
            });

            // Update user points for achievement
            await supabase
              .from("users")
              .update({
                points: newPoints + 150,
              })
              .eq("id", userId);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          points: newPoints,
          level: newLevel,
          leveledUp: didLevelUp,
          activityRecorded: activityRecorded,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
});
