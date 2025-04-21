import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface ElementFeedbackSummaryProps {
  elementSelector: string;
  elementType: string;
  feedbackCount: number;
  averageSentiment: number;
  averageSeverity: number;
  pros: string[];
  cons: string[];
  actionRecommendations: {
    text: string;
    priority: "high" | "medium" | "low";
    estimatedImpact: "high" | "medium" | "low";
  }[];
  implementationStatus:
    | "pending"
    | "planned"
    | "implemented"
    | "declined"
    | "considered";
  onClose?: () => void;
}

const ElementFeedbackSummary: React.FC<ElementFeedbackSummaryProps> = ({
  elementSelector,
  elementType,
  feedbackCount,
  averageSentiment,
  averageSeverity,
  pros,
  cons,
  actionRecommendations,
  implementationStatus,
  onClose,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
      case "planned":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "implemented":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
      case "declined":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400";
      case "considered":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "planned":
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      case "implemented":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "declined":
        return <ThumbsDown className="h-4 w-4 mr-1" />;
      case "considered":
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
      case "low":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      default:
        return "";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400";
      case "medium":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400";
      case "low":
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400";
      default:
        return "";
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Element Feedback Summary
            </CardTitle>
            <CardDescription>
              AI-generated insights for the selected element
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Element Details
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{elementType}</Badge>
                <Badge className={getStatusColor(implementationStatus)}>
                  <div className="flex items-center">
                    {getStatusIcon(implementationStatus)}
                    <span className="capitalize">{implementationStatus}</span>
                  </div>
                </Badge>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                {elementSelector}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {feedbackCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Feedback Items
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
              <div className="text-2xl font-bold flex justify-center">
                {averageSentiment > 0 ? (
                  <ThumbsUp className="text-emerald-500" />
                ) : averageSentiment < 0 ? (
                  <ThumbsDown className="text-rose-500" />
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Overall Sentiment
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {averageSeverity.toFixed(1)}/5
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Avg. Severity
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1 text-emerald-500" /> Pros
              </h3>
              {pros.length > 0 ? (
                <ul className="space-y-2">
                  {pros.map((pro, index) => (
                    <li
                      key={index}
                      className="text-sm text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md"
                    >
                      {pro}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No positive feedback identified
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center">
                <ThumbsDown className="h-4 w-4 mr-1 text-rose-500" /> Cons
              </h3>
              {cons.length > 0 ? (
                <ul className="space-y-2">
                  {cons.map((con, index) => (
                    <li
                      key={index}
                      className="text-sm text-slate-600 dark:text-slate-300 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-md"
                    >
                      {con}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  No negative feedback identified
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
              Action Recommendations
            </h3>
            {actionRecommendations.length > 0 ? (
              <ul className="space-y-3">
                {actionRecommendations.map((action, index) => (
                  <li
                    key={index}
                    className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {action.text}
                      </div>
                      <div className="flex gap-1">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority} priority
                        </Badge>
                        <Badge
                          className={getImpactColor(action.estimatedImpact)}
                        >
                          {action.estimatedImpact} impact
                        </Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No action recommendations available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElementFeedbackSummary;
