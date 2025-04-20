import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { X, Save, Loader2, Upload, History } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";

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
  thumbnail_url?: string;
  user_id: string;
}

interface ProjectVersion {
  id: string;
  project_id: string;
  title: string;
  description: string;
  version_number: number;
  created_at: string;
  created_by: string;
}

interface ProjectEditDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const ProjectEditDialog = ({
  project,
  open,
  onOpenChange,
  onSave,
}: ProjectEditDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    url: string;
    category: string;
    tags: string;
    visibility: "public" | "private";
    thumbnail_url: string;
  }>({
    title: "",
    description: "",
    url: "",
    category: "web",
    tags: "",
    visibility: "public",
    thumbnail_url: "",
  });

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        url: project.url || "",
        category: project.category || "web",
        tags: project.tags ? project.tags.join(", ") : "",
        visibility: project.visibility || "public",
        thumbnail_url: project.thumbnail_url || "",
      });
      setPreviewImage(project.thumbnail_url || null);

      // Fetch project versions
      if (project.id) {
        fetchProjectVersions(project.id);
      }
    }
  }, [project]);

  const fetchProjectVersions = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setProjectVersions(data || []);
    } catch (error) {
      console.error("Error fetching project versions:", error);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      setIsLoading(true);

      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Error",
          description: "Project title is required",
          variant: "destructive",
        });
        return;
      }

      // Prepare project data for update
      const projectData = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        visibility: formData.visibility,
        thumbnail_url: formData.thumbnail_url,
        updated_at: new Date().toISOString(),
      };

      // Create a version record first
      const versionData = {
        project_id: project.id,
        title: project.title,
        description: project.description,
        version_number:
          projectVersions.length > 0
            ? projectVersions[0].version_number + 1
            : 1,
        created_by: project.user_id,
      };

      const { error: versionError } = await supabase
        .from("project_versions")
        .insert(versionData);

      if (versionError) {
        console.error("Error creating version record:", versionError);
        // Continue with update even if version creation fails
      }

      // Update the project
      const { error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      // Refresh project versions
      fetchProjectVersions(project.id);

      // Notify parent component
      onSave();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("project-thumbnails")
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("project-thumbnails")
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        thumbnail_url: urlData.publicUrl,
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const restoreVersion = async (version: ProjectVersion) => {
    if (!project) return;

    try {
      setIsLoading(true);

      // Create a new version record of the current state before restoring
      const currentVersionData = {
        project_id: project.id,
        title: formData.title,
        description: formData.description,
        version_number:
          projectVersions.length > 0
            ? projectVersions[0].version_number + 1
            : 1,
        created_by: project.user_id,
        notes: "Auto-saved before version restore",
      };

      await supabase.from("project_versions").insert(currentVersionData);

      // Update form data with the selected version
      setFormData((prev) => ({
        ...prev,
        title: version.title,
        description: version.description,
      }));

      // Update the project in the database
      const { error } = await supabase
        .from("projects")
        .update({
          title: version.title,
          description: version.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Restored to version ${version.version_number}`,
      });

      // Refresh project versions
      fetchProjectVersions(project.id);

      // Notify parent component
      onSave();
    } catch (error) {
      console.error("Error restoring version:", error);
      toast({
        title: "Error",
        description: "Failed to restore version. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Make changes to your project. All changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="history">Version History</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="My Awesome Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your project and what kind of feedback you're looking for"
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Project URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://myproject.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
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
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
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
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="ui, design, react"
                />
              </div>
              {formData.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag)
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
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
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
                          setFormData({ ...formData, thumbnail_url: "" });
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
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Version History</h3>
                  <span className="text-xs text-slate-500">
                    {projectVersions.length} versions
                  </span>
                </div>
                <Separator />
                {projectVersions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      No version history yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Changes to your project will be tracked automatically
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {projectVersions.map((version) => (
                      <div
                        key={version.id}
                        className="border rounded-md p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium">
                              Version {version.version_number}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {formatDate(version.created_at)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreVersion(version)}
                          >
                            Restore
                          </Button>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium">{version.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {version.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
