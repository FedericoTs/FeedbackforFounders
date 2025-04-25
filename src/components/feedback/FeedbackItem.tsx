import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/supabase/auth";
import { feedbackService } from "@/services/feedback";
import FeedbackQualityIndicator from "../FeedbackQualityIndicator";
import FeedbackResponseForm from "./FeedbackResponseForm";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedbackItemProps {
  feedback: any;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({
  feedback,
  isExpanded = false,
  onToggleExpand,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(
    null,
  );

  // Load responses when feedback is expanded
  useEffect(() => {
    if (isExpanded && feedback?.id) {
      loadResponses();
    }
  }, [isExpanded, feedback?.id]);

  const loadResponses = async () => {
    if (!feedback?.id) return;

    setIsLoadingResponses(true);
    try {
      const responseData = await feedbackService.getFeedbackResponses(
        feedback.id,
      );
      setResponses(responseData);
    } catch (error) {
      console.error("Error loading responses:", error);
      toast({
        title: "Error",
        description: "Failed to load responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const handleResponseSubmit = async (content: string, parentId?: string) => {
    if (!user || !feedback?.id) return;

    try {
      const result = await feedbackService.createResponse({
        feedbackId: feedback.id,
        userId: user.id,
        content,
        parentId,
        isOfficial: user.id === feedback.project?.owner_id,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Response submitted successfully.",
        });
        setShowResponseForm(false);
        setReplyingTo(null);
        loadResponses(); // Reload responses
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit response.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResponseUpdate = async (responseId: string, content: string) => {
    try {
      const result = await feedbackService.updateResponse(responseId, content);

      if (result.success) {
        toast({
          title: "Success",
          description: "Response updated successfully.",
        });
        setEditingResponseId(null);
        loadResponses(); // Reload responses
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update response.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating response:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResponseDelete = async (responseId: string) => {
    try {
      const result = await feedbackService.deleteResponse(responseId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Response deleted successfully.",
        });
        loadResponses(); // Reload responses
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete response.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderResponseItem = (response: any, isReply = false) => {
    const isEditing = editingResponseId === response.id;
    const isCurrentUser = user?.id === response.user?.id;
    const isOfficial = response.is_official;

    return (
      <div
        key={response.id}
        className={cn(
          "p-4 rounded-lg",
          isReply ? "ml-8 mt-2" : "mt-3",
          isOfficial ? "bg-blue-50" : "bg-slate-50",
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={response.user?.avatar_url}
              alt={response.user?.name || "User"}
            />
            <AvatarFallback>
              {(response.user?.name || "U").charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {response.user?.name || "Anonymous"}
                </span>
                {isOfficial && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Official
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(response.created_at), {
                    addSuffix: true,
                  })}
                </span>

                {isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingResponseId(response.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleResponseDelete(response.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {isEditing ? (
              <FeedbackResponseForm
                initialContent={response.content}
                onSubmit={(content) =>
                  handleResponseUpdate(response.id, content)
                }
                onCancel={() => setEditingResponseId(null)}
                isEditing={true}
              />
            ) : (
              <>
                <p className="mt-1 text-slate-700">{response.content}</p>

                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      setReplyingTo(response.id);
                      setShowResponseForm(true);
                    }}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                </div>

                {replyingTo === response.id && showResponseForm && (
                  <div className="mt-3">
                    <FeedbackResponseForm
                      onSubmit={(content) =>
                        handleResponseSubmit(content, response.id)
                      }
                      onCancel={() => setReplyingTo(null)}
                      placeholder="Write a reply..."
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Group responses into threads (parent responses and their replies)
  const organizeResponseThreads = (responseList: any[]) => {
    const parentResponses = responseList.filter((r) => !r.parent_id);
    const childResponses = responseList.filter((r) => r.parent_id);

    return parentResponses.map((parent) => {
      const children = childResponses.filter(
        (child) => child.parent_id === parent.id,
      );
      return {
        ...parent,
        replies: children,
      };
    });
  };

  const responseThreads = organizeResponseThreads(responses);

  if (!feedback) return null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage
                src={feedback.user?.avatar_url}
                alt={feedback.user?.name || "User"}
              />
              <AvatarFallback>
                {(feedback.user?.name || "U").charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {feedback.user?.name || "Anonymous"}
                </h3>
                {feedback.user?.level && (
                  <Badge variant="outline" className="text-xs">
                    Level {feedback.user.level}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>
                  {format(new Date(feedback.created_at), "MMM d, yyyy")}
                </span>
                <span>•</span>
                <span>{feedback.section_name || "General"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-50">
              {feedback.category || "General"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Not Helpful
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-slate-700">{feedback.content}</p>

        {feedback.specificity_score &&
          feedback.actionability_score &&
          feedback.novelty_score && (
            <div className="mt-4">
              <FeedbackQualityIndicator
                specificityScore={feedback.specificity_score}
                actionabilityScore={feedback.actionability_score}
                noveltyScore={feedback.novelty_score}
                sentiment={feedback.sentiment || 0}
                compact={true}
              />
            </div>
          )}
      </CardContent>

      <CardFooter className="flex-col items-start pt-0">
        <div className="w-full flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900"
            onClick={onToggleExpand}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {isExpanded
              ? "Hide Responses"
              : `${feedback.response_count || 0} Responses`}
          </Button>

          {isExpanded && !showResponseForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
            >
              <Reply className="h-4 w-4 mr-2" />
              Respond
            </Button>
          )}
        </div>

        {isExpanded && (
          <div className="w-full mt-4">
            {showResponseForm && !replyingTo && (
              <FeedbackResponseForm
                onSubmit={(content) => handleResponseSubmit(content)}
                onCancel={() => setShowResponseForm(false)}
              />
            )}

            {isLoadingResponses ? (
              <div className="space-y-4 mt-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : responses.length > 0 ? (
              <ScrollArea className="max-h-[400px] mt-2">
                <div className="space-y-1">
                  {responseThreads.map((thread) => (
                    <div key={thread.id}>
                      {renderResponseItem(thread)}
                      {thread.replies?.map((reply: any) =>
                        renderResponseItem(reply, true),
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No responses yet. Be the first to respond!</p>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default FeedbackItem;
