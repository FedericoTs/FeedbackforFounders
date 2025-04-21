import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { useAwardToast } from "@/hooks/useAwardToast";
import { useRealtimeFeedback } from "@/hooks/useRealtimeSubscription";
import FeedbackToolbar from "@/components/feedback/FeedbackToolbar";
import WebsiteFrame from "@/components/feedback/WebsiteFrame";
import ElementSelector from "@/components/feedback/ElementSelector";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackList from "@/components/feedback/FeedbackList";
import { feedbackService } from "@/services/feedback";
import { supabase } from "../../../supabase/supabase";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

interface FeedbackItem {
  id: string;
  elementSelector: string;
  elementType: string;
  content: string;
  category: string;
  subcategory: string;
  severity: number;
  sentiment?: number;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

const FeedbackPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { showAwardToast } = useAwardToast();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(0);

  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [isFeedbackListOpen, setIsFeedbackListOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);

  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    xpath: string;
    elementType: string;
    dimensions: { width: number; height: number; top: number; left: number };
  } | null>(null);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );
  const [feedbackStats, setFeedbackStats] = useState<{
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    byCategory: Record<string, number>;
    bySeverity: Record<number, number>;
  } | null>(null);

  // Set up realtime subscription for feedback changes
  const { isConnected: isRealtimeConnected } = useRealtimeFeedback(
    projectId || "",
    (payload) => {
      console.log("Realtime feedback change:", payload);

      // Handle new feedback
      if (payload.eventType === "INSERT") {
        const newFeedback = payload.new;

        // Only add if it's not from the current user to avoid duplicates
        // (since we already add it to the list when submitting)
        if (newFeedback.user_id !== user?.id) {
          // Fetch the user details for the new feedback
          supabase
            .from("users")
            .select("id, full_name, avatar_url")
            .eq("id", newFeedback.user_id)
            .single()
            .then(({ data: userData }) => {
              const feedbackWithUser = {
                ...newFeedback,
                user: userData,
              };

              setFeedbackItems((prev) => [feedbackWithUser, ...prev]);

              // Show toast notification
              toast({
                title: "New Feedback",
                description: `New feedback received from ${userData?.full_name || "Anonymous"}`,
              });
            });
        }
      }

      // Handle updated feedback
      else if (payload.eventType === "UPDATE") {
        const updatedFeedback = payload.new;

        setFeedbackItems((prev) =>
          prev.map((item) =>
            item.id === updatedFeedback.id
              ? {
                  ...item,
                  elementSelector: updatedFeedback.element_selector,
                  elementType:
                    updatedFeedback.element_xpath.split("/").pop() || "element",
                  content: updatedFeedback.content,
                  category: updatedFeedback.category,
                  subcategory: updatedFeedback.subcategory || "",
                  severity: updatedFeedback.severity,
                  sentiment: updatedFeedback.sentiment,
                }
              : item,
          ),
        );
      }
    },
  ); // Removed the dependency array with projectId

  // Load project data
  useEffect(() => {
    if (!projectId || authLoading || !user) return;

    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          setError("Project not found");
          return;
        }

        setProject(projectData as Project);

        // Fetch user points
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("points")
          .eq("id", user.id)
          .single();

        if (userData) {
          setUserPoints(userData.points || 0);
        }

        // Fetch existing feedback
        const feedbackData =
          await feedbackService.getProjectFeedback(projectId);

        // Transform the feedback data to match the FeedbackItem interface
        const transformedFeedback = feedbackData.map((item) => ({
          id: item.id,
          elementSelector: item.element_selector,
          elementType: item.element_xpath.split("/").pop() || "element",
          content: item.content,
          category: item.category,
          subcategory: item.subcategory || "",
          severity: item.severity,
          sentiment: item.sentiment,
          createdAt: item.created_at,
          user: {
            name: item.user?.full_name || "Anonymous",
            avatar: item.user?.avatar_url,
          },
        }));

        setFeedbackItems(transformedFeedback);

        // Fetch feedback statistics
        try {
          const stats =
            await feedbackService.getProjectFeedbackStats(projectId);
          setFeedbackStats({
            total: stats.total,
            positive: stats.positive,
            negative: stats.negative,
            neutral: stats.neutral,
            byCategory: stats.by_category,
            bySeverity: stats.by_severity,
          });
        } catch (statsError) {
          console.error("Error fetching feedback stats:", statsError);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        setError("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, user, authLoading]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Handle iframe error
  const handleIframeError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // Handle element selection
  const handleElementSelected = (element: {
    selector: string;
    xpath: string;
    elementType: string;
    dimensions: { width: number; height: number; top: number; left: number };
  }) => {
    setSelectedElement(element);
    setIsSelectionModeActive(false);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: {
    elementSelector: string;
    elementXPath: string;
    content: string;
    category: string;
    subcategory: string;
    severity: number;
    metadata: Record<string, any>;
  }) => {
    if (!user || !project) return;

    try {
      const result = await feedbackService.submitFeedback(
        {
          projectId: project.id,
          elementSelector: feedback.elementSelector,
          elementXPath: feedback.elementXPath,
          content: feedback.content,
          category: feedback.category,
          subcategory: feedback.subcategory,
          severity: feedback.severity,
          metadata: feedback.metadata,
        },
        user.id,
      );

      // Create a new feedback item from the result
      const newFeedbackItem: FeedbackItem = {
        id: result.feedback.id,
        elementSelector: result.feedback.element_selector,
        elementType:
          result.feedback.element_xpath.split("/").pop() || "element",
        content: result.feedback.content,
        category: result.feedback.category,
        subcategory: result.feedback.subcategory || "",
        severity: result.feedback.severity,
        sentiment: result.feedback.sentiment,
        createdAt: result.feedback.created_at,
        user: {
          name: result.feedback.user?.full_name || "Anonymous",
          avatar: result.feedback.user?.avatar_url,
        },
      };

      // Update feedback items list
      setFeedbackItems([newFeedbackItem, ...feedbackItems]);

      // Update user points
      setUserPoints((prev) => prev + result.points);

      // Show success toast
      toast({
        title: "Feedback submitted",
        description: "Your feedback has been submitted successfully.",
      });

      // Show award toast if points were awarded
      if (result.points > 0) {
        showAwardToast({
          points: result.points,
          title: "Feedback Submitted!",
          description: `You earned ${result.points} points for providing feedback`,
        });
      }

      // Clear selected element
      setSelectedElement(null);

      // Refresh feedback stats
      if (projectId) {
        try {
          const stats =
            await feedbackService.getProjectFeedbackStats(projectId);
          setFeedbackStats({
            total: stats.total,
            positive: stats.positive,
            negative: stats.negative,
            neutral: stats.neutral,
            byCategory: stats.by_category,
            bySeverity: stats.by_severity,
          });
        } catch (statsError) {
          console.error("Error fetching feedback stats:", statsError);
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle exit
  const handleExit = () => {
    navigate("/dashboard");
  };

  // Handle feedback selection
  const handleSelectFeedback = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    // Find the feedback item
    const feedbackItem = feedbackItems.find((item) => item.id === feedbackId);
    if (feedbackItem) {
      // Show a toast with the feedback details
      toast({
        title: `Feedback from ${feedbackItem.user.name}`,
        description:
          feedbackItem.content.substring(0, 100) +
          (feedbackItem.content.length > 100 ? "..." : ""),
      });
    }
  };

  // Handle view mode toggle
  const handleToggleViewMode = () => {
    setIsSplitView(!isSplitView);
    // If switching to split view, open the feedback list
    if (!isSplitView && !isFeedbackListOpen) {
      setIsFeedbackListOpen(true);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (error && !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate("/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
      {/* Toolbar */}
      {project && (
        <FeedbackToolbar
          projectName={project.title}
          projectUrl={project.url || ""}
          points={userPoints}
          isSelectionModeActive={isSelectionModeActive}
          isSplitView={isSplitView}
          onToggleSelectionMode={() =>
            setIsSelectionModeActive(!isSelectionModeActive)
          }
          onToggleFeedbackList={() =>
            setIsFeedbackListOpen(!isFeedbackListOpen)
          }
          onToggleViewMode={handleToggleViewMode}
          onExit={handleExit}
        />
      )}

      {/* Main content */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {project?.title} - Feedback
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Provide feedback on this project
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/dashboard/feedback/${projectId}/visualize`)
              }
            >
              <BarChart2 className="h-4 w-4 mr-2" /> Visualize Feedback
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 relative overflow-hidden ${isSplitView ? "flex" : ""}`}
      >
        {/* Website frame */}
        <div className={isSplitView ? "w-1/2 h-full" : "w-full h-full"}>
          {project && (
            <WebsiteFrame
              url={project.url || ""}
              isLoading={isLoading}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}

          {/* Element selector overlay */}
          {isSelectionModeActive && (
            <ElementSelector
              isActive={isSelectionModeActive}
              onElementSelected={handleElementSelected}
              iframeRef={iframeRef}
            />
          )}
        </div>

        {/* Split view feedback list */}
        {isSplitView && (
          <div className="w-1/2 h-full overflow-auto border-l border-slate-200 dark:border-slate-700">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Feedback List</h2>
              <div className="space-y-4">
                {feedbackItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleSelectFeedback(item.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div
                          className="h-8 w-8 rounded-full bg-slate-300 mr-2"
                          style={{
                            backgroundImage: item.user.avatar
                              ? `url(${item.user.avatar})`
                              : undefined,
                            backgroundSize: "cover",
                          }}
                        />
                        <div>
                          <div className="font-medium">{item.user.name}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700">
                        {item.category}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.content}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                      <div>Element: {item.elementType}</div>
                      <div>Severity: {item.severity}/5</div>
                    </div>
                  </div>
                ))}
                {feedbackItems.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>No feedback items yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback form */}
        {selectedElement && (
          <FeedbackForm
            selectedElement={selectedElement}
            onClose={() => setSelectedElement(null)}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        {/* Feedback list (when not in split view) */}
        {isFeedbackListOpen && !isSplitView && (
          <FeedbackList
            feedbackItems={feedbackItems}
            onClose={() => setIsFeedbackListOpen(false)}
            onSelectFeedback={handleSelectFeedback}
          />
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
