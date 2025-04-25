import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/supabase/auth";
import { feedbackService } from "@/services/feedback";
import FeedbackItem from "./FeedbackItem";
import { MessageSquare, Filter, RefreshCw } from "lucide-react";

interface FeedbackResponseSystemProps {
  projectId?: string;
  className?: string;
}

const FeedbackResponseSystem: React.FC<FeedbackResponseSystemProps> = ({
  projectId,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (projectId) {
      loadFeedback();
    }
  }, [projectId]);

  const loadFeedback = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const feedbackData = await feedbackService.getProjectFeedback(projectId);
      setFeedback(feedbackData);
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFeedback();
  };

  const toggleExpandFeedback = (feedbackId: string) => {
    setExpandedFeedbackId(
      expandedFeedbackId === feedbackId ? null : feedbackId,
    );
  };

  // Filter feedback based on active tab
  const filteredFeedback = feedback.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "unresponded") {
      // Check if the feedback has no responses
      return !item.response_count || item.response_count === 0;
    }
    if (activeTab === "responded") {
      // Check if the feedback has responses
      return item.response_count && item.response_count > 0;
    }
    return true;
  });

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Feedback Responses</h2>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Feedback</TabsTrigger>
          <TabsTrigger value="unresponded">Needs Response</TabsTrigger>
          <TabsTrigger value="responded">Responded</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFeedback.length > 0 ? (
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <FeedbackItem
                  key={item.id}
                  feedback={item}
                  isExpanded={expandedFeedbackId === item.id}
                  onToggleExpand={() => toggleExpandFeedback(item.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-medium text-slate-700 mb-2">
                  No feedback found
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  {activeTab === "all"
                    ? "There is no feedback for this project yet."
                    : activeTab === "unresponded"
                      ? "All feedback has been responded to. Great job!"
                      : "No responded feedback found."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackResponseSystem;
