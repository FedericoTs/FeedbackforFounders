import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Grid,
  LayoutDashboard,
  ListFilter,
  Map,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { feedbackService } from "@/services/feedback";
import FeedbackHeatmap from "@/components/feedback/FeedbackHeatmap";
import FeedbackPriorityMatrix from "@/components/feedback/FeedbackPriorityMatrix";
import ElementFeedbackSummary from "@/components/feedback/ElementFeedbackSummary";
import FeedbackDetailView from "@/components/feedback/FeedbackDetailView";

interface Project {
  id: string;
  title: string;
  url: string;
  user_id: string;
}

const FeedbackVisualization: React.FC = () => {
  // Helper functions for status display
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "planned":
        return <Calendar className="h-4 w-4 mr-1" />;
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
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("heatmap");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );
  const [feedbackList, setFeedbackList] = useState<any[]>([]);

  const [heatmapData, setHeatmapData] = useState<{
    points: {
      id: string;
      element_selector: string;
      element_type: string;
      x: number;
      y: number;
      category: string;
      severity: number;
      count: number;
    }[];
  }>({ points: [] });

  const [selectedElement, setSelectedElement] = useState<{
    selector: string;
    type: string;
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
  } | null>(null);

  // Load project data and feedback visualization data
  useEffect(() => {
    if (!projectId || authLoading || !user) return;

    const loadData = async () => {
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

        // Fetch heatmap data
        const heatmapData =
          await feedbackService.getFeedbackHeatmapData(projectId);
        setHeatmapData(heatmapData);

        // Fetch feedback list
        const feedbackData =
          await feedbackService.getProjectFeedback(projectId);
        setFeedbackList(feedbackData);
      } catch (error) {
        console.error("Error loading visualization data:", error);
        setError("Failed to load visualization data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, user, authLoading]);

  // Handle element selection
  const handleElementSelect = async (elementId: string) => {
    try {
      // Find the element in the heatmap data
      const element = heatmapData.points.find(
        (point) => point.id === elementId,
      );
      if (!element) return;

      // Fetch element feedback summary
      const summary = await feedbackService.getElementFeedbackSummary(
        element.element_selector,
        projectId || "",
      );

      if (summary) {
        setSelectedElement({
          selector: summary.element_selector,
          type: summary.element_type,
          feedbackCount: summary.feedback_count,
          averageSentiment: summary.average_sentiment,
          averageSeverity: summary.average_severity,
          pros: summary.pros,
          cons: summary.cons,
          actionRecommendations: summary.action_recommendations.map((rec) => ({
            text: rec.text,
            priority: rec.priority,
            estimatedImpact: rec.estimated_impact,
          })),
          implementationStatus: "pending", // Default value, would be fetched from the database in a real implementation
        });

        // Clear any selected feedback
        setSelectedFeedbackId(null);
      }
    } catch (error) {
      console.error("Error selecting element:", error);
      toast({
        title: "Error",
        description: "Failed to load element feedback summary",
        variant: "destructive",
      });
    }
  };

  // Handle feedback selection
  const handleFeedbackSelect = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setSelectedElement(null);
  };

  // Handle feedback status change
  const handleFeedbackStatusChange = async () => {
    try {
      // Refresh feedback list
      const feedbackData = await feedbackService.getProjectFeedback(
        projectId || "",
      );
      setFeedbackList(feedbackData);
    } catch (error) {
      console.error("Error refreshing feedback list:", error);
    }
  };

  // Convert heatmap data to priority matrix format
  const getPriorityMatrixData = () => {
    return heatmapData.points.map((point) => ({
      id: point.id,
      selector: point.element_selector,
      type: point.element_type,
      severity: point.severity,
      frequency: point.count,
      category: point.category,
    }));
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
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {project?.title} - Feedback Visualization
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visual representation of feedback for your project
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
          </Button>
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => {
              if (feedbackList.length > 0) {
                import("@/utils/exportData").then(
                  ({ downloadCSV, formatFeedbackForExport }) => {
                    const formattedData = formatFeedbackForExport(feedbackList);
                    downloadCSV(
                      formattedData,
                      `feedback-export-${projectId}-${new Date().toISOString().split("T")[0]}.csv`,
                    );
                  },
                );
              }
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Feedback
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {heatmapData.points.reduce(
                    (sum, point) => sum + point.count,
                    0,
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Elements with Feedback
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {heatmapData.points.length}
                </h3>
              </div>
              <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                <Grid className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Average Severity
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {heatmapData.points.length > 0
                    ? (
                        heatmapData.points.reduce(
                          (sum, point) => sum + point.severity,
                          0,
                        ) / heatmapData.points.length
                      ).toFixed(1)
                    : "0"}
                  /5
                </h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="heatmap" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Heatmap View
              </TabsTrigger>
              <TabsTrigger value="priority" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Priority Matrix
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                Feedback List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="heatmap">
              <FeedbackHeatmap
                projectId={projectId || ""}
                websiteUrl={project?.url || ""}
                feedbackPoints={heatmapData.points.map((point) => ({
                  id: point.id,
                  x: point.x,
                  y: point.y,
                  category: point.category,
                  severity: point.severity,
                  count: point.count,
                }))}
                isLoading={isLoading}
                onPointClick={handleElementSelect}
              />
            </TabsContent>

            <TabsContent value="priority">
              <FeedbackPriorityMatrix
                elements={getPriorityMatrixData()}
                isLoading={isLoading}
                onElementClick={handleElementSelect}
              />
            </TabsContent>

            <TabsContent value="list">
              <Card className="bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Feedback List
                  </CardTitle>
                  <CardDescription>
                    All feedback for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
                    </div>
                  ) : feedbackList.length > 0 ? (
                    <div className="space-y-4">
                      {feedbackList.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-md cursor-pointer transition-colors ${selectedFeedbackId === item.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                          onClick={() => handleFeedbackSelect(item.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <img
                                  src={
                                    item.user?.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`
                                  }
                                  alt="User avatar"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {item.user?.full_name || "Anonymous"}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(item.created_at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={getStatusColor(
                                item.implementation_status,
                              )}
                            >
                              <div className="flex items-center">
                                {getStatusIcon(item.implementation_status)}
                                <span className="capitalize">
                                  {item.implementation_status}
                                </span>
                              </div>
                            </Badge>
                          </div>
                          <div className="mb-2">
                            <Badge className="mr-2">{item.category}</Badge>
                            <Badge variant="outline">
                              Severity: {item.severity}/5
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Element:{" "}
                            {item.element_selector.split(".")[0] || "element"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No feedback available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {selectedFeedbackId ? (
            <FeedbackDetailView
              feedbackId={selectedFeedbackId}
              projectId={projectId || ""}
              isProjectOwner={project?.user_id === user?.id}
              onClose={() => setSelectedFeedbackId(null)}
              onStatusChange={handleFeedbackStatusChange}
            />
          ) : selectedElement ? (
            <ElementFeedbackSummary
              elementSelector={selectedElement.selector}
              elementType={selectedElement.type}
              feedbackCount={selectedElement.feedbackCount}
              averageSentiment={selectedElement.averageSentiment}
              averageSeverity={selectedElement.averageSeverity}
              pros={selectedElement.pros}
              cons={selectedElement.cons}
              actionRecommendations={selectedElement.actionRecommendations}
              implementationStatus={selectedElement.implementationStatus}
              onClose={() => setSelectedElement(null)}
            />
          ) : (
            <Card className="bg-white dark:bg-slate-800 shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Feedback Details
                </CardTitle>
                <CardDescription>
                  Select an element or feedback item to view details
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                <Grid className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Click on any element in the visualization or select a feedback
                  item from the list
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  You'll see detailed feedback information, responses, and
                  analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackVisualization;
