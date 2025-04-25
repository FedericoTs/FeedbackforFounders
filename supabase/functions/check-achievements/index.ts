import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Achievement {
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
}

interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  points: number;
  metadata: Record<string, any>;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Get request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    // Check if credentials are available
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Supabase credentials not found. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.",
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements")
      .select("*")
      .eq("is_active", true);

    if (achievementsError) {
      throw achievementsError;
    }

    // Get user's existing achievements
    const { data: userAchievements, error: userAchievementsError } =
      await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);

    if (userAchievementsError) {
      throw userAchievementsError;
    }

    // Create a set of achievement IDs the user already has
    const userAchievementIds = new Set(
      userAchievements?.map((ua) => ua.achievement_id) || [],
    );

    // Get user activities
    const { data: userActivities, error: userActivitiesError } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (userActivitiesError) {
      throw userActivitiesError;
    }

    // Get user profile for streak information
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("login_streak, max_login_streak")
      .eq("id", userId)
      .single();

    if (userProfileError) {
      throw userProfileError;
    }

    // Process achievements
    const awardedAchievements: Achievement[] = [];
    const activityCounts: Record<string, number> = {};

    // Count activities by type
    userActivities?.forEach((activity) => {
      const type = activity.activity_type;
      if (!activityCounts[type]) {
        activityCounts[type] = 0;
      }
      activityCounts[type]++;
    });

    // Check each achievement
    for (const achievement of achievements || []) {
      // Skip if user already has this achievement
      if (userAchievementIds.has(achievement.id)) {
        continue;
      }

      const criteria = achievement.criteria || {};
      let shouldAward = true;

      // Check count criteria
      if (criteria.count && typeof criteria.count === "number") {
        const activityType = criteria.action;
        const count = activityCounts[activityType] || 0;
        if (count < criteria.count) {
          shouldAward = false;
        }
      }

      // Check streak criteria
      if (shouldAward && criteria.days && typeof criteria.days === "number") {
        const currentStreak = userProfile?.login_streak || 0;
        if (currentStreak < criteria.days) {
          shouldAward = false;
        }
      }

      // Check early adopter criteria
      if (shouldAward && criteria.action === "early_adopter") {
        // Check user creation date
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("created_at")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          shouldAward = false;
        } else {
          const creationDate = new Date(userData.created_at);
          const cutoffDate = new Date("2024-12-31"); // Example cutoff date for early adopters
          if (creationDate > cutoffDate) {
            shouldAward = false;
          }
        }
      }

      // Award the achievement if all criteria are met
      if (shouldAward) {
        // Insert into user_achievements
        const { error: insertError } = await supabase
          .from("user_achievements")
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            metadata: { source: "automatic_check" },
          });

        if (insertError) {
          console.error("Error awarding achievement:", insertError);
          continue;
        }

        // Award points
        if (achievement.points_reward > 0) {
          // Record activity
          await supabase.from("user_activity").insert({
            user_id: userId,
            activity_type: "achievement_earned",
            description: `Earned achievement: ${achievement.name}`,
            points: achievement.points_reward,
            metadata: {
              achievementId: achievement.id,
              source: "automatic_check",
            },
          });

          // Update user points
          await supabase.rpc("award_points_with_rules", {
            p_user_id: userId,
            p_action_type: "achievement_earned",
            p_description: `Earned achievement: ${achievement.name}`,
            p_metadata: {
              achievementId: achievement.id,
              source: "automatic_check",
            },
          });
        }

        awardedAchievements.push(achievement);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        awarded: awardedAchievements,
        message: `Awarded ${awardedAchievements.length} achievements`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error checking achievements:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
