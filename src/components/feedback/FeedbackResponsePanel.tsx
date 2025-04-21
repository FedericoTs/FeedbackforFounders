import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, AlertCircle } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { feedbackService } from "@/services/feedback";

interface FeedbackResponse {
  id: string;
  content: string;
  created_at: string;
  is_official: boolean;
  user_name: string;
  user_avatar?: string;
}

interface FeedbackResponsePanelProps {
  feedbackId: string;
  projectId: string;
  feedbackContent: string;
  feedbackCategory: string;
  feedbackSeverity: number;
  feedbackUser: {
    name: string;
    avatar?: string;
  };
  feedbackCreatedAt: string;
  responses: FeedbackResponse[];
  isProjectOwner: boolean;
  onResponseAdded?: () => void;
}

const FeedbackResponsePanel: React.FC<FeedbackResponsePanelProps> = ({
  feedbackId,
  projectId,
  feedbackContent,
  feedbackCategory,
  feedbackSeverity,
  feedbackUser,
  feedbackCreatedAt,
  responses,
  isProjectOwner,
  onResponseAdded,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newResponse, setNewResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = async () => {
    if (!user || !newResponse.trim()) return;

    try {
      setIsSubmitting(true);
      await feedbackService.addFeedbackResponse(
        feedbackId,
        newResponse,
        user.id,
        isProjectOwner,
      );

      // Clear the input
      setNewResponse("");

      // Show success toast
      toast({
        title: "Response added",
        description: "Your response has been added successfully.",
      });

      // Trigger callback to refresh responses
      if (onResponseAdded) {
        onResponseAdded();
      }
    } catch (error) {
      console.error("Error adding response:", error);
      toast({
        title: "Error",
        description: "Failed to add response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
          Feedback Discussion
        </CardTitle>
        <CardDescription>Discuss and respond to this feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original feedback */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    feedbackUser.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${feedbackUser.name}`
                  }
                />
                <AvatarFallback>{feedbackUser.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {feedbackUser.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(feedbackCreatedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{feedbackCategory}</Badge>
              <Badge variant="outline">Severity: {feedbackSeverity}/5</Badge>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {feedbackContent}
          </p>
        </div>

        <Separator />

        {/* Responses */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            Responses
          </h3>

          {responses && responses.length > 0 ? (
            <div className="space-y-3">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className={`p-3 rounded-md ${response.is_official ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : "bg-slate-50 dark:bg-slate-900"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            response.user_avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.user_name}`
                          }
                        />
                        <AvatarFallback>
                          {response.user_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {response.user_name}
                        {response.is_official && (
                          <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                            Project Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(response.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {response.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No responses yet</p>
            </div>
          )}
        </div>

        {/* Add response */}
        {user && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    user.user_metadata?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                  }
                />
                <AvatarFallback>
                  {user.user_metadata?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {user.user_metadata?.full_name || user.email}
                {isProjectOwner && (
                  <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                    Project Owner
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Add your response..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitResponse}
                disabled={!newResponse.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Sending...</span>
                    <Send className="h-4 w-4 animate-pulse" />
                  </>
                ) : (
                  <>
                    <span className="mr-2">Send Response</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackResponsePanel;
