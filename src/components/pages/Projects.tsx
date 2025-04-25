import React, { useState, useEffect } from "react";
import { useAuth } from "@/supabase/auth";
import { supabase } from "@/supabase/supabase";
import { projectService } from "@/services/project";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Archive,
  ArrowUpDown,
  BarChart2,
  Check,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Grid,
  Image,
  List,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { GradientButton } from "@/components/ui/design-system";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  category?: string;
  tags?: string[];
  visibility: "public" | "private";
  status: "active" | "archived" | "draft";
  featured: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  thumbnail_url?: string;
  feedback_count?: number;
  positive_feedback?: number;
  negative_feedback?: number;
  neutral_feedback?: number;
}

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    url: "",
    category: "web",
    tags: "",
    visibility: "public",
    thumbnail_url: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingFileUpload, setPendingFileUpload] = useState<{
    file: File;
    fileName: string;
  } | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, sortBy, filter]);

  // Track page view for analytics
  useEffect(() => {
    if (user) {
      // Record page view in project_activity
      const recordPageView = async () => {
        try {
          await supabase.from("project_activity").insert({
            project_id: null, // No specific project
            user_id: user.id,
            activity_type: "page_view",
            description: "Projects page viewed",
          });
        } catch (error) {
          console.error("Error recording page view:", error);
        }
      };

      recordPageView();
    }
  }, [user]);

  // Handle pending file upload after project creation
  useEffect(() => {
    const uploadPendingFile = async () => {
      if (pendingFileUpload && createdProjectId && user) {
        try {
          setIsUploading(true);
          const { file, fileName } = pendingFileUpload;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from("project-thumbnails")
            .upload(fileName, file, {
              upsert: true,
            });

          if (error) throw error;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("project-thumbnails")
            .getPublicUrl(fileName);

          // Update the project with the thumbnail URL
          await projectService.updateProjectThumbnailUrl(
            createdProjectId,
            urlData.publicUrl,
            user.id,
          );

          toast({
            title: "Success",
            description: "Image uploaded and attached to project successfully",
          });

          // Clear the pending upload
          setPendingFileUpload(null);
          setCreatedProjectId(null);
        } catch (error) {
          console.error("Error uploading pending file:", error);
          toast({
            title: "Error",
            description:
              "Failed to upload image. You can add it later from the project details page.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
    };

    uploadPendingFile();
  }, [pendingFileUpload, createdProjectId, user, toast]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const projectData = await projectService.fetchProjects({
        userId: user?.id,
        filter,
        sortBy,
        searchQuery: searchQuery,
      });

      setProjects(projectData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      if (!newProject.title.trim()) {
        toast({
          title: "Error",
          description: "Project title is required",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a project",
          variant: "destructive",
        });
        return;
      }

      const projectData = {
        title: newProject.title,
        description: newProject.description,
        url: newProject.url,
        category: newProject.category,
        tags: newProject.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        visibility: newProject.visibility,
        status: "active",
        featured: false,
        // Don't include thumbnail_url here, we'll update it after upload
      };

      // Create the project first
      const createdProject = await projectService.createProject(
        projectData,
        user.id,
      );

      // Store the project ID for the pending upload
      if (previewImage && pendingFileUpload) {
        setCreatedProjectId(createdProject.id);
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      // Reset form and close dialog
      setNewProject({
        title: "",
        description: "",
        url: "",
        category: "web",
        tags: "",
        visibility: "public",
        thumbnail_url: "",
      });
      setCurrentStep(1);
      setPreviewImage(null);
      setIsCreateDialogOpen(false);
      fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      // Store the file information for later upload
      setPendingFileUpload({
        file,
        fileName,
      });
    } catch (error) {
      console.error("Error preparing file upload:", error);
      toast({
        title: "Error",
        description: "Failed to prepare image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (!user) return;

      await projectService.deleteProject(projectId, user.id);

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      if (!user) return;

      await projectService.duplicateProject(project.id, user.id);

      toast({
        title: "Success",
        description: "Project duplicated successfully",
      });

      fetchProjects();
    } catch (error) {
      console.error("Error duplicating project:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (project: Project) => {
    try {
      if (!user) return;

      const updatedProject = await projectService.toggleVisibility(
        project.id,
        user.id,
      );

      toast({
        title: "Success",
        description: `Project is now ${updatedProject.visibility}`,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating project visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update project visibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (
    project: Project,
    newStatus: "active" | "archived" | "draft",
  ) => {
    try {
      if (!user) return;

      await projectService.updateStatus(project.id, newStatus, user.id);

      toast({
        title: "Success",
        description: `Project status updated to ${newStatus}`,
      });

      fetchProjects();
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (project: Project) => {
    try {
      if (!user) return;

      const updatedProject = await projectService.toggleFeatured(
        project.id,
        user.id,
      );

      toast({
        title: "Success",
        description: project.featured
          ? "Project is no longer featured"
          : "Project is now featured",
      });

      fetchProjects();
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

  // Apply search filter once to avoid multiple filtering operations
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    return (
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.tags &&
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ))
    );
  });

  // Filter for featured projects separately
  const featuredProjects = searchQuery
    ? filteredProjects.filter((project) => project.featured)
    : projects.filter((project) => project.featured);

  const renderProjectGrid = (projectsToRender = filteredProjects) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsToRender.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? "No projects match your search criteria. Try a different search term."
                : "No projects match the current filter. Try a different filter."}
            </p>
          </div>
        ) : (
          projectsToRender.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {project.featured && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                      Featured
                    </Badge>
                  )}
                  <Badge
                    className={`${
                      project.visibility === "public"
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {project.visibility === "public" ? "Public" : "Private"}
                  </Badge>
                  <Badge
                    className={`${
                      project.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                        : project.status === "draft"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold truncate">
                    {project.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleToggleVisibility(project)}
                      >
                        {project.visibility === "public" ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Make Private
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Make Public
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleDuplicateProject(project)}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(project, "active")}
                        disabled={project.status === "active"}
                      >
                        <Check className="h-4 w-4 mr-2" /> Mark as Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(project, "draft")}
                        disabled={project.status === "draft"}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Mark as Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(project, "archived")}
                        disabled={project.status === "archived"}
                      >
                        <Archive className="h-4 w-4 mr-2" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the project and all associated
                              feedback.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProject(project.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />{" "}
                    {project.feedback_count || 0}
                  </span>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-slate-50 dark:bg-slate-800"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-slate-50 dark:bg-slate-800"
                      >
                        +{project.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardContent className="pt-0 pb-2">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <MessageSquare className="h-4 w-4" />
                  <span>{project.feedback_count || 0} feedback</span>
                  {project.feedback_count > 0 && (
                    <div className="flex items-center space-x-1 ml-2">
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        title="Positive feedback"
                      />
                      <span className="text-xs">
                        {project.positive_feedback || 0}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full bg-rose-500 ml-1"
                        title="Negative feedback"
                      />
                      <span className="text-xs">
                        {project.negative_feedback || 0}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900"
                    onClick={() =>
                      navigate(
                        `/dashboard/projects/${project.id}?tab=analytics`,
                      )
                    }
                    title="View Analytics"
                  >
                    <BarChart2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900"
                    onClick={() =>
                      navigate(
                        `/dashboard/projects/${project.id}?tab=collaboration`,
                      )
                    }
                    title="Manage Collaborators"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderProjectList = (projectsToRender = filteredProjects) => {
    return (
      <div className="space-y-4">
        {projectsToRender.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? "No projects match your search criteria. Try a different search term."
                : "No projects match the current filter. Try a different filter."}
            </p>
          </div>
        ) : (
          projectsToRender.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-32 bg-slate-100 dark:bg-slate-800">
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {project.featured && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                          Featured
                        </Badge>
                      )}
                      <Badge
                        className={`${
                          project.visibility === "public"
                            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {project.visibility === "public" ? "Public" : "Private"}
                      </Badge>
                      <Badge
                        className={`${
                          project.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : project.status === "draft"
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"
                        }`}
                      >
                        {project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleToggleVisibility(project)}
                          >
                            {project.visibility === "public" ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" /> Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" /> Make Public
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDuplicateProject(project)}
                          >
                            <Copy className="h-4 w-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(project, "active")
                            }
                            disabled={project.status === "active"}
                          >
                            <Check className="h-4 w-4 mr-2" /> Mark as Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(project, "draft")}
                            disabled={project.status === "draft"}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Mark as Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(project, "archived")
                            }
                            disabled={project.status === "archived"}
                          >
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the project and all
                                  associated feedback.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteProject(project.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-4">
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-slate-50 dark:bg-slate-800"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-slate-50 dark:bg-slate-800"
                            >
                              +{project.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {project.feedback_count || 0}
                        </span>
                      </div>
                      {project.feedback_count > 0 && (
                        <div className="flex items-center space-x-1">
                          <span
                            className="h-2 w-2 rounded-full bg-emerald-500"
                            title="Positive feedback"
                          />
                          <span className="text-xs">
                            {project.positive_feedback || 0}
                          </span>
                          <span
                            className="h-2 w-2 rounded-full bg-rose-500 ml-1"
                            title="Negative feedback"
                          />
                          <span className="text-xs">
                            {project.negative_feedback || 0}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/dashboard/projects/${project.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={() =>
                            navigate(
                              `/dashboard/projects/${project.id}?tab=analytics`,
                            )
                          }
                          title="View Analytics"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={() =>
                            navigate(
                              `/dashboard/projects/${project.id}?tab=collaboration`,
                            )
                          }
                          title="Manage Collaborators"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  };

  const renderCreateProjectDialog = () => {
    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add your project details to start receiving feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <div className="flex space-x-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    1
                  </div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    2
                  </div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    3
                  </div>
                </div>
                <span className="text-sm text-slate-500">
                  Step {currentStep} of 3
                </span>
              </div>
              <Separator />
            </div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                    placeholder="My Awesome Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your project and what kind of feedback you're looking for"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Project URL</Label>
                  <Input
                    id="url"
                    value={newProject.url}
                    onChange={(e) =>
                      setNewProject({ ...newProject, url: e.target.value })
                    }
                    placeholder="https://myproject.com"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep(2)}>Next</Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProject.category}
                    onValueChange={(value) =>
                      setNewProject({ ...newProject, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web App</SelectItem>
                      <SelectItem value="mobile">Mobile App</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newProject.tags}
                    onChange={(e) =>
                      setNewProject({ ...newProject, tags: e.target.value })
                    }
                    placeholder="ui, design, react"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={newProject.visibility}
                    onValueChange={(value) =>
                      setNewProject({
                        ...newProject,
                        visibility: value as "public" | "private",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Public projects can be discovered by all users. Private
                    projects are only visible to those you share the link with.
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>Next</Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Thumbnail</Label>
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-h-[200px] mx-auto rounded-md"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                          onClick={() => {
                            setPreviewImage(null);
                            setPendingFileUpload(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          Drag and drop an image, or{" "}
                          <label className="text-teal-500 hover:text-teal-600 cursor-pointer">
                            browse
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Recommended: 1200×630px, PNG or JPG
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {newProject.title || "Project Title"}
                    </p>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {newProject.description || "No description provided."}
                    </p>
                    {newProject.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newProject.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag)
                          .slice(0, 3)
                          .map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-slate-50 dark:bg-slate-800"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateProject}
                    disabled={!newProject.title.trim() || isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Projects
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your projects and track feedback from your audience.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilter("all")}>
                <Check
                  className={`h-4 w-4 mr-2 ${filter === "all" ? "opacity-100" : "opacity-0"}`}
                />
                All Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("active")}>
                <Check
                  className={`h-4 w-4 mr-2 ${filter === "active" ? "opacity-100" : "opacity-0"}`}
                />
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("draft")}>
                <Check
                  className={`h-4 w-4 mr-2 ${filter === "draft" ? "opacity-100" : "opacity-0"}`}
                />
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("archived")}>
                <Check
                  className={`h-4 w-4 mr-2 ${filter === "archived" ? "opacity-100" : "opacity-0"}`}
                />
                Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden md:flex">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortBy === "updated_at"
                  ? "Last Updated"
                  : sortBy === "created_at"
                    ? "Date Created"
                    : sortBy === "title"
                      ? "Title"
                      : "Feedback Count"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy("updated_at")}>
                <Check
                  className={`h-4 w-4 mr-2 ${sortBy === "updated_at" ? "opacity-100" : "opacity-0"}`}
                />
                Last Updated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("created_at")}>
                <Check
                  className={`h-4 w-4 mr-2 ${sortBy === "created_at" ? "opacity-100" : "opacity-0"}`}
                />
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("title")}>
                <Check
                  className={`h-4 w-4 mr-2 ${sortBy === "title" ? "opacity-100" : "opacity-0"}`}
                />
                Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("feedback_count")}>
                <Check
                  className={`h-4 w-4 mr-2 ${sortBy === "feedback_count" ? "opacity-100" : "opacity-0"}`}
                />
                Feedback Count
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <GradientButton
          onClick={() => {
            setIsCreateDialogOpen(true);
            setCurrentStep(1);
          }}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Project
        </GradientButton>
      </div>

      {/* Move Tabs outside of conditional rendering to prevent reloading */}
      <Tabs
        value={filter === "all" && searchQuery ? "search" : filter}
        onValueChange={setFilter}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          {searchQuery && (
            <TabsTrigger value="search" className="hidden">
              Search Results
            </TabsTrigger>
          )}
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchQuery
                ? "No projects match your search criteria. Try a different search term."
                : "You haven't created any projects yet. Create your first project to start receiving feedback."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(true);
                  setCurrentStep(1);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Create New Project
              </Button>
            )}
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              {viewMode === "grid" ? renderProjectGrid() : renderProjectList()}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {viewMode === "grid" ? renderProjectGrid() : renderProjectList()}
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              {viewMode === "grid" ? renderProjectGrid() : renderProjectList()}
            </TabsContent>

            <TabsContent value="archived" className="space-y-4">
              {viewMode === "grid" ? renderProjectGrid() : renderProjectList()}
            </TabsContent>

            <TabsContent value="featured" className="space-y-4">
              {viewMode === "grid"
                ? renderProjectGrid(featuredProjects)
                : renderProjectList(featuredProjects)}
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              {viewMode === "grid" ? renderProjectGrid() : renderProjectList()}
            </TabsContent>
          </>
        )}
      </Tabs>

      {renderCreateProjectDialog()}
    </div>
  );
};

export default Projects;
