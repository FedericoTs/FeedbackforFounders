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
import { AlertCircle } from "lucide-react";

interface FeedbackElement {
  id: string;
  selector: string;
  type: string;
  severity: number; // 1-5
  frequency: number; // Number of feedback items
  category: string;
}

interface FeedbackPriorityMatrixProps {
  elements: FeedbackElement[];
  isLoading?: boolean;
  onElementClick?: (elementId: string) => void;
}

const FeedbackPriorityMatrix: React.FC<FeedbackPriorityMatrixProps> = ({
  elements,
  isLoading = false,
  onElementClick,
}) => {
  const categoryColors: Record<string, string> = {
    "UI Design": "#14b8a6", // teal
    "UX Flow": "#06b6d4", // cyan
    Content: "#f59e0b", // amber
    Functionality: "#f43f5e", // rose
    Performance: "#8b5cf6", // violet
    Accessibility: "#ec4899", // pink
    "Business Logic": "#6366f1", // indigo
    General: "#64748b", // slate
  };

  // Get the quadrant for an element based on severity and frequency
  const getQuadrant = (severity: number, frequency: number) => {
    const highSeverity = severity >= 3.5;
    const highFrequency = frequency >= 3;

    if (highSeverity && highFrequency) return "critical";
    if (highSeverity && !highFrequency) return "important";
    if (!highSeverity && highFrequency) return "moderate";
    return "low";
  };

  // Get the position for an element in the matrix
  const getPosition = (severity: number, frequency: number) => {
    // Normalize to 0-1 range
    const x = (severity - 1) / 4; // severity is 1-5
    const y = 1 - Math.min(frequency / 10, 1); // frequency capped at 10 for positioning

    // Convert to percentage for positioning
    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
    };
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
          Priority Matrix
        </CardTitle>
        <CardDescription>
          Feedback prioritization based on severity and frequency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
          </div>
        ) : elements.length > 0 ? (
          <div className="relative w-full h-[400px] bg-slate-50 dark:bg-slate-900 rounded-md p-4">
            {/* Quadrant lines */}
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-slate-300 dark:border-slate-700"></div>
            <div className="absolute top-1/2 left-0 right-0 border-t border-slate-300 dark:border-slate-700"></div>

            {/* Quadrant labels */}
            <div className="absolute left-[25%] top-[25%] transform -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
              Low Priority
            </div>
            <div className="absolute left-[75%] top-[25%] transform -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
              Important
            </div>
            <div className="absolute left-[25%] top-[75%] transform -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
              Moderate
            </div>
            <div className="absolute left-[75%] top-[75%] transform -translate-x-1/2 -translate-y-1/2 text-xs text-amber-500 dark:text-amber-400 font-medium">
              Critical
            </div>

            {/* Axis labels */}
            <div className="absolute left-0 bottom-0 text-xs text-slate-500 dark:text-slate-400">
              Low Severity
            </div>
            <div className="absolute right-0 bottom-0 text-xs text-slate-500 dark:text-slate-400">
              High Severity
            </div>
            <div className="absolute left-0 top-0 text-xs text-slate-500 dark:text-slate-400">
              Low Frequency
            </div>
            <div className="absolute left-0 bottom-0 text-xs text-slate-500 dark:text-slate-400 transform -rotate-90 origin-top-left translate-y-6">
              High Frequency
            </div>

            {/* Elements */}
            {elements.map((element) => {
              const position = getPosition(element.severity, element.frequency);
              const quadrant = getQuadrant(element.severity, element.frequency);
              const color = categoryColors[element.category] || "#64748b";
              const size = Math.min(
                60,
                Math.max(30, 20 + element.frequency * 5),
              );

              return (
                <div
                  key={element.id}
                  className="absolute rounded-full cursor-pointer flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:z-10 hover:scale-110"
                  style={{
                    ...position,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: `${color}20`,
                    border: `2px solid ${color}`,
                    zIndex: Math.floor(element.severity),
                  }}
                  onClick={() => onElementClick && onElementClick(element.id)}
                  title={`${element.type}: ${element.selector.substring(0, 30)}${element.selector.length > 30 ? "..." : ""}`}
                >
                  <span className="text-xs font-medium" style={{ color }}>
                    {element.frequency}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No feedback data available for priority matrix</p>
          </div>
        )}

        {elements.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Critical Issues
                </h3>
                <div className="space-y-2">
                  {elements
                    .filter(
                      (el) =>
                        getQuadrant(el.severity, el.frequency) === "critical",
                    )
                    .slice(0, 3)
                    .map((element) => (
                      <div
                        key={element.id}
                        className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-md text-sm cursor-pointer"
                        onClick={() =>
                          onElementClick && onElementClick(element.id)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{
                              backgroundColor:
                                categoryColors[element.category] || "#64748b",
                            }}
                          >
                            {element.category}
                          </Badge>
                          <Badge variant="outline">{element.type}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate">
                          {element.selector}
                        </div>
                      </div>
                    ))}
                  {elements.filter(
                    (el) =>
                      getQuadrant(el.severity, el.frequency) === "critical",
                  ).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      No critical issues found
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Important Issues
                </h3>
                <div className="space-y-2">
                  {elements
                    .filter(
                      (el) =>
                        getQuadrant(el.severity, el.frequency) === "important",
                    )
                    .slice(0, 3)
                    .map((element) => (
                      <div
                        key={element.id}
                        className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm cursor-pointer"
                        onClick={() =>
                          onElementClick && onElementClick(element.id)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{
                              backgroundColor:
                                categoryColors[element.category] || "#64748b",
                            }}
                          >
                            {element.category}
                          </Badge>
                          <Badge variant="outline">{element.type}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 truncate">
                          {element.selector}
                        </div>
                      </div>
                    ))}
                  {elements.filter(
                    (el) =>
                      getQuadrant(el.severity, el.frequency) === "important",
                  ).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      No important issues found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackPriorityMatrix;
