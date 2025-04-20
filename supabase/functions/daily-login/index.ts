import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the session or throw an error for unauthenticated requests
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Check if user has already logged in today
    const { data: existingLogin, error: checkError } = await supabaseClient
      .from("user_daily_logins")
      .select("*")
      .eq("user_id", userId)
      .eq("login_date", today)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      throw checkError;
    }

    let result;
    if (!existingLogin) {
      // Record new login
      const { data: newLogin, error: insertError } = await supabaseClient
        .from("user_daily_logins")
        .insert({
          user_id: userId,
          login_date: today,
          rewarded: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Process reward
      const { data: rewardData, error: rewardError } =
        await supabaseClient.functions.invoke("gamification", {
          body: {
            userId,
            points: 5, // Daily login reward points
            activityType: "daily_login",
            description: "Daily login reward",
            metadata: { loginDate: today },
          },
        });

      if (rewardError) throw rewardError;

      // Record activity
      const { error: activityError } = await supabaseClient
        .from("user_activity")
        .insert({
          user_id: userId,
          activity_type: "daily_login",
          description: "Daily login reward",
          points: 5,
          metadata: { loginDate: today },
        });

      if (activityError) throw activityError;

      // Update login record to mark as rewarded
      const { error: updateError } = await supabaseClient
        .from("user_daily_logins")
        .update({ rewarded: true })
        .eq("id", newLogin.id);

      if (updateError) throw updateError;

      result = {
        success: true,
        firstLoginOfDay: true,
        rewarded: true,
        points: 5,
        message: "Daily login reward of 5 points awarded!",
      };
    } else {
      // User has already logged in today
      result = {
        success: true,
        firstLoginOfDay: false,
        rewarded: existingLogin.rewarded,
        points: existingLogin.rewarded ? 0 : 5,
        message: existingLogin.rewarded
          ? "Welcome back! You've already received your daily login reward today."
          : "Daily login reward of 5 points awarded!",
      };

      // If not yet rewarded, process the reward
      if (!existingLogin.rewarded) {
        // Process reward
        const { data: rewardData, error: rewardError } =
          await supabaseClient.functions.invoke("gamification", {
            body: {
              userId,
              points: 5, // Daily login reward points
              activityType: "daily_login",
              description: "Daily login reward",
              metadata: { loginDate: today },
            },
          });

        if (rewardError) throw rewardError;

        // Record activity
        const { error: activityError } = await supabaseClient
          .from("user_activity")
          .insert({
            user_id: userId,
            activity_type: "daily_login",
            description: "Daily login reward",
            points: 5,
            metadata: { loginDate: today },
          });

        if (activityError) throw activityError;

        // Update login record to mark as rewarded
        const { error: updateError } = await supabaseClient
          .from("user_daily_logins")
          .update({ rewarded: true })
          .eq("id", existingLogin.id);

        if (updateError) throw updateError;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing daily login:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
