import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface AnalyticsRequest {
  projectId: string;
  timeframe?: "day" | "week" | "month" | "year";
  userId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
      const {
        projectId,
        timeframe = "month",
        userId,
      } = (await req.json()) as AnalyticsRequest;

      // Validate input
      if (!projectId) {
        return new Response(JSON.stringify({ error: "Missing project ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check if user has access to the project
      if (userId) {
        const { data: collaborator, error: collaboratorError } = await supabase
          .from("project_collaborators")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .maybeSingle();

        if (collaboratorError || !collaborator) {
          return new Response(
            JSON.stringify({ error: "Unauthorized access" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      }

      // Get feedback statistics
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("project_feedback")
        .select("count")
        .eq("project_id", projectId)
        .single();

      const { data: sentimentData, error: sentimentError } = await supabase
        .from("project_feedback_sentiment")
        .select("positive, negative, neutral")
        .eq("project_id", projectId)
        .single();

      // Get active promotion if any
      const { data: promotionData, error: promotionError } = await supabase
        .from("project_promotions")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get recent activity
      const { data: activityData, error: activityError } = await supabase
        .from("project_activity")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Calculate timeframe for visitor stats
      let startDate;
      const now = new Date();
      switch (timeframe) {
        case "day":
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case "month":
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      // Prepare response data
      const analyticsData = {
        feedback: {
          total: feedbackData?.count || 0,
          positive: sentimentData?.positive || 0,
          negative: sentimentData?.negative || 0,
          neutral: sentimentData?.neutral || 0,
        },
        visitors: {
          // Simulated data for now
          total: Math.floor(Math.random() * 500) + 50,
          unique: Math.floor(Math.random() * 300) + 30,
          returning: Math.floor(Math.random() * 100) + 10,
          averageDuration: Math.floor(Math.random() * 180) + 30, // seconds
        },
        promotion: promotionData
          ? {
              active: true,
              pointsAllocated: promotionData.points_allocated,
              startDate: promotionData.start_date,
              endDate: promotionData.end_date,
              estimatedReach: promotionData.estimated_reach,
              actualReach: Math.floor(
                promotionData.estimated_reach * (Math.random() * 0.4 + 0.8),
              ), // Simulated
              daysRemaining: Math.max(
                0,
                Math.ceil(
                  (new Date(promotionData.end_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              ),
            }
          : null,
        activity: activityData || [],
        timeframe,
      };

      return new Response(JSON.stringify(analyticsData), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
