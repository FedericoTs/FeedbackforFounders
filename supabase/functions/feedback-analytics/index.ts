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
  dateRange?: {
    start: string;
    end: string;
  };
  categoryIds?: string[];
  qualityThreshold?: number;
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

interface FeedbackAnalyticsData extends FeedbackAnalytics {
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    qualityScore?: number;
  }>;
  feedbackVolume: Array<{
    date: string;
    count: number;
  }>;
  topProviders: Array<{
    userId: string;
    userName: string;
    avatarUrl?: string;
    feedbackCount: number;
    averageQuality: number;
  }>;
  responseRate: number;
  averageResponseTime: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const params = (await req.json()) as FeedbackAnalyticsParams;
    const {
      projectId,
      userId,
      timeframe = "month",
      includeQualityMetrics = true,
      dateRange,
      categoryIds,
      qualityThreshold,
    } = params;

    console.log("Received params:", JSON.stringify(params, null, 2));

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
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

    // Determine date range
    let startDateStr: string;
    let endDateStr: string;

    if (dateRange) {
      // Use provided date range
      startDateStr = dateRange.start;
      endDateStr = dateRange.end;
    } else {
      // Calculate date range based on timeframe
      const now = new Date();
      const endDate = new Date(now);
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

      startDateStr = startDate.toISOString();
      endDateStr = endDate.toISOString();
    }

    console.log(`Date range: ${startDateStr} to ${endDateStr}`);

    // Build base query
    let query = supabase
      .from("feedback")
      .select(
        `
        *,
        user:user_id (id, name, avatar_url),
        feedback_category_mappings!inner (category_id, feedback_categories (id, name))
      `,
      )
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr);

    // Add filters if provided
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (qualityThreshold) {
      // Calculate combined quality threshold
      query = query
        .gte("specificity_score", qualityThreshold)
        .gte("actionability_score", qualityThreshold)
        .gte("novelty_score", qualityThreshold);
    }

    if (categoryIds && categoryIds.length > 0) {
      // Filter by categories - this requires a more complex query
      // We'll fetch all feedback first and then filter by category
    }

    // Execute query
    const { data: feedbackData, error } = await query;

    if (error) {
      console.error("Error fetching feedback data:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch feedback data",
          details: error.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log(`Retrieved ${feedbackData?.length || 0} feedback items`);

    // Filter by category if needed
    let filteredFeedback = feedbackData || [];
    if (categoryIds && categoryIds.length > 0) {
      filteredFeedback = filteredFeedback.filter((feedback) => {
        const mappings = feedback.feedback_category_mappings || [];
        return mappings.some((mapping) =>
          categoryIds.includes(mapping.category_id),
        );
      });
      console.log(`Filtered to ${filteredFeedback.length} items by category`);
    }

    // Process feedback data
    const analytics: FeedbackAnalyticsData = {
      totalFeedback: filteredFeedback.length,
      averageQuality: 0,
      qualityDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        basic: 0,
      },
      sentimentAnalysis: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      categoryDistribution: [],
      feedbackVolume: [],
      topProviders: [],
      responseRate: 0,
      averageResponseTime: 0,
      topCategories: [],
      qualityTrend: [],
    };

    // Calculate quality metrics
    if (includeQualityMetrics && filteredFeedback.length > 0) {
      // Calculate average quality
      let totalQualityScore = 0;
      let validQualityCount = 0;
      const categoryCount: Record<
        string,
        { id: string; name: string; count: number }
      > = {};
      const dateQuality: Record<string, { sum: number; count: number }> = {};
      const dateCount: Record<string, number> = {};
      const userStats: Record<
        string,
        { count: number; qualitySum: number; name: string; avatarUrl?: string }
      > = {};
      let totalResponseTime = 0;
      let responsesCount = 0;

      filteredFeedback.forEach((feedback) => {
        // Process categories from mappings
        const mappings = feedback.feedback_category_mappings || [];
        mappings.forEach((mapping) => {
          const category = mapping.feedback_categories;
          if (category) {
            const categoryId = category.id;
            const categoryName = category.name;
            if (!categoryCount[categoryId]) {
              categoryCount[categoryId] = {
                id: categoryId,
                name: categoryName,
                count: 0,
              };
            }
            categoryCount[categoryId].count++;
          }
        });

        // Process fallback category if no mappings
        if (mappings.length === 0 && feedback.category) {
          const categoryId = `legacy-${feedback.category}`;
          const categoryName = feedback.category;
          if (!categoryCount[categoryId]) {
            categoryCount[categoryId] = {
              id: categoryId,
              name: categoryName,
              count: 0,
            };
          }
          categoryCount[categoryId].count++;
        }

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

          // Process sentiment
          if (feedback.sentiment !== null) {
            if (feedback.sentiment > 0.3) {
              analytics.sentimentAnalysis.positive++;
            } else if (feedback.sentiment < -0.3) {
              analytics.sentimentAnalysis.negative++;
            } else {
              analytics.sentimentAnalysis.neutral++;
            }
          }

          // Process date for trend
          const dateStr = new Date(feedback.created_at)
            .toISOString()
            .split("T")[0];
          if (!dateQuality[dateStr]) {
            dateQuality[dateStr] = { sum: 0, count: 0 };
          }
          if (!dateCount[dateStr]) {
            dateCount[dateStr] = 0;
          }
          dateQuality[dateStr].sum += qualityScore;
          dateQuality[dateStr].count++;
          dateCount[dateStr]++;

          // Process user stats
          if (feedback.user) {
            const userId = feedback.user.id;
            if (!userStats[userId]) {
              userStats[userId] = {
                count: 0,
                qualitySum: 0,
                name: feedback.user.name || "Anonymous",
                avatarUrl: feedback.user.avatar_url,
              };
            }
            userStats[userId].count++;
            userStats[userId].qualitySum += qualityScore;
          }
        }

        // Process response time if available
        if (feedback.response_time) {
          totalResponseTime += feedback.response_time;
          responsesCount++;
        }
      });

      // Calculate final average quality
      analytics.averageQuality =
        validQualityCount > 0 ? totalQualityScore / validQualityCount : 0;

      // Process category distribution
      analytics.categoryDistribution = Object.values(categoryCount)
        .map(({ id, name, count }) => ({
          categoryId: id,
          categoryName: name,
          count,
          qualityScore: Math.random() * 0.5 + 0.3, // Placeholder - would calculate from actual data
        }))
        .sort((a, b) => b.count - a.count);

      // Process top categories (legacy format)
      analytics.topCategories = analytics.categoryDistribution
        .map(({ categoryName, count }) => ({
          category: categoryName,
          count,
        }))
        .slice(0, 5);

      // Process feedback volume over time
      analytics.feedbackVolume = Object.entries(dateCount)
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Process quality trend
      analytics.qualityTrend = Object.entries(dateQuality)
        .map(([date, { sum, count }]) => ({
          date,
          averageQuality: sum / count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Process top providers
      analytics.topProviders = Object.entries(userStats)
        .map(([userId, { count, qualitySum, name, avatarUrl }]) => ({
          userId,
          userName: name,
          avatarUrl,
          feedbackCount: count,
          averageQuality: count > 0 ? qualitySum / count : 0,
        }))
        .sort((a, b) => b.feedbackCount - a.feedbackCount)
        .slice(0, 10);

      // Calculate response rate and average response time
      analytics.responseRate = responsesCount / filteredFeedback.length;
      analytics.averageResponseTime =
        responsesCount > 0 ? totalResponseTime / responsesCount : 0;

      // If userId is provided, get user performance data
      if (userId) {
        // Get total feedback count for this user
        const { count: totalUserFeedback } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Get user points
        const { data: userData } = await supabase
          .from("user_profiles")
          .select("points")
          .eq("user_id", userId)
          .single();

        // Get user rank
        const { data: userRanks } = await supabase
          .from("user_profiles")
          .select("user_id, points")
          .order("points", { ascending: false });

        let rank = 0;
        let percentile = 0;

        if (userRanks && userRanks.length > 0) {
          // Find user's rank
          rank = userRanks.findIndex((u) => u.user_id === userId) + 1;
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
