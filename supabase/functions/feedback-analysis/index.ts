// Feedback Analysis Edge Function

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Feedback content is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
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

    // Analyze feedback using OpenAI
    const metrics = await analyzeFeedbackWithOpenAI(content, openaiApiKey);

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in feedback analysis:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze feedback" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

async function analyzeFeedbackWithOpenAI(
  content: string,
  apiKey: string,
): Promise<FeedbackQualityMetrics> {
  try {
    const prompt = `
      Analyze the following feedback text and provide scores for these metrics:
      
      Feedback: "${content}"
      
      Please evaluate on these dimensions:
      1. Specificity (0.0-1.0): How specific and detailed is the feedback? Higher scores for precise, detailed observations.
      2. Actionability (0.0-1.0): How actionable is the feedback? Higher scores for clear suggestions that can be implemented.
      3. Novelty (0.0-1.0): How unique/valuable is this feedback likely to be? Higher scores for insights that aren't obvious.
      4. Sentiment (-1.0 to 1.0): The overall sentiment of the feedback, from negative to positive.
      
      Return ONLY a JSON object with these four scores, nothing else.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error("Failed to analyze feedback with OpenAI");
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;

    if (!resultText) {
      throw new Error("No result from OpenAI");
    }

    // Extract JSON from the response
    let jsonMatch = resultText.match(/\{[\s\S]*\}/);
    let metricsJson = jsonMatch ? jsonMatch[0] : "{}";

    // Parse the JSON
    const metrics = JSON.parse(metricsJson);

    // Ensure all required fields are present
    return {
      specificityScore: parseFloat(
        metrics.specificity || metrics.specificityScore || "0.5",
      ),
      actionabilityScore: parseFloat(
        metrics.actionability || metrics.actionabilityScore || "0.5",
      ),
      noveltyScore: parseFloat(
        metrics.novelty || metrics.noveltyScore || "0.5",
      ),
      sentiment: parseFloat(metrics.sentiment || "0"),
    };
  } catch (error) {
    console.error("Error analyzing feedback with OpenAI:", error);
    // Return default values if analysis fails
    return {
      specificityScore: 0.5,
      actionabilityScore: 0.5,
      noveltyScore: 0.5,
      sentiment: 0,
    };
  }
}
