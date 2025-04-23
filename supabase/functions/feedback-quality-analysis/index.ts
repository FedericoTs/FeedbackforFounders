import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  qualityScore?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({
          error: "Text parameter is required and must be a string",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Analyze the feedback text
    const metrics = await analyzeFeedbackQuality(text);

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function analyzeFeedbackQuality(
  text: string,
): Promise<FeedbackQualityMetrics> {
  // In a production environment, you would likely use an AI service like OpenAI
  // to analyze the feedback text. For this implementation, we'll use a simplified
  // approach based on text characteristics.

  // Calculate specificity score based on text length, details, and specific terms
  const specificity = calculateSpecificityScore(text);

  // Calculate actionability score based on action verbs, suggestions, etc.
  const actionability = calculateActionabilityScore(text);

  // Calculate novelty score (this would typically involve comparing to existing feedback)
  const novelty = calculateNoveltyScore(text);

  // Calculate sentiment score (-1 to 1 scale)
  const sentiment = calculateSentimentScore(text);

  // Calculate overall quality score (weighted average)
  const qualityScore =
    (specificity * 0.4 +
      actionability * 0.4 +
      novelty * 0.2 +
      ((sentiment + 1) / 2) * 0.1) /
    1.1;

  return {
    specificityScore: specificity,
    actionabilityScore: actionability,
    noveltyScore: novelty,
    sentiment,
    qualityScore,
  };
}

function calculateSpecificityScore(text: string): number {
  // Basic implementation - in a real system this would be more sophisticated
  const length = Math.min(text.length / 200, 1); // Longer text tends to be more specific

  // Check for specific details like numbers, measurements, names
  const hasNumbers = /\d+/.test(text);
  const hasSpecificTerms =
    /specific|exactly|precisely|in particular|especially/i.test(text);
  const hasMeasurements = /\d+\s*(px|em|rem|%|seconds|minutes|hours)/i.test(
    text,
  );

  // Count sentences (more sentences often means more details)
  const sentenceCount = (text.match(/[.!?]+\s/g) || []).length + 1;
  const sentenceScore = Math.min(sentenceCount / 5, 1);

  // Calculate final score
  let score = length * 0.4 + sentenceScore * 0.3;
  if (hasNumbers) score += 0.1;
  if (hasSpecificTerms) score += 0.1;
  if (hasMeasurements) score += 0.1;

  return Math.min(Math.max(score, 0), 1);
}

function calculateActionabilityScore(text: string): number {
  // Check for action verbs and suggestion phrases
  const hasActionVerbs =
    /improve|change|add|remove|update|fix|implement|consider|try|use|apply/i.test(
      text,
    );
  const hasSuggestions =
    /suggest|recommendation|should|could|would|better if|improve by/i.test(
      text,
    );
  const hasSteps = /first|second|third|finally|next|then|step|process/i.test(
    text,
  );

  // Check for comparative language
  const hasComparisons =
    /better|worse|more|less|instead of|rather than|compared to/i.test(text);

  // Calculate score
  let score = 0.3; // Base score
  if (hasActionVerbs) score += 0.2;
  if (hasSuggestions) score += 0.2;
  if (hasSteps) score += 0.2;
  if (hasComparisons) score += 0.1;

  return Math.min(Math.max(score, 0), 1);
}

function calculateNoveltyScore(text: string): number {
  // In a real implementation, this would compare against existing feedback
  // For this simplified version, we'll use a random score with some text-based adjustments

  // Check for phrases that might indicate novel thinking
  const hasNovelPhrases =
    /new idea|alternative approach|different perspective|unique|innovative|creative/i.test(
      text,
    );
  const hasPersonalExperience =
    /I found|I noticed|I experienced|in my experience|from my perspective/i.test(
      text,
    );

  // Calculate score
  let score = 0.5; // Base score
  if (hasNovelPhrases) score += 0.2;
  if (hasPersonalExperience) score += 0.2;

  // Add some randomness to simulate the variability of novelty
  score += Math.random() * 0.2 - 0.1;

  return Math.min(Math.max(score, 0), 1);
}

function calculateSentimentScore(text: string): number {
  // Simple sentiment analysis based on positive and negative word counts
  // In a real implementation, you would use a more sophisticated sentiment analysis model

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "helpful",
    "useful",
    "effective",
    "impressive",
    "love",
    "like",
    "enjoy",
    "appreciate",
    "clear",
    "intuitive",
    "easy",
    "simple",
    "efficient",
    "beautiful",
    "elegant",
  ];

  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "horrible",
    "useless",
    "ineffective",
    "confusing",
    "difficult",
    "hard",
    "complicated",
    "frustrating",
    "annoying",
    "hate",
    "dislike",
    "slow",
    "buggy",
    "broken",
    "ugly",
    "cluttered",
    "messy",
  ];

  // Count positive and negative words
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  }

  // Check for negations that might flip sentiment
  const negations = [
    "not",
    "no",
    "don't",
    "doesn't",
    "didn't",
    "won't",
    "wouldn't",
    "couldn't",
    "shouldn't",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
  ];
  let negationCount = 0;

  for (const negation of negations) {
    const regex = new RegExp(`\\b${negation}\\b`, "g");
    const matches = lowerText.match(regex);
    if (matches) negationCount += matches.length;
  }

  // Adjust counts based on negations (simplified approach)
  if (negationCount > 0) {
    // Swap a portion of positive and negative counts based on negation count
    const swapAmount = Math.min(
      Math.min(positiveCount, negativeCount),
      negationCount,
    );
    positiveCount -= swapAmount;
    negativeCount -= swapAmount;
    positiveCount += swapAmount;
    negativeCount += swapAmount;
  }

  // Calculate sentiment score between -1 and 1
  const totalWords = text.split(/\s+/).length;
  const sentimentScore =
    totalWords > 0
      ? (positiveCount - negativeCount) / Math.sqrt(totalWords)
      : 0;

  // Normalize to range [-1, 1]
  return Math.max(Math.min(sentimentScore, 1), -1);
}
