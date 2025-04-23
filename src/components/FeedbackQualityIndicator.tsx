import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Target, Lightbulb, MessageCircle } from "lucide-react";

interface FeedbackQualityMetrics {
  specificityScore: number;
  actionabilityScore: number;
  noveltyScore: number;
  sentiment?: number;
}

interface FeedbackQualityIndicatorProps {
  metrics: FeedbackQualityMetrics;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "horizontal" | "vertical" | "compact" | "inline";
  showSentiment?: boolean;
  interactive?: boolean;
  onMetricClick?: (metric: string) => void;
}

const FeedbackQualityIndicator = ({
  metrics,
  showLabels = true,
  size = "md",
  variant = "horizontal",
  showSentiment = false,
  interactive = false,
  onMetricClick,
}: FeedbackQualityIndicatorProps) => {
  // Calculate overall quality score
  const qualityScore =
    (metrics.specificityScore +
      metrics.actionabilityScore +
      metrics.noveltyScore) /
    3;

  // Determine quality level
  const getQualityLevel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Average";
    return "Basic";
  };

  // Determine color based on score
  const getColorClass = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-teal-600 dark:text-teal-400";
    if (score >= 0.4) return "text-amber-600 dark:text-amber-400";
    return "text-slate-600 dark:text-slate-400";
  };

  // Determine progress color based on score
  const getProgressColorClass = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-teal-500";
    if (score >= 0.4) return "bg-amber-500";
    return "bg-slate-500";
  };

  // Get sentiment color and label
  const getSentimentInfo = (sentiment: number | undefined) => {
    if (sentiment === undefined)
      return { color: "bg-slate-500", label: "Neutral" };
    if (sentiment >= 0.3) return { color: "bg-green-500", label: "Positive" };
    if (sentiment <= -0.3) return { color: "bg-red-500", label: "Negative" };
    return { color: "bg-amber-500", label: "Neutral" };
  };

  // Size classes
  const sizeClasses = {
    sm: {
      container: "text-xs gap-1",
      progress: "h-1",
      icon: "h-3 w-3",
    },
    md: {
      container: "text-sm gap-2",
      progress: "h-2",
      icon: "h-4 w-4",
    },
    lg: {
      container: "text-base gap-3",
      progress: "h-3",
      icon: "h-5 w-5",
    },
  };

  // Handle metric click
  const handleMetricClick = (metric: string) => {
    if (interactive && onMetricClick) {
      onMetricClick(metric);
    }
  };

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge
          className={`${
            getQualityLevel(qualityScore) === "Excellent"
              ? "bg-green-100 text-green-700"
              : getQualityLevel(qualityScore) === "Good"
                ? "bg-teal-100 text-teal-700"
                : getQualityLevel(qualityScore) === "Average"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700"
          }`}
        >
          {Math.round(qualityScore * 100)}% Quality
        </Badge>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Badge
          className={`${
            getQualityLevel(qualityScore) === "Excellent"
              ? "bg-green-100 text-green-700"
              : getQualityLevel(qualityScore) === "Good"
                ? "bg-teal-100 text-teal-700"
                : getQualityLevel(qualityScore) === "Average"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700"
          }`}
        >
          {getQualityLevel(qualityScore)} Quality
        </Badge>
        <span className={`font-medium ${getColorClass(qualityScore)}`}>
          {Math.round(qualityScore * 100)}%
        </span>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col ${sizeClasses[size].container}`}>
        {showLabels && (
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">Feedback Quality</span>
            <span className={`font-medium ${getColorClass(qualityScore)}`}>
              {Math.round(qualityScore * 100)}%
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Target className={sizeClasses[size].icon} />
                <span>Specificity</span>
              </div>
              <span>{Math.round(metrics.specificityScore * 100)}%</span>
            </div>
            <Progress
              value={metrics.specificityScore * 100}
              className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.specificityScore)}`}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <ThumbsUp className={sizeClasses[size].icon} />
                <span>Actionability</span>
              </div>
              <span>{Math.round(metrics.actionabilityScore * 100)}%</span>
            </div>
            <Progress
              value={metrics.actionabilityScore * 100}
              className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.actionabilityScore)}`}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Lightbulb className={sizeClasses[size].icon} />
                <span>Novelty</span>
              </div>
              <span>{Math.round(metrics.noveltyScore * 100)}%</span>
            </div>
            <Progress
              value={metrics.noveltyScore * 100}
              className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.noveltyScore)}`}
            />
          </div>

          {showSentiment && metrics.sentiment !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <MessageCircle className={sizeClasses[size].icon} />
                  <span>Sentiment</span>
                </div>
                <span>{getSentimentInfo(metrics.sentiment).label}</span>
              </div>
              <Progress
                value={(metrics.sentiment + 1) * 50} // Convert from -1...1 to 0...100
                className={`${sizeClasses[size].progress} ${getSentimentInfo(metrics.sentiment).color}`}
              />
            </div>
          )}
        </div>

        {showLabels && (
          <div className="mt-2">
            <Badge
              className={`${
                getQualityLevel(qualityScore) === "Excellent"
                  ? "bg-green-100 text-green-700"
                  : getQualityLevel(qualityScore) === "Good"
                    ? "bg-teal-100 text-teal-700"
                    : getQualityLevel(qualityScore) === "Average"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
              }`}
            >
              {getQualityLevel(qualityScore)} Quality
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex justify-between items-center">
          <span className="font-medium">Feedback Quality</span>
          <span className={`font-medium ${getColorClass(qualityScore)}`}>
            {Math.round(qualityScore * 100)}% - {getQualityLevel(qualityScore)}
          </span>
        </div>
      )}

      <div
        className={`grid ${showSentiment && metrics.sentiment !== undefined ? "grid-cols-4" : "grid-cols-3"} gap-4 ${sizeClasses[size].container}`}
      >
        <div
          className={`space-y-1 ${interactive ? "cursor-pointer hover:opacity-80" : ""}`}
          onClick={() => handleMetricClick("specificity")}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Target className={sizeClasses[size].icon} />
              <span>Specificity</span>
            </div>
            <span>{Math.round(metrics.specificityScore * 100)}%</span>
          </div>
          <Progress
            value={metrics.specificityScore * 100}
            className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.specificityScore)}`}
          />
        </div>

        <div
          className={`space-y-1 ${interactive ? "cursor-pointer hover:opacity-80" : ""}`}
          onClick={() => handleMetricClick("actionability")}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <ThumbsUp className={sizeClasses[size].icon} />
              <span>Actionability</span>
            </div>
            <span>{Math.round(metrics.actionabilityScore * 100)}%</span>
          </div>
          <Progress
            value={metrics.actionabilityScore * 100}
            className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.actionabilityScore)}`}
          />
        </div>

        <div
          className={`space-y-1 ${interactive ? "cursor-pointer hover:opacity-80" : ""}`}
          onClick={() => handleMetricClick("novelty")}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Lightbulb className={sizeClasses[size].icon} />
              <span>Novelty</span>
            </div>
            <span>{Math.round(metrics.noveltyScore * 100)}%</span>
          </div>
          <Progress
            value={metrics.noveltyScore * 100}
            className={`${sizeClasses[size].progress} ${getProgressColorClass(metrics.noveltyScore)}`}
          />
        </div>

        {showSentiment && metrics.sentiment !== undefined && (
          <div
            className={`space-y-1 ${interactive ? "cursor-pointer hover:opacity-80" : ""}`}
            onClick={() => handleMetricClick("sentiment")}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <MessageCircle className={sizeClasses[size].icon} />
                <span>Sentiment</span>
              </div>
              <span>{getSentimentInfo(metrics.sentiment).label}</span>
            </div>
            <Progress
              value={(metrics.sentiment + 1) * 50} // Convert from -1...1 to 0...100
              className={`${sizeClasses[size].progress} ${getSentimentInfo(metrics.sentiment).color}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackQualityIndicator;
