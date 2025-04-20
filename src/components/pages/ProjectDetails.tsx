import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { projectService, Project } from "@/services/project";
import ProjectEditDialog from "@/components/projects/ProjectEditDialog";
import ProjectPromoteDialog from "@/components/projects/ProjectPromoteDialog";
import ProjectCollaborationPanel from "@/components/projects/ProjectCollaborationPanel";
import ProjectAnalyticsPanel from "@/components/projects/ProjectAnalyticsPanel";
import { ProjectCard } from "@/components/ui/project-card";
import {
  ArrowLeft,
  Calendar,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Share2,
  Star,
  Users,
} from "lucide-react";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  // Get the tab from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get("tab");

  // Import supabase
  const { supabase } = useAuth();

  useEffect(() => {
    if (projectId && user) {
      fetchProjectDetails();
      fetchUserPoints();

      // Set active tab based on URL query parameter
      if (tabFromUrl) {
        if (
          tabFromUrl === "analytics" ||
          tabFromUrl === "collaboration" ||
          tabFromUrl === "overview"
        ) {
          setActiveTab(tabFromUrl);
        }
      }
    }
  }, [projectId, user, tabFromUrl]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const projects = await projectService.fetchProjects({
        userId: user?.id,
      });

      const foundProject = projects.find((p) => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        });
        navigate("/dashboard/projects");
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserPoints(data.points || 0);
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };

  const handleToggleVisibility = async () => {
    if (!project || !user) return;

    try {
      const updatedProject = await projectService.toggleVisibility(
        project.id,
        user.id,
      );
      setProject({ ...project, visibility: updatedProject.visibility });

      toast({
        title: "Success",
        description: `Project is now ${updatedProject.visibility}`,
      });
    } catch (error) {
      console.error("Error updating project visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update project visibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async () => {
    if (!project || !user) return;

    try {
      const updatedProject = await projectService.toggleFeatured(
        project.id,
        user.id,
      );
      setProject({ ...project, featured: updatedProject.featured });

      toast({
        title: "Success",
        description: project.featured
          ? "Project is no longer featured"
          : "Project is now featured",
      });
    } catch (error) {
      console.error("Error updating project featured status:", error);
      toast({
        title: "Error",
        description:
          "Failed to update project featured status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSave = () => {
    setShowEditDialog(false);
    fetchProjectDetails();
    toast({
      title: "Success",
      description: "Project updated successfully",
    });
  };

  const handlePromote = () => {
    setShowPromoteDialog(false);
    fetchProjectDetails();
    fetchUserPoints();
    toast({
      title: "Success",
      description: "Project promotion started successfully",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
        <p className="text-slate-500 mb-4">
          The project you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <Button onClick={() => navigate("/dashboard/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/projects")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.featured && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 ml-2">
              Featured
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            className="flex items-center"
          >
            {project.visibility === "public" ? (
              <>
                <Globe className="h-4 w-4 mr-2" /> Public
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" /> Private
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button
            onClick={() => setShowPromoteDialog(true)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
            size="sm"
          >
            <Star className="h-4 w-4 mr-2" /> Promote
          </Button>
        </div>
      </div>

      {/* Project Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <ProjectCard
            id={project.id}
            title={project.title}
            description={project.description || "No description provided."}
            category={project.category || "Other"}
            tags={project.tags || []}
            creator={{
              name: user?.email?.split("@")[0] || "User",
              avatar: user?.id || "user",
              level: 1,
            }}
            feedbackCount={project.feedback_count || 0}
            pointsReward={25}
            type={
              project.category === "mobile"
                ? "mobile"
                : project.category === "design"
                  ? "design"
                  : "website"
            }
            onClick={() => {}}
          />
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Key metrics and information about your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectAnalyticsPanel
                projectId={project.id}
                isExpanded={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Created on {formatDate(project.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Description
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {project.description || "No description provided."}
                </p>
              </div>

              {project.url && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Project URL
                  </h3>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center"
                  >
                    {project.url}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}

              {project.category && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Category
                  </h3>
                  <p className="capitalize">{project.category}</p>
                </div>
              )}

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Status
                </h3>
                <p className="capitalize">{project.status}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Visibility
                </h3>
                <p className="capitalize">{project.visibility}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Featured
                </h3>
                <p>{project.featured ? "Yes" : "No"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Feedback
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 text-slate-400 mr-2" />
                    <span className="font-medium">
                      {project.feedback_count || 0} total
                    </span>
                  </div>
                  {project.feedback_count > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1" />
                        <span>{project.positive_feedback || 0} positive</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-rose-500 mr-1" />
                        <span>{project.negative_feedback || 0} negative</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProjectAnalyticsPanel projectId={project.id} isExpanded={true} />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <ProjectCollaborationPanel
            projectId={project.id}
            projectTitle={project.title}
          />
        </TabsContent>
      </Tabs>

      {showEditDialog && (
        <ProjectEditDialog
          project={project}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleEditSave}
        />
      )}

      {showPromoteDialog && (
        <ProjectPromoteDialog
          project={project}
          open={showPromoteDialog}
          onOpenChange={setShowPromoteDialog}
          onPromote={handlePromote}
          userPoints={userPoints}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
