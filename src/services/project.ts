import { supabase } from "../../supabase/supabase";
import { gamificationService } from "./gamification";

export interface Project {
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

export interface ProjectCollaborator {
  id: string;
  user_id: string;
  project_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  title: string;
  description: string;
  version_number: number;
  created_at: string;
  created_by: string;
}

export interface ProjectPromotion {
  id: string;
  project_id: string;
  user_id: string;
  points_allocated: number;
  start_date: string;
  end_date: string;
  audience_type: string;
  estimated_reach: number;
  status: "active" | "completed" | "cancelled";
  created_at: string;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface VisitorStats {
  total: number;
  unique: number;
  returning: number;
  averageDuration: number;
}

export interface PromotionStats {
  active: boolean;
  pointsAllocated: number;
  startDate: string;
  endDate: string;
  estimatedReach: number;
  actualReach: number;
  daysRemaining: number;
}

export interface ProjectAnalytics {
  feedback: FeedbackStats;
  visitors: VisitorStats;
  promotion: PromotionStats | null;
  activity: any[];
  timeframe: string;
}

export const projectService = {
  /**
   * Fetch projects with optional filtering and sorting
   */
  async fetchProjects(options: {
    userId?: string;
    filter?: string;
    sortBy?: string;
    searchQuery?: string;
    featured?: boolean;
  }): Promise<Project[]> {
    try {
      const {
        userId,
        filter = "all",
        sortBy = "updated_at",
        featured,
      } = options;

      let query = supabase
        .from("projects")
        .select(
          "*, project_feedback(count), project_feedback_sentiment(positive, negative, neutral)",
        );

      // Filter by user if provided
      if (userId) {
        query = query.eq("user_id", userId);
      }

      // Apply status filter
      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      // Filter by featured if specified
      if (featured !== undefined) {
        query = query.eq("featured", featured);
      }

      // Apply sorting
      if (sortBy === "title") {
        query = query.order("title", { ascending: true });
      } else if (sortBy === "created_at") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "updated_at") {
        query = query.order("updated_at", { ascending: false });
      } else if (sortBy === "feedback_count") {
        query = query.order("feedback_count", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data to include feedback counts
      const processedData = data.map((project) => ({
        ...project,
        feedback_count: project.project_feedback?.[0]?.count || 0,
        positive_feedback:
          project.project_feedback_sentiment?.[0]?.positive || 0,
        negative_feedback:
          project.project_feedback_sentiment?.[0]?.negative || 0,
        neutral_feedback: project.project_feedback_sentiment?.[0]?.neutral || 0,
      }));

      // Apply search filter if provided
      const { searchQuery } = options;
      if (searchQuery) {
        return processedData.filter((project) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            project.title.toLowerCase().includes(searchLower) ||
            project.description.toLowerCase().includes(searchLower) ||
            (project.tags &&
              project.tags.some((tag) =>
                tag.toLowerCase().includes(searchLower),
              ))
          );
        });
      }

      return processedData;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  /**
   * Create a new project
   */
  async createProject(
    projectData: Partial<Project>,
    userId: string,
  ): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          ...projectData,
          user_id: userId,
          status: projectData.status || "active",
          featured: projectData.featured || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize feedback counters
      await supabase.from("project_feedback").insert({
        project_id: data.id,
        count: 0,
      });

      await supabase.from("project_feedback_sentiment").insert({
        project_id: data.id,
        positive: 0,
        negative: 0,
        neutral: 0,
      });

      // Add owner as first collaborator
      await supabase.from("project_collaborators").insert({
        project_id: data.id,
        user_id: userId,
        role: "owner",
      });

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: data.id,
        user_id: userId,
        activity_type: "project_created",
        description: "Project created",
      });

      // Award points for creating a project
      try {
        await gamificationService.awardPoints({
          userId,
          points: gamificationService.getPointValues().project_created,
          activityType: "project_created",
          description: `Created project: ${data.title}`,
          metadata: { projectId: data.id },
        });
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError);
        // Continue even if points award fails
      }

      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  /**
   * Update an existing project
   */
  async updateProject(
    projectId: string,
    updates: Partial<Project>,
    userId: string,
  ): Promise<Project> {
    try {
      // Check if user has permission to update
      const { data: collaborator, error: collabError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      if (
        collabError ||
        !collaborator ||
        (collaborator.role !== "owner" && collaborator.role !== "editor")
      ) {
        throw new Error("You don't have permission to update this project");
      }

      // Get current project data for version history
      const { data: currentProject, error: projectError } = await supabase
        .from("projects")
        .select("title, description")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Create a version record
      const { data: versions, error: versionsError } = await supabase
        .from("project_versions")
        .select("version_number")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersionNumber =
        versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      await supabase.from("project_versions").insert({
        project_id: projectId,
        title: currentProject.title,
        description: currentProject.description,
        version_number: nextVersionNumber,
        created_by: userId,
      });

      // Update the project
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "project_updated",
        description: "Project updated",
        metadata: { version: nextVersionNumber },
      });

      return data;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      // First check if the project exists and if the user is the owner
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("user_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("Error fetching project:", projectError);
        throw new Error("Project not found");
      }

      // Check if user is the direct owner of the project
      if (project.user_id === userId) {
        // User is the direct owner, proceed with deletion
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId);

        if (error) throw error;
        return;
      }

      // If not direct owner, check collaborator status
      const { data: collaborator, error: collabError } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .single();

      if (collabError || !collaborator || collaborator.role !== "owner") {
        throw new Error("Only project owners can delete projects");
      }

      // Delete the project (cascade will handle related records)
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  /**
   * Duplicate a project
   */
  async duplicateProject(projectId: string, userId: string): Promise<Project> {
    try {
      // Get the project to duplicate
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Create a new project with the same data
      const { id, created_at, updated_at, feedback_count, ...projectData } =
        project;

      const duplicatedProject = {
        ...projectData,
        title: `${project.title} (Copy)`,
        featured: false,
        user_id: userId,
      };

      return await this.createProject(duplicatedProject, userId);
    } catch (error) {
      console.error("Error duplicating project:", error);
      throw error;
    }
  },

  /**
   * Toggle project visibility
   */
  async toggleVisibility(projectId: string, userId: string): Promise<Project> {
    try {
      // Get current visibility
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("visibility")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Toggle visibility
      const newVisibility =
        project.visibility === "public" ? "private" : "public";

      return await this.updateProject(
        projectId,
        { visibility: newVisibility },
        userId,
      );
    } catch (error) {
      console.error("Error toggling project visibility:", error);
      throw error;
    }
  },

  /**
   * Update project status
   */
  async updateStatus(
    projectId: string,
    status: "active" | "archived" | "draft",
    userId: string,
  ): Promise<Project> {
    try {
      return await this.updateProject(projectId, { status }, userId);
    } catch (error) {
      console.error("Error updating project status:", error);
      throw error;
    }
  },

  /**
   * Toggle featured status
   */
  async toggleFeatured(projectId: string, userId: string): Promise<Project> {
    try {
      // Get current featured status
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("featured")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      return await this.updateProject(
        projectId,
        { featured: !project.featured },
        userId,
      );
    } catch (error) {
      console.error("Error toggling featured status:", error);
      throw error;
    }
  },

  /**
   * Update project thumbnail URL
   */
  async updateProjectThumbnailUrl(
    projectId: string,
    thumbnailUrl: string,
    userId: string,
  ): Promise<Project> {
    try {
      // Direct update without permission check for thumbnails
      // This is safe because we're only updating the thumbnail_url field
      // and we're doing it right after project creation when the user is the owner
      const { data, error } = await supabase
        .from("projects")
        .update({
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "project_updated",
        description: "Project thumbnail updated",
      });

      return data;
    } catch (error) {
      console.error("Error updating project thumbnail URL:", error);
      throw error;
    }
  },

  /**
   * Get project versions
   */
  async getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
    try {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching project versions:", error);
      throw error;
    }
  },

  /**
   * Restore project to a specific version
   */
  async restoreVersion(
    projectId: string,
    versionId: string,
    userId: string,
  ): Promise<Project> {
    try {
      // Get the version data
      const { data: version, error: versionError } = await supabase
        .from("project_versions")
        .select("title, description")
        .eq("id", versionId)
        .eq("project_id", projectId)
        .single();

      if (versionError) throw versionError;

      // Update the project with the version data
      return await this.updateProject(
        projectId,
        {
          title: version.title,
          description: version.description,
        },
        userId,
      );
    } catch (error) {
      console.error("Error restoring project version:", error);
      throw error;
    }
  },

  /**
   * Promote a project
   */
  async promoteProject(params: {
    projectId: string;
    userId: string;
    pointsAllocated: number;
    startDate: Date;
    endDate: Date;
    audienceType: string;
    estimatedReach: number;
  }): Promise<ProjectPromotion> {
    try {
      const {
        projectId,
        userId,
        pointsAllocated,
        startDate,
        endDate,
        audienceType,
        estimatedReach,
      } = params;

      // Create promotion record
      const { data, error } = await supabase
        .from("project_promotions")
        .insert({
          project_id: projectId,
          user_id: userId,
          points_allocated: pointsAllocated,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          audience_type: audienceType,
          estimated_reach: estimatedReach,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct points from user
      await gamificationService.awardPoints({
        userId,
        points: -pointsAllocated, // Negative points for deduction
        activityType: "project_created", // Using this type as a workaround
        description: `Spent ${pointsAllocated} points to promote project`,
        metadata: { projectId, promotionType: audienceType },
      });

      // Update project to featured if not already
      const { data: project } = await supabase
        .from("projects")
        .select("featured")
        .eq("id", projectId)
        .single();

      if (!project.featured) {
        await this.updateProject(projectId, { featured: true }, userId);
      }

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "promotion_started",
        description: `Project promotion started with ${pointsAllocated} points`,
        metadata: { promotion_id: data.id, points: pointsAllocated },
      });

      return data;
    } catch (error) {
      console.error("Error promoting project:", error);
      throw error;
    }
  },

  /**
   * Get project analytics
   */
  async getProjectAnalytics(
    projectId: string,
    timeframe: string = "month",
  ): Promise<ProjectAnalytics> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-project-analytics",
        {
          body: { projectId, timeframe },
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching project analytics:", error);
      throw error;
    }
  },

  /**
   * Get project collaborators
   */
  async getCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    try {
      const { data, error } = await supabase
        .from("project_collaborators")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("project_id", projectId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      throw error;
    }
  },

  /**
   * Add a collaborator to a project
   */
  async addCollaborator(params: {
    projectId: string;
    userId: string;
    email: string;
    role: "editor" | "viewer";
  }): Promise<ProjectCollaborator> {
    try {
      const { projectId, userId, email, role } = params;

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "invite",
            projectId,
            userId,
            email,
            role,
          },
        },
      );

      if (error) throw error;
      return data.collaborator;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      throw error;
    }
  },

  /**
   * Remove a collaborator from a project
   */
  async removeCollaborator(
    projectId: string,
    collaboratorId: string,
    userId: string,
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "remove",
            projectId,
            userId,
            targetUserId: collaboratorId,
          },
        },
      );

      if (error) throw error;
    } catch (error) {
      console.error("Error removing collaborator:", error);
      throw error;
    }
  },

  /**
   * Update a collaborator's role
   */
  async updateCollaboratorRole(
    projectId: string,
    collaboratorId: string,
    role: "owner" | "editor" | "viewer",
    userId: string,
  ): Promise<ProjectCollaborator> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "update_role",
            projectId,
            userId,
            targetUserId: collaboratorId,
            role,
          },
        },
      );

      if (error) throw error;
      return data.collaborator;
    } catch (error) {
      console.error("Error updating collaborator role:", error);
      throw error;
    }
  },

  /**
   * Get project comments
   */
  async getComments(projectId: string): Promise<ProjectComment[]> {
    try {
      const { data, error } = await supabase
        .from("project_comments")
        .select("*, user:user_id(id, full_name, email, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  /**
   * Add a comment to a project
   */
  async addComment(
    projectId: string,
    content: string,
    userId: string,
  ): Promise<ProjectComment> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "add_comment",
            projectId,
            userId,
            content,
          },
        },
      );

      if (error) throw error;
      return data.comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  /**
   * Edit a comment
   */
  async editComment(
    projectId: string,
    commentId: string,
    content: string,
    userId: string,
  ): Promise<ProjectComment> {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "edit_comment",
            projectId,
            userId,
            commentId,
            content,
          },
        },
      );

      if (error) throw error;
      return data.comment;
    } catch (error) {
      console.error("Error editing comment:", error);
      throw error;
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(
    projectId: string,
    commentId: string,
    userId: string,
  ): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke(
        "supabase-functions-project-collaboration",
        {
          body: {
            action: "delete_comment",
            projectId,
            userId,
            commentId,
          },
        },
      );

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  /**
   * Generate a share link for a project
   */
  generateShareLink(projectId: string): string {
    const baseUrl = window.location.origin;
    const shareToken = btoa(`project:${projectId}`);
    return `${baseUrl}/shared/project/${shareToken}`;
  },
};
