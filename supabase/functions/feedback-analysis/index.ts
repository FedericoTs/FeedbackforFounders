import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  feedbackId: string;
  content: string;
  category: string;
  subcategory?: string;
  severity: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const requestData: RequestBody = await req.json();
    const { feedbackId, content, category, subcategory, severity } =
      requestData;

    if (!feedbackId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Analyze sentiment (simple implementation - in production, use OpenAI API)
    const sentimentScore = analyzeSentiment(content);

    // Calculate actionability score (simple implementation)
    const actionabilityScore = calculateActionabilityScore(content, severity);

    // Calculate quality score
    const qualityScore = calculateQualityScore(content, actionabilityScore);

    // Extract key suggestions (simple implementation)
    const keySuggestions = extractKeySuggestions(content);

    // Detect categories (simple implementation)
    const detectedCategories = [category];
    if (subcategory) {
      detectedCategories.push(subcategory);
    }

    // Store analysis results
    const { data, error } = await supabaseClient
      .from("feedback_analysis")
      .insert({
        feedback_id: feedbackId,
        raw_sentiment: sentimentScore,
        normalized_sentiment: normalizeSentiment(sentimentScore),
        key_suggestions: keySuggestions,
        detected_categories: detectedCategories,
        quality_indicators: {
          length: content.length,
          specificity: calculateSpecificity(content),
          constructiveness: calculateConstructiveness(content),
        },
        actionability_score: actionabilityScore,
        uniqueness_score: 8, // Placeholder - would require comparison with other feedback
        analysis_version: "1.0",
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing analysis:", error);
      throw error;
    }

    // Return analysis results
    return new Response(
      JSON.stringify({
        sentiment: sentimentScore,
        actionability_score: actionabilityScore,
        quality_score: qualityScore,
        key_suggestions: keySuggestions,
        detected_categories: detectedCategories,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error processing feedback analysis:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simple sentiment analysis function (placeholder for OpenAI API call)
function analyzeSentiment(text: string): number {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "awesome",
    "fantastic",
    "wonderful",
    "brilliant",
    "outstanding",
    "superb",
    "perfect",
    "love",
    "like",
    "enjoy",
    "appreciate",
    "helpful",
    "useful",
    "intuitive",
    "easy",
    "clear",
    "clean",
    "beautiful",
    "elegant",
    "impressive",
  ];

  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "horrible",
    "disappointing",
    "frustrating",
    "annoying",
    "confusing",
    "difficult",
    "hard",
    "ugly",
    "messy",
    "cluttered",
    "slow",
    "buggy",
    "broken",
    "unusable",
    "hate",
    "dislike",
    "issue",
    "problem",
    "error",
    "fail",
    "failure",
  ];

  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  // Calculate sentiment score between -1 and 1
  if (positiveCount === 0 && negativeCount === 0) return 0;
  return (positiveCount - negativeCount) / (positiveCount + negativeCount);
}

// Normalize sentiment to ensure it's between -1 and 1
function normalizeSentiment(sentiment: number): number {
  return Math.max(-1, Math.min(1, sentiment));
}

// Calculate actionability score (1-10)
function calculateActionabilityScore(text: string, severity: number): number {
  // Length factor - longer feedback tends to be more actionable
  const lengthFactor = Math.min(text.length / 200, 1); // Max out at 200 chars

  // Specificity factor - check for specific words that indicate actionable feedback
  const specificityWords = [
    "should",
    "could",
    "would",
    "change",
    "add",
    "remove",
    "update",
    "improve",
    "fix",
    "implement",
    "increase",
    "decrease",
    "modify",
  ];

  const words = text.toLowerCase().split(/\W+/);
  const specificWords = words.filter((word) => specificityWords.includes(word));
  const specificityFactor = Math.min(specificWords.length / 3, 1); // Max out at 3 specific words

  // Severity factor - higher severity tends to be more actionable
  const severityFactor = severity / 5;

  // Calculate overall score (1-10)
  const score =
    1 +
    9 * (0.4 * lengthFactor + 0.4 * specificityFactor + 0.2 * severityFactor);
  return Math.round(score);
}

// Calculate quality score (1-10)
function calculateQualityScore(
  text: string,
  actionabilityScore: number,
): number {
  // Length factor
  const lengthFactor = Math.min(text.length / 300, 1); // Max out at 300 chars

  // Clarity factor - simple proxy using sentence length
  const sentences = text.split(/[.!?]+/);
  const avgSentenceLength = text.length / Math.max(sentences.length, 1);
  const clarityFactor =
    avgSentenceLength > 10 && avgSentenceLength < 100 ? 1 : 0.5;

  // Actionability factor
  const actionabilityFactor = actionabilityScore / 10;

  // Calculate overall score (1-10)
  const score =
    1 +
    9 * (0.3 * lengthFactor + 0.3 * clarityFactor + 0.4 * actionabilityFactor);
  return Math.round(score);
}

// Extract key suggestions (simple implementation)
function extractKeySuggestions(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Look for sentences that might contain suggestions
  const suggestionIndicators = [
    "should",
    "could",
    "would",
    "suggest",
    "recommend",
    "add",
    "change",
    "improve",
    "fix",
    "update",
    "consider",
    "try",
    "implement",
  ];

  const suggestions = sentences.filter((sentence) => {
    const lowerSentence = sentence.toLowerCase();
    return suggestionIndicators.some((indicator) =>
      lowerSentence.includes(indicator),
    );
  });

  // Limit to 3 suggestions and trim them
  return suggestions.slice(0, 3).map((s) => s.trim());
}

// Calculate specificity score (0-1)
function calculateSpecificity(text: string): number {
  // Check for specific details
  const specificityIndicators = [
    "px",
    "em",
    "rem",
    "seconds",
    "minutes",
    "%",
    "#",
    "rgb",
    "rgba",
    "specifically",
    "exactly",
    "precisely",
    "in particular",
  ];

  const lowerText = text.toLowerCase();
  let specificityCount = 0;

  specificityIndicators.forEach((indicator) => {
    if (lowerText.includes(indicator)) specificityCount++;
  });

  return Math.min(specificityCount / 3, 1); // Max out at 3 indicators
}

// Calculate constructiveness score (0-1)
function calculateConstructiveness(text: string): number {
  // Check for constructive phrases
  const constructivePhrases = [
    "instead",
    "rather than",
    "better if",
    "suggest",
    "recommend",
    "improve by",
    "could be",
    "would be",
    "should be",
    "perhaps",
  ];

  const lowerText = text.toLowerCase();
  let constructiveCount = 0;

  constructivePhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) constructiveCount++;
  });

  return Math.min(constructiveCount / 3, 1); // Max out at 3 phrases
}
