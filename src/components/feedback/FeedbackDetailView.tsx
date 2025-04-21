import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  XCircle,
  Star,
  Info as InfoIcon,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { feedbackService } from "@/services/feedback";
import FeedbackResponsePanel from "./FeedbackResponsePanel";
import ElementFeedbackSummary from "./ElementFeedbackSummary";
import FeedbackQualityRating from "./FeedbackQualityRating";

interface FeedbackDetailViewProps {
  feedbackId: string;
  projectId: string;
  isProjectOwner: boolean;
  onClose?: () => void;
  onStatusChange?: () => void;
}

const FeedbackDetailView: React.FC<FeedbackDetailViewProps> = ({
  feedbackId,
  projectId,
  isProjectOwner,
  onClose,
  onStatusChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [elementSummary, setElementSummary] = useState<any>(null);

  useEffect(() => {
    if (!feedbackId) return;

    const loadFeedbackDetails = async () => {
      try {
        setIsLoading(true);

        // Load feedback details
        const feedbackData = await feedbackService.getFeedbackById(feedbackId);
        if (feedbackData) {
          setFeedback(feedbackData);

          // Load responses
          const responsesData =
            await feedbackService.getFeedbackResponses(feedbackId);
          setResponses(responsesData);

          // Load element summary
          if (feedbackData.element_selector) {
            const summaryData = await feedbackService.getElementFeedbackSummary(
              feedbackData.element_selector,
              projectId,
            );
            setElementSummary(summaryData);
          }
        }
      } catch (error) {
        console.error("Error loading feedback details:", error);
        toast({
          title: "Error",
          description: "Failed to load feedback details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedbackDetails();
  }, [feedbackId, projectId, toast]);

  const handleStatusChange = async (status: string) => {
    if (!user || !feedback) return;

    try {
      await feedbackService.updateFeedbackStatus(
        feedbackId,
        status as any,
        user.id,
      );

      // Update local state
      setFeedback({
        ...feedback,
        implementation_status: status,
      });

      // Show success toast
      toast({
        title: "Status updated",
        description: `Feedback status updated to ${status}`,
      });

      // Trigger callback
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleResponseAdded = async () => {
    try {
      // Reload responses
      const responsesData =
        await feedbackService.getFeedbackResponses(feedbackId);
      setResponses(responsesData);
    } catch (error) {
      console.error("Error reloading responses:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "planned":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      case "implemented":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "declined":
        return <XCircle className="h-4 w-4 mr-1" />;
      case "considered":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

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

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardContent className="p-6 flex justify-center items-center">
          <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
          <span className="ml-2">Loading feedback details...</span>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) {
    return (
      <Card className="bg-white dark:bg-slate-800 shadow-sm">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p>Feedback not found</p>
          {onClose && (
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Feedback Details
            </CardTitle>
            <CardDescription>
              Detailed view of the selected feedback
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
          {/* Status and metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(feedback.implementation_status)}>
                <div className="flex items-center">
                  {getStatusIcon(feedback.implementation_status)}
                  <span className="capitalize">
                    {feedback.implementation_status}
                  </span>
                </div>
              </Badge>
              <Badge>{feedback.category}</Badge>
              {feedback.subcategory && (
                <Badge variant="outline">{feedback.subcategory}</Badge>
              )}
              <Badge variant="outline">Severity: {feedback.severity}/5</Badge>
            </div>

            {/* Status change buttons (for project owner) */}
            {isProjectOwner && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  onClick={() => handleStatusChange("planned")}
                  disabled={feedback.implementation_status === "planned"}
                >
                  Mark Planned
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                  onClick={() => handleStatusChange("implemented")}
                  disabled={feedback.implementation_status === "implemented"}
                >
                  Mark Implemented
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                  onClick={() => handleStatusChange("declined")}
                  disabled={feedback.implementation_status === "declined"}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">
                <MessageSquare className="h-4 w-4 mr-2" /> Feedback & Responses
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <ThumbsUp className="h-4 w-4 mr-2" /> Element Analysis
              </TabsTrigger>
              {isProjectOwner && (
                <TabsTrigger value="rating">
                  <Star className="h-4 w-4 mr-2" /> Quality Rating
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <FeedbackResponsePanel
                feedbackId={feedback.id}
                projectId={projectId}
                feedbackContent={feedback.content}
                feedbackCategory={feedback.category}
                feedbackSeverity={feedback.severity}
                feedbackUser={{
                  name: feedback.user?.full_name || "Anonymous",
                  avatar: feedback.user?.avatar_url,
                }}
                feedbackCreatedAt={feedback.created_at}
                responses={responses}
                isProjectOwner={isProjectOwner}
                onResponseAdded={handleResponseAdded}
              />
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              {elementSummary ? (
                <ElementFeedbackSummary
                  elementSelector={elementSummary.element_selector}
                  elementType={elementSummary.element_type}
                  feedbackCount={elementSummary.feedback_count}
                  averageSentiment={elementSummary.average_sentiment}
                  averageSeverity={elementSummary.average_severity}
                  pros={elementSummary.pros}
                  cons={elementSummary.cons}
                  actionRecommendations={elementSummary.action_recommendations.map(
                    (rec: any) => ({
                      text: rec.text,
                      priority: rec.priority,
                      estimatedImpact: rec.estimated_impact,
                    }),
                  )}
                  implementationStatus={feedback.implementation_status}
                />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No element analysis available</p>
                </div>
              )}
            </TabsContent>

            {isProjectOwner && (
              <TabsContent value="rating" className="mt-4">
                <Card className="bg-white dark:bg-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      Rate Feedback Quality
                    </CardTitle>
                    <CardDescription>
                      Rate the quality and helpfulness of this feedback
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeedbackQualityRating
                      feedbackId={feedback.id}
                      currentRating={feedback.owner_rating || 0}
                      currentComment={feedback.owner_comment || ""}
                      onRate={async (feedbackId, rating, comment) => {
                        try {
                          await feedbackService.rateFeedbackQuality(
                            feedbackId,
                            rating,
                            comment,
                            user?.id || "",
                          );

                          // Update local state
                          setFeedback({
                            ...feedback,
                            owner_rating: rating,
                            owner_comment: comment,
                          });

                          // Show success toast
                          toast({
                            title: "Rating submitted",
                            description: `You rated this feedback ${rating}/5`,
                          });

                          // Trigger callback
                          if (onStatusChange) {
                            onStatusChange();
                          }
                        } catch (error) {
                          console.error("Error rating feedback:", error);
                          toast({
                            title: "Error",
                            description: "Failed to submit rating",
                            variant: "destructive",
                          });
                        }
                      }}
                    />

                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <InfoIcon className="h-4 w-4 mr-1 text-slate-500" />{" "}
                        About Quality Ratings
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Rating feedback helps improve the quality of feedback
                        you receive. High-quality feedback will earn the
                        provider additional points, while low-quality feedback
                        may result in fewer points being awarded.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDetailView;
