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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { feedbackService } from "@/services/feedback";
import FeedbackQualityIndicator from "@/components/FeedbackQualityIndicator";

interface ProjectFeedbackPanelProps {
  projectId: string;
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

const ProjectFeedbackPanel: React.FC<ProjectFeedbackPanelProps> = ({
  projectId,
  className = "",
  limit = 3,
  showViewAll = true,
}) => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
  });

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        const feedbackData =
          await feedbackService.getProjectFeedback(projectId);

        // Sort by created_at (newest first) and limit
        const sortedFeedback = feedbackData
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, limit);

        setFeedback(sortedFeedback);

        // Calculate stats
        const totalFeedback = feedbackData.length;
        const positiveFeedback = feedbackData.filter(
          (item) => (item.sentiment || 0) > 0.3,
        ).length;
        const negativeFeedback = feedbackData.filter(
          (item) => (item.sentiment || 0) < -0.3,
        ).length;
        const neutralFeedback =
          totalFeedback - positiveFeedback - negativeFeedback;

        setStats({
          total: totalFeedback,
          positive: positiveFeedback,
          negative: negativeFeedback,
          neutral: neutralFeedback,
        });
      } catch (error) {
        console.error("Error fetching project feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [projectId, limit]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewAllFeedback = () => {
    navigate(`/dashboard/feedback/${projectId}`);
  };

  const handleViewAnalytics = () => {
    navigate(`/dashboard/feedback-analytics/${projectId}`);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-teal-500" />
              Project Feedback
            </CardTitle>
            <CardDescription>
              {stats.total} feedback items received
            </CardDescription>
          </div>
          {stats.total > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAnalytics}
              className="flex items-center gap-1"
            >
              <BarChart2 className="h-4 w-4" />
              Analytics
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="h-5 w-5 border-2 border-t-transparent border-teal-500 rounded-full animate-spin"></div>
          </div>
        ) : stats.total > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">{stats.total}</span>
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">{stats.positive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <span className="text-sm">{stats.neutral}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">{stats.negative}</span>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                {feedback.map((item) => {
                  // Calculate combined quality score if metrics are available
                  const hasQualityMetrics =
                    item.specificity_score !== undefined &&
                    item.actionability_score !== undefined &&
                    item.novelty_score !== undefined;

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              item.user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.id || "user"}`
                            }
                          />
                          <AvatarFallback>
                            {item.user?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">
                                {item.user?.name || "Anonymous"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDate(item.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {item.sentiment > 0.3 ? (
                                <ThumbsUp className="h-4 w-4 text-green-500" />
                              ) : item.sentiment < -0.3 ? (
                                <ThumbsDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                </div>
                              )}
                              {item.rating &&
                                Array.from({
                                  length: Math.min(item.rating, 5),
                                }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 fill-amber-400 text-amber-400"
                                  />
                                ))}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {item.content}
                          </p>

                          {/* Show quality metrics if available */}
                          {hasQualityMetrics && (
                            <div className="mt-2">
                              <FeedbackQualityIndicator
                                metrics={{
                                  specificityScore: item.specificity_score,
                                  actionabilityScore: item.actionability_score,
                                  noveltyScore: item.novelty_score,
                                }}
                                size="sm"
                                variant="compact"
                              />
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            {item.section_name && (
                              <Badge variant="outline" className="text-xs">
                                {item.section_name}
                              </Badge>
                            )}
                            {item.category && (
                              <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {item.category}
                              </Badge>
                            )}
                            {item.points_awarded > 0 && (
                              <Badge className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                +{item.points_awarded} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {showViewAll && stats.total > limit && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleViewAllFeedback}
                  className="w-full"
                >
                  View All {stats.total} Feedback
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No feedback yet</h3>
            <p className="text-sm text-slate-500 mb-4">
              This project hasn't received any feedback yet.
            </p>
            <Button
              onClick={() => navigate(`/dashboard/feedback/${projectId}`)}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            >
              Give Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFeedbackPanel;
