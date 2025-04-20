import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface DailyStreakParams {
  userId: string;
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
      const { userId } = (await req.json()) as DailyStreakParams;

      // Validate input
      if (!userId) {
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
        .select("id, login_streak, last_login_date, max_streak")
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

      // Get today's date in user's timezone (or UTC if not available)
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      // If user already logged in today, return current streak info
      if (userData.last_login_date === todayStr) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Already logged in today",
            streak: userData.login_streak || 0,
            maxStreak: userData.max_streak || 0,
            alreadyLoggedIn: true,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          },
        );
      }

      // Calculate streak
      let newStreak = 1; // Default to 1 for a new streak
      let streakBroken = false;
      let bonusPoints = 0;

      if (userData.last_login_date) {
        // Convert last login date to Date object
        const lastLogin = new Date(userData.last_login_date);

        // Add one day to last login date
        lastLogin.setDate(lastLogin.getDate() + 1);
        const expectedNextLogin = lastLogin.toISOString().split("T")[0];

        // If today matches the expected next login date, increment streak
        if (todayStr === expectedNextLogin) {
          newStreak = (userData.login_streak || 0) + 1;
        } else {
          // Streak broken
          streakBroken = true;
          newStreak = 1; // Reset streak to 1 for today's login
        }
      }

      // Calculate max streak
      const newMaxStreak = Math.max(newStreak, userData.max_streak || 0);

      // Calculate bonus points based on streak
      if (newStreak >= 30) {
        bonusPoints = 15; // 30+ day streak
      } else if (newStreak >= 14) {
        bonusPoints = 10; // 14+ day streak
      } else if (newStreak >= 7) {
        bonusPoints = 5; // 7+ day streak
      } else if (newStreak >= 3) {
        bonusPoints = 2; // 3+ day streak
      }

      // Base points for daily login (will be added by the rewards service)
      const basePoints = 5;
      const totalPoints = basePoints + bonusPoints;

      // Update user's streak information
      const { error: updateError } = await supabase
        .from("users")
        .update({
          login_streak: newStreak,
          last_login_date: todayStr,
          max_streak: newMaxStreak,
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

      // Record login history
      const { error: historyError } = await supabase
        .from("user_login_history")
        .insert({
          user_id: userId,
          login_date: todayStr,
          streak_count: newStreak,
          points_earned: totalPoints,
        });

      if (historyError) {
        console.error("Error recording login history:", historyError);
        // Continue even if history recording fails
      }

      // Prepare response message
      let message = `You've logged in for ${newStreak} consecutive day${newStreak !== 1 ? "s" : ""}`;
      if (bonusPoints > 0) {
        message += ` and earned a bonus of ${bonusPoints} points!`;
      } else {
        message += ".";
      }

      if (streakBroken) {
        message = `Your previous streak was broken. ${message}`;
      }

      if (newMaxStreak > userData.max_streak) {
        message += ` This is your new record!`;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message,
          streak: newStreak,
          maxStreak: newMaxStreak,
          bonusPoints,
          basePoints,
          totalPoints,
          streakBroken,
          newRecord: newMaxStreak > userData.max_streak,
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
