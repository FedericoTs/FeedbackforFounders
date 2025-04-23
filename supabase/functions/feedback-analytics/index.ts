// Feedback Analytics Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackAnalyticsParams {
  projectId?: string;
  userId?: string;
  timeframe?: string; // 'week', 'month', 'all'
  includeQualityMetrics?: boolean;
}

interface FeedbackAnalytics {
  totalFeedback: number;
  averageQuality: number;
  qualityDistribution: {
    excellent: number; // 0.8-1.0
    good: number; // 0.6-0.79
    average: number; // 0.4-0.59
    basic: number; // 0-0.39
  };
  topCategories: Array<{ category: string; count: number }>;
  qualityTrend: Array<{ date: string; averageQuality: number }>;
  userPerformance?: {
    totalFeedbackGiven: number;
    averageQuality: number;
    pointsEarned: number;
    rank: number;
    percentile: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const {
      projectId,
      userId,
      timeframe = "month",
      includeQualityMetrics = true,
    } = (await req.json()) as FeedbackAnalyticsParams;

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine date range based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // "all"
        startDate = new Date(0); // Beginning of time
    }

    const startDateStr = startDate.toISOString();

    // Build base query
    let query = supabase
      .from("feedback")
      .select("*")
      .gte("created_at", startDateStr);

    // Add filters if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Execute query
    const { data: feedbackData, error } = await query;

    if (error) {
      console.error("Error fetching feedback data:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch feedback data" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Process feedback data
    const analytics: FeedbackAnalytics = {
      totalFeedback: feedbackData.length,
      averageQuality: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        basic: 0,
      },
      topCategories: [],
      qualityTrend: [],
      userPerformance: undefined,
    };

    // Calculate quality metrics
    if (includeQualityMetrics && feedbackData.length > 0) {
      // Calculate average quality
      let totalQualityScore = 0;
      let validQualityCount = 0;
      const categoryCount: Record<string, number> = {};
      const dateQuality: Record<string, { sum: number; count: number }> = {};

      feedbackData.forEach((feedback) => {
        // Process categories
        const category = feedback.category || "Uncategorized";
        categoryCount[category] = (categoryCount[category] || 0) + 1;

        // Process quality metrics if available
        if (
          feedback.specificity_score !== null &&
          feedback.actionability_score !== null &&
          feedback.novelty_score !== null
        ) {
          const qualityScore =
            (feedback.specificity_score +
              feedback.actionability_score +
              feedback.novelty_score) /
            3;

          totalQualityScore += qualityScore;
          validQualityCount++;

          // Categorize quality
          if (qualityScore >= 0.8) {
            analytics.qualityDistribution.excellent++;
          } else if (qualityScore >= 0.6) {
            analytics.qualityDistribution.good++;
          } else if (qualityScore >= 0.4) {
            analytics.qualityDistribution.average++;
          } else {
            analytics.qualityDistribution.basic++;
          }

          // Process date for trend
          const dateStr = new Date(feedback.created_at)
            .toISOString()
            .split("T")[0];
          if (!dateQuality[dateStr]) {
            dateQuality[dateStr] = { sum: 0, count: 0 };
          }
          dateQuality[dateStr].sum += qualityScore;
          dateQuality[dateStr].count++;
        }
      });

      // Calculate final average quality
      analytics.averageQuality =
        validQualityCount > 0 ? totalQualityScore / validQualityCount : 0;

      // Process top categories
      analytics.topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Process quality trend
      analytics.qualityTrend = Object.entries(dateQuality)
        .map(([date, { sum, count }]) => ({
          date,
          averageQuality: sum / count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // If userId is provided, get user performance data
      if (userId) {
        // Get total feedback count for this user
        const { count: totalUserFeedback } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Get user points
        const { data: userData } = await supabase
          .from("users")
          .select("points")
          .eq("id", userId)
          .single();

        // Get user rank
        const { data: userRanks } = await supabase
          .from("users")
          .select("id, points")
          .order("points", { ascending: false });

        let rank = 0;
        let percentile = 0;

        if (userRanks && userRanks.length > 0) {
          // Find user's rank
          rank = userRanks.findIndex((u) => u.id === userId) + 1;
          // Calculate percentile (higher is better)
          percentile = ((userRanks.length - rank) / userRanks.length) * 100;
        }

        analytics.userPerformance = {
          totalFeedbackGiven: totalUserFeedback || 0,
          averageQuality: analytics.averageQuality,
          pointsEarned: userData?.points || 0,
          rank,
          percentile,
        };
      }
    }

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in feedback analytics:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
