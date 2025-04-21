import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Filter, MessageSquare, AlertCircle } from "lucide-react";

interface FeedbackPoint {
  id: string;
  x: number;
  y: number;
  category: string;
  severity: number;
  count: number;
}

interface FeedbackHeatmapProps {
  projectId: string;
  websiteUrl: string;
  feedbackPoints: FeedbackPoint[];
  isLoading?: boolean;
  onPointClick?: (feedbackId: string) => void;
  categoryFilter?: string;
  severityFilter?: number;
}

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

const FeedbackHeatmap: React.FC<FeedbackHeatmapProps> = ({
  projectId,
  websiteUrl,
  feedbackPoints,
  isLoading = false,
  onPointClick,
  categoryFilter,
  severityFilter,
}) => {
  const [viewMode, setViewMode] = useState<"all" | "open">("all");
  const [filteredPoints, setFilteredPoints] = useState<FeedbackPoint[]>([]);
  const [websiteLoaded, setWebsiteLoaded] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Filter points based on category and severity
  useEffect(() => {
    let points = [...feedbackPoints];

    if (categoryFilter) {
      points = points.filter((point) => point.category === categoryFilter);
    }

    if (severityFilter) {
      points = points.filter((point) => point.severity === severityFilter);
    }

    if (viewMode === "open") {
      // In a real implementation, we would filter by implementation_status
      // For now, we'll just show all points
    }

    setFilteredPoints(points);
  }, [feedbackPoints, categoryFilter, severityFilter, viewMode]);

  const handleWebsiteLoad = () => {
    setWebsiteLoaded(true);
    setWebsiteError(null);
  };

  const handleWebsiteError = () => {
    setWebsiteLoaded(false);
    setWebsiteError(
      "Failed to load website preview. Using placeholder instead.",
    );
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Feedback Heatmap
            </CardTitle>
            <CardDescription>
              Visual representation of feedback density
            </CardDescription>
          </div>
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "all" | "open")}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Feedback</TabsTrigger>
              <TabsTrigger value="open">Open Issues</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
          </div>
        ) : filteredPoints.length > 0 ? (
          <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden">
            {/* Website preview (placeholder) */}
            {websiteError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                <div className="text-center p-4">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-600 dark:text-slate-400">
                    {websiteError}
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">
                  Website preview placeholder
                </p>
              </div>
            )}

            {/* Feedback pins overlay */}
            {filteredPoints.map((point) => {
              const size = Math.min(30, Math.max(15, 10 + point.count * 5)); // Size based on count (min 15px, max 30px)
              const color = categoryColors[point.category] || "#64748b";

              return (
                <div
                  key={point.id}
                  className="absolute rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 hover:z-10 hover:scale-110"
                  style={{
                    top: `${point.y}%`,
                    left: `${point.x}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: `${color}80`, // 50% opacity
                    border: `2px solid ${color}`,
                    zIndex: Math.floor(point.severity || 1),
                  }}
                  onClick={() => onPointClick && onPointClick(point.id)}
                >
                  <span className="text-white text-xs font-bold">
                    {point.count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No feedback data available for heatmap visualization</p>
          </div>
        )}

        {filteredPoints.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryColors).map(([category, color]) => (
                <Badge
                  key={category}
                  className="cursor-pointer"
                  style={{
                    backgroundColor:
                      categoryFilter === category ? color : `${color}20`,
                    color: categoryFilter === category ? "white" : color,
                    borderColor: color,
                  }}
                  variant={categoryFilter === category ? "default" : "outline"}
                  onClick={() => {
                    // In a real implementation, this would toggle the category filter
                  }}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackHeatmap;
