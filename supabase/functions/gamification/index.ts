import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface AwardPointsParams {
  userId: string;
  points: number;
  activityType:
    | "feedback_given"
    | "feedback_received"
    | "project_created"
    | "achievement_earned"
    | "level_up";
  description: string;
  metadata?: Record<string, any>;
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
      const { userId, points, activityType, description, metadata } =
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

      // Record activity
      const { error: activityError } = await supabase
        .from("user_activity")
        .insert({
          user_id: userId,
          activity_type: activityType,
          description,
          points,
          metadata,
        });

      if (activityError) {
        return new Response(JSON.stringify({ error: activityError.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
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
