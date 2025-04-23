import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  Pencil,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { projectService } from "@/services/project";
import { useAuth } from "../../../supabase/auth";
import ProjectAnalyticsPanel from "@/components/projects/ProjectAnalyticsPanel";
import ProjectGoalsPanel from "@/components/projects/ProjectGoalsPanel";
import ProjectQuestionnairesPanel from "@/components/projects/ProjectQuestionnairesPanel";
import ProjectCollaborationPanel from "@/components/projects/ProjectCollaborationPanel";
import ProjectEditDialog from "@/components/projects/ProjectEditDialog";
import ProjectPromoteDialog from "@/components/projects/ProjectPromoteDialog";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchUserPoints();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const projectData = await projectService.getProjectById(projectId);
      setProject(projectData);
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;
    try {
      const userData = await projectService.getUserPoints(user.id);
      setUserPoints(userData?.points || 0);
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };

  const handleEditSave = async (updatedProject) => {
    try {
      await projectService.updateProject(updatedProject);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      fetchProjectDetails();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handlePromote = async (promotionType) => {
    try {
      await projectService.promoteProject(projectId, promotionType);
      toast({
        title: "Success",
        description: `Project promoted with ${promotionType} promotion`,
      });
      fetchProjectDetails();
      fetchUserPoints();
    } catch (error) {
      console.error("Error promoting project:", error);
      toast({
        title: "Error",
        description: "Failed to promote project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-slate-600 mb-6">
          The project you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <Button onClick={() => navigate("/dashboard/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {project.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={`${project.category?.includes("Mobile") ? "bg-cyan-100 text-cyan-700" : "bg-teal-100 text-teal-700"}`}
            >
              {project.category || "Project"}
            </Badge>
            <Badge
              variant="outline"
              className="capitalize bg-slate-50 dark:bg-slate-800"
            >
              {project.status || "Active"}
            </Badge>
            {project.featured && (
              <Badge className="bg-amber-100 text-amber-700">
                <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-1"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPromoteDialog(true)}
            className="flex items-center gap-1"
          >
            <Share2 className="h-4 w-4" /> Promote
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>
                View and manage your project details
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

        <TabsContent value="goals" className="space-y-4">
          <ProjectGoalsPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="questionnaires" className="space-y-4">
          <ProjectQuestionnairesPanel projectId={project.id} />
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
