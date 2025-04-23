import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { feedbackQualityService } from "@/services/feedbackQuality";
import { debounce } from "@/lib/utils";

const FeedbackQualityAnalysisStoryboard: React.FC = () => {
  const [feedbackText, setFeedbackText] = useState(
    "This feature doesn't work well. I don't like it.",
  );
  const [metrics, setMetrics] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced analysis function
  const debouncedAnalyze = debounce(async (text: string) => {
    if (text.trim().length < 10) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const qualityMetrics = await feedbackQualityService.analyzeFeedback(text);
      setMetrics(qualityMetrics);

      const qualitySuggestions =
        feedbackQualityService.getSuggestions(qualityMetrics);
      setSuggestions(qualitySuggestions);
    } catch (err) {
      console.error("Error analyzing feedback:", err);
      setError("Failed to analyze feedback. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, 500);

  // Analyze feedback when text changes
  useEffect(() => {
    debouncedAnalyze(feedbackText);
  }, [feedbackText]);

  // Format score as percentage
  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 0.7) return "bg-green-600";
    if (score >= 0.4) return "bg-amber-600";
    return "bg-red-600";
  };

  return (
    <div className="container mx-auto p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Feedback Quality Analysis</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your feedback here..."
              className="min-h-[200px]"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isAnalyzing ? "Analyzing..." : "Analysis updates as you type"}
              </div>
              <Button
                onClick={() => debouncedAnalyze(feedbackText)}
                disabled={isAnalyzing || feedbackText.trim().length < 10}
              >
                Analyze Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && !metrics && (
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            )}

            {metrics && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Overall Quality</h3>
                    <span className={getScoreColor(metrics.qualityScore || 0)}>
                      {formatScore(metrics.qualityScore || 0)}
                    </span>
                  </div>
                  <Progress
                    value={metrics.qualityScore * 100 || 0}
                    className={getProgressColor(metrics.qualityScore || 0)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium">Specificity</h4>
                      <span
                        className={`text-sm ${getScoreColor(metrics.specificityScore)}`}
                      >
                        {formatScore(metrics.specificityScore)}
                      </span>
                    </div>
                    <Progress
                      value={metrics.specificityScore * 100}
                      className={getProgressColor(metrics.specificityScore)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How detailed and precise your feedback is
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium">Actionability</h4>
                      <span
                        className={`text-sm ${getScoreColor(metrics.actionabilityScore)}`}
                      >
                        {formatScore(metrics.actionabilityScore)}
                      </span>
                    </div>
                    <Progress
                      value={metrics.actionabilityScore * 100}
                      className={getProgressColor(metrics.actionabilityScore)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How implementable your suggestions are
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-sm font-medium">Novelty</h4>
                      <span
                        className={`text-sm ${getScoreColor(metrics.noveltyScore)}`}
                      >
                        {formatScore(metrics.noveltyScore)}
                      </span>
                    </div>
                    <Progress
                      value={metrics.noveltyScore * 100}
                      className={getProgressColor(metrics.noveltyScore)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How unique your feedback is compared to existing feedback
                    </p>
                  </div>

                  {metrics.sentiment !== undefined && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Sentiment</h4>
                        <span
                          className={`text-sm ${metrics.sentiment > 0 ? "text-green-600" : metrics.sentiment < 0 ? "text-red-600" : "text-amber-600"}`}
                        >
                          {metrics.sentiment > 0.3
                            ? "Positive"
                            : metrics.sentiment < -0.3
                              ? "Negative"
                              : "Neutral"}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${metrics.sentiment > 0 ? "bg-green-600" : metrics.sentiment < 0 ? "bg-red-600" : "bg-amber-600"}`}
                          style={{
                            width: `${Math.abs(metrics.sentiment) * 100}%`,
                            marginLeft: metrics.sentiment < 0 ? 0 : "50%",
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        The emotional tone of your feedback
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {suggestions && suggestions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Improvement Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border border-blue-100 rounded-md p-4"
                >
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">
                        {suggestion.suggestion}
                      </h4>
                      <ul className="mt-2 space-y-1">
                        {suggestion.examples.map((example, i) => (
                          <li key={i} className="text-sm flex items-start">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Quality Analysis Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Our feedback quality analysis system evaluates your feedback
              across multiple dimensions to help you provide more valuable
              input. Here's what each metric means:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium mb-2">Specificity</h4>
                <p className="text-sm text-gray-600">
                  Measures how detailed and precise your feedback is. Specific
                  feedback mentions exact features, behaviors, or issues rather
                  than general statements.
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 mr-2"
                  >
                    High
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "The dropdown menu in the user settings page doesn't show
                    all options on mobile devices with screen width under 375px"
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 mr-2"
                  >
                    Low
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "The app doesn't work well on my phone"
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium mb-2">Actionability</h4>
                <p className="text-sm text-gray-600">
                  Evaluates how implementable your suggestions are. Actionable
                  feedback provides clear direction on what could be improved
                  and how.
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 mr-2"
                  >
                    High
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "Adding a 'Save Draft' button would help prevent losing work
                    when the session times out"
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 mr-2"
                  >
                    Low
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "This needs to be better"
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium mb-2">Novelty</h4>
                <p className="text-sm text-gray-600">
                  Assesses how unique your feedback is compared to existing
                  feedback. Novel feedback provides new insights or
                  perspectives.
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 mr-2"
                  >
                    High
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "As a colorblind user, I can't distinguish between the
                    success and warning states"
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 mr-2"
                  >
                    Low
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "The login button doesn't work" (when many others have
                    reported this)
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium mb-2">Sentiment</h4>
                <p className="text-sm text-gray-600">
                  Measures the emotional tone of your feedback. While negative
                  feedback is valuable, constructive phrasing is more effective.
                </p>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 mr-2"
                  >
                    Constructive
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "The current layout makes it difficult to find important
                    features. A search function would improve navigation."
                  </span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 mr-2"
                  >
                    Unconstructive
                  </Badge>
                  <span className="text-xs text-gray-500">
                    "This is the worst design I've ever seen. Whoever made this
                    should be fired."
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackQualityAnalysisStoryboard;
