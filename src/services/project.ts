import { supabase } from "../../supabase/supabase";
import { gamificationService } from "./gamification";
import { activityService } from "./activity";

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

export interface ProjectGoal {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  goal_type: "feedback_count" | "positive_feedback" | "engagement" | "custom";
  status: "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface QuestionBase {
  id: string;
  text: string;
  required: boolean;
  order: number;
}

export interface TextQuestion extends QuestionBase {
  type: "text";
  placeholder?: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: string[];
  allow_multiple: boolean;
}

export interface RatingQuestion extends QuestionBase {
  type: "rating";
  max_rating: number;
}

export type Question = TextQuestion | MultipleChoiceQuestion | RatingQuestion;

export interface ProjectQuestionnaire {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  questions: Question[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  user_id: string;
  responses: Record<string, any>;
  created_at: string;
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
   * Project Goals
   */
  async getProjectGoals(projectId: string): Promise<ProjectGoal[]> {
    try {
      const { data, error } = await supabase
        .from("project_goals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching project goals:", error);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching project goals:", error);
      return []; // Return empty array instead of throwing
    }
  },

  async createProjectGoal(
    goal: Omit<ProjectGoal, "id" | "created_at" | "updated_at">,
    userId: string,
  ): Promise<ProjectGoal> {
    try {
      const { data, error } = await supabase
        .from("project_goals")
        .insert({
          ...goal,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: goal.project_id,
        user_id: userId,
        activity_type: "goal_created",
        description: `New goal created: ${goal.title}`,
      });

      return data;
    } catch (error) {
      console.error("Error creating project goal:", error);
      throw error;
    }
  },

  async updateProjectGoal(
    goalId: string,
    updates: Partial<ProjectGoal>,
    userId: string,
  ): Promise<ProjectGoal> {
    try {
      const { data, error } = await supabase
        .from("project_goals")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: data.project_id,
        user_id: userId,
        activity_type: "goal_updated",
        description: `Goal updated: ${data.title}`,
      });

      return data;
    } catch (error) {
      console.error("Error updating project goal:", error);
      throw error;
    }
  },

  async deleteProjectGoal(goalId: string, userId: string): Promise<void> {
    try {
      // Get project_id before deleting
      const { data: goal, error: fetchError } = await supabase
        .from("project_goals")
        .select("project_id, title")
        .eq("id", goalId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("project_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: goal.project_id,
        user_id: userId,
        activity_type: "goal_deleted",
        description: `Goal deleted: ${goal.title}`,
      });
    } catch (error) {
      console.error("Error deleting project goal:", error);
      throw error;
    }
  },

  /**
   * Project Questionnaires
   */
  async getProjectQuestionnaires(
    projectId: string,
  ): Promise<ProjectQuestionnaire[]> {
    try {
      const { data, error } = await supabase
        .from("project_questionnaires")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching project questionnaires:", error);
        return []; // Return empty array instead of throwing
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching project questionnaires:", error);
      return []; // Return empty array instead of throwing
    }
  },

  async getQuestionnaire(
    questionnaireId: string,
  ): Promise<ProjectQuestionnaire> {
    try {
      const { data, error } = await supabase
        .from("project_questionnaires")
        .select("*")
        .eq("id", questionnaireId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      throw error;
    }
  },

  async createQuestionnaire(
    questionnaire: Omit<
      ProjectQuestionnaire,
      "id" | "created_at" | "updated_at"
    >,
    userId: string,
  ): Promise<ProjectQuestionnaire> {
    try {
      const { data, error } = await supabase
        .from("project_questionnaires")
        .insert({
          ...questionnaire,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: questionnaire.project_id,
        user_id: userId,
        activity_type: "questionnaire_created",
        description: `New questionnaire created: ${questionnaire.title}`,
      });

      return data;
    } catch (error) {
      console.error("Error creating questionnaire:", error);
      throw error;
    }
  },

  async updateQuestionnaire(
    questionnaireId: string,
    updates: Partial<ProjectQuestionnaire>,
    userId: string,
  ): Promise<ProjectQuestionnaire> {
    try {
      const { data, error } = await supabase
        .from("project_questionnaires")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionnaireId)
        .select()
        .single();

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: data.project_id,
        user_id: userId,
        activity_type: "questionnaire_updated",
        description: `Questionnaire updated: ${data.title}`,
      });

      return data;
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      throw error;
    }
  },

  async deleteQuestionnaire(
    questionnaireId: string,
    userId: string,
  ): Promise<void> {
    try {
      // Get project_id before deleting
      const { data: questionnaire, error: fetchError } = await supabase
        .from("project_questionnaires")
        .select("project_id, title")
        .eq("id", questionnaireId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("project_questionnaires")
        .delete()
        .eq("id", questionnaireId);

      if (error) throw error;

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: questionnaire.project_id,
        user_id: userId,
        activity_type: "questionnaire_deleted",
        description: `Questionnaire deleted: ${questionnaire.title}`,
      });
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      throw error;
    }
  },

  async submitQuestionnaireResponse(
    questionnaireId: string,
    responses: Record<string, any>,
    userId: string,
  ): Promise<QuestionnaireResponse> {
    try {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .insert({
          questionnaire_id: questionnaireId,
          user_id: userId,
          responses,
        })
        .select()
        .single();

      if (error) throw error;

      // Get questionnaire details for activity log
      const { data: questionnaire } = await supabase
        .from("project_questionnaires")
        .select("project_id, title")
        .eq("id", questionnaireId)
        .single();

      // Record activity
      await supabase.from("project_activity").insert({
        project_id: questionnaire.project_id,
        user_id: userId,
        activity_type: "questionnaire_response",
        description: `Response submitted for questionnaire: ${questionnaire.title}`,
      });

      return data;
    } catch (error) {
      console.error("Error submitting questionnaire response:", error);
      throw error;
    }
  },

  async getQuestionnaireResponses(
    questionnaireId: string,
  ): Promise<QuestionnaireResponse[]> {
    try {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .select("*")
        .eq("questionnaire_id", questionnaireId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching questionnaire responses:", error);
      throw error;
    }
  },

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
        searchQuery,
      } = options;

      console.log("Fetching projects with options:", options);

      // First, check if the projects table exists by getting its structure
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from("projects")
          .select("id")
          .limit(1);

        if (tableError) {
          console.error("Error checking projects table:", tableError);
          console.log("Database table check failed");
          throw new Error(`Database table check failed: ${tableError.message}`);
        } else {
          console.log("Projects table exists and is accessible");
        }
      } catch (tableCheckError) {
        console.error("Exception checking projects table:", tableCheckError);
        throw new Error(
          `Database connection error: ${tableCheckError.message}`,
        );
      }

      // Build the query
      let query = supabase.from("projects").select("*");

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
        // We'll sort by feedback count after fetching the data
        query = query.order("updated_at", { ascending: false });
      }

      console.log("Executing Supabase query for projects");

      // Execute the query
      const { data: projectsData, error: projectsError } = await query;

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        // Check if this is a PostgreSQL error that might indicate missing tables
        if (
          projectsError.message &&
          projectsError.message.includes("relation")
        ) {
          console.error(
            "This may indicate that the projects table doesn't exist or has incorrect permissions",
          );
        }
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      console.log(
        `Fetched ${projectsData?.length || 0} projects from database:`,
        projectsData,
      );

      // If no projects found, return empty array
      if (!projectsData || projectsData.length === 0) {
        console.log("No projects found in the database");
        return [];
      }

      // Extract project IDs for related queries
      const projectIds = projectsData.map((project) => project.id);

      // Fetch feedback data - with error handling for missing tables
      let feedbackData = [];
      try {
        const { data, error: feedbackError } = await supabase
          .from("project_feedback")
          .select("project_id, count")
          .in("project_id", projectIds);

        if (feedbackError) {
          console.error("Error fetching feedback data:", feedbackError);
          // Continue without feedback data
        } else {
          feedbackData = data || [];
        }
      } catch (feedbackQueryError) {
        console.error("Exception fetching feedback data:", feedbackQueryError);
        // Continue without feedback data
      }

      // Fetch sentiment data - with error handling for missing tables
      let sentimentData = [];
      try {
        const { data, error: sentimentError } = await supabase
          .from("project_feedback_sentiment")
          .select("project_id, positive, negative, neutral")
          .in("project_id", projectIds);

        if (sentimentError) {
          console.error("Error fetching sentiment data:", sentimentError);
          // Continue without sentiment data
        } else {
          sentimentData = data || [];
        }
      } catch (sentimentQueryError) {
        console.error(
          "Exception fetching sentiment data:",
          sentimentQueryError,
        );
        // Continue without sentiment data
      }

      // Create lookup maps for feedback and sentiment data
      const feedbackMap = (feedbackData || []).reduce((acc, item) => {
        acc[item.project_id] = item.count;
        return acc;
      }, {});

      const sentimentMap = (sentimentData || []).reduce((acc, item) => {
        acc[item.project_id] = {
          positive: item.positive,
          negative: item.negative,
          neutral: item.neutral,
        };
        return acc;
      }, {});

      // Combine all data
      let processedProjects = projectsData.map((project) => ({
        ...project,
        feedback_count: feedbackMap[project.id] || 0,
        positive_feedback: sentimentMap[project.id]?.positive || 0,
        negative_feedback: sentimentMap[project.id]?.negative || 0,
        neutral_feedback: sentimentMap[project.id]?.neutral || 0,
      }));

      // Apply search filter if provided
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        processedProjects = processedProjects.filter((project) => {
          return (
            project.title.toLowerCase().includes(searchLower) ||
            (project.description &&
              project.description.toLowerCase().includes(searchLower)) ||
            (project.category &&
              project.category.toLowerCase().includes(searchLower)) ||
            (Array.isArray(project.tags) &&
              project.tags.some((tag) =>
                tag.toLowerCase().includes(searchLower),
              ))
          );
        });
      }

      // Apply custom sorting for feedback_count if needed
      if (sortBy === "feedback_count") {
        processedProjects.sort(
          (a, b) => (b.feedback_count || 0) - (a.feedback_count || 0),
        );
      }

      console.log(`Returning ${processedProjects.length} processed projects`);
      return processedProjects;
    } catch (error) {
      console.error("Error in fetchProjects:", error);
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
      // Check if user has reached their project limit
      const { rewardsService } = await import("./rewards");
      const hasReachedLimit =
        await rewardsService.hasReachedProjectLimit(userId);

      if (hasReachedLimit) {
        throw new Error(
          "You have reached the maximum number of active projects. Please archive or delete an existing project before creating a new one.",
        );
      }

      // Step 1: Create the project record
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

      // Step 2: Initialize related records in parallel with error handling
      const initializationPromises = [
        // Initialize feedback counters
        supabase
          .from("project_feedback")
          .insert({
            project_id: data.id,
            count: 0,
          })
          .then((result) => {
            if (result.error) {
              console.error(
                "Error initializing project_feedback:",
                result.error,
              );
            }
            return result;
          }),

        // Initialize sentiment counters
        supabase
          .from("project_feedback_sentiment")
          .insert({
            project_id: data.id,
            positive: 0,
            negative: 0,
            neutral: 0,
          })
          .then((result) => {
            if (result.error) {
              console.error(
                "Error initializing project_feedback_sentiment:",
                result.error,
              );
            }
            return result;
          }),

        // Add owner as first collaborator
        supabase
          .from("project_collaborators")
          .insert({
            project_id: data.id,
            user_id: userId,
            role: "owner",
          })
          .then((result) => {
            if (result.error) {
              console.error("Error adding project collaborator:", result.error);
              // If this fails, try a direct approach with RLS bypass
              return supabase
                .rpc("add_project_owner", {
                  p_project_id: data.id,
                  p_user_id: userId,
                })
                .catch((rpcError) => {
                  console.error(
                    "Fallback RPC for adding owner also failed:",
                    rpcError,
                  );
                });
            }
            return result;
          }),

        // Record activity in project_activity table
        supabase
          .from("project_activity")
          .insert({
            project_id: data.id,
            user_id: userId,
            activity_type: "project_created",
            description: "Project created",
          })
          .then((result) => {
            if (result.error) {
              console.error("Error recording project activity:", result.error);
            }
            return result;
          }),
      ];

      // Wait for all initialization tasks to complete
      await Promise.allSettled(initializationPromises);

      // Step 3: Record user activity and award points with improved duplicate prevention
      try {
        console.log("Processing reward for project creation");

        // First check if an activity record already exists for this project creation
        const { data: existingActivity, error: checkError } = await supabase
          .from("user_activity")
          .select("id")
          .eq("user_id", userId)
          .eq("activity_type", "project_created")
          .eq("project_id", data.id)
          .limit(1);

        if (!checkError && existingActivity && existingActivity.length > 0) {
          console.log(
            "Activity already recorded for this project, skipping reward processing",
          );
          return data;
        }

        // Process the reward with the edge function
        // Important: We're using a single approach to record the activity
        // The edge function will handle the activity recording
        const rewardResult = await rewardsService
          .processReward({
            userId,
            activityType: "project_created",
            description: `Created project: ${data.title}`,
            metadata: { projectTitle: data.title },
            projectId: data.id,
            // Don't skip activity recording in the edge function
            skipActivityRecord: false,
          })
          .catch(async (edgeFunctionError) => {
            console.error(
              "Edge function error, using direct activity recording fallback:",
              edgeFunctionError,
            );

            // Check again if activity was recorded during the edge function attempt
            const { data: doubleCheckActivity } = await supabase
              .from("user_activity")
              .select("id")
              .eq("user_id", userId)
              .eq("activity_type", "project_created")
              .eq("project_id", data.id)
              .limit(1);

            if (doubleCheckActivity && doubleCheckActivity.length > 0) {
              console.log(
                "Activity was already recorded by edge function, skipping fallback",
              );
              return {
                success: true,
                points: 20,
                message: "Points already awarded by edge function",
                activityRecorded: true,
              };
            }

            // Fallback: Directly record activity in user_activity table
            const { activityService } = await import("./activity");
            const activityResult = await activityService.recordActivity({
              user_id: userId,
              activity_type: "project_created",
              description: `Created project: ${data.title}`,
              points: 20, // Default points for project creation
              metadata: { projectTitle: data.title },
              project_id: data.id,
            });

            // Fallback: Directly update user points
            if (activityResult.success) {
              try {
                // Get current user data
                const { data: userData } = await supabase
                  .from("users")
                  .select("points")
                  .eq("id", userId)
                  .single();

                if (userData) {
                  // Update points directly
                  await supabase
                    .from("users")
                    .update({ points: (userData.points || 0) + 20 })
                    .eq("id", userId);

                  // Directly dispatch award event as a fallback
                  if (typeof window !== "undefined" && window.dispatchEvent) {
                    try {
                      const awardEvent = new CustomEvent("award:received", {
                        detail: {
                          points: 20,
                          title: "Project Created!",
                          description: `You earned 20 points for creating a project`,
                          variant: "default",
                        },
                      });
                      window.dispatchEvent(awardEvent);
                      console.log(
                        "Project creation award event dispatched directly",
                      );
                    } catch (eventError) {
                      console.error(
                        "Error dispatching project creation award event:",
                        eventError,
                      );
                    }
                  }

                  return {
                    success: true,
                    points: 20,
                    message: "Points awarded via fallback mechanism",
                    activityRecorded: true,
                  };
                }
              } catch (pointsUpdateError) {
                console.error(
                  "Error in fallback points update:",
                  pointsUpdateError,
                );
              }
            }

            return {
              success: activityResult.success,
              points: activityResult.success ? 20 : 0,
              message: activityResult.success
                ? "Points awarded via fallback mechanism"
                : "Failed to award points",
              activityRecorded: activityResult.success,
            };
          });

        console.log("Project creation reward result:", rewardResult);

        // Ensure award toast is shown by directly dispatching the event
        if (rewardResult.success && rewardResult.points > 0) {
          if (typeof window !== "undefined" && window.dispatchEvent) {
            try {
              const awardEvent = new CustomEvent("award:received", {
                detail: {
                  points: rewardResult.points,
                  title: "Project Created!",
                  description: `You earned ${rewardResult.points} points for creating a project`,
                  variant: "default",
                },
              });
              window.dispatchEvent(awardEvent);
              console.log("Project creation award event dispatched");

              // Also try with document to ensure it's caught
              if (document && document.dispatchEvent) {
                document.dispatchEvent(awardEvent);
                console.log(
                  "Project creation award event dispatched via document",
                );
              }
            } catch (eventError) {
              console.error(
                "Error dispatching project creation award event:",
                eventError,
              );
            }
          }
        }
      } catch (rewardError) {
        console.error("All reward processing methods failed:", rewardError);
        // Continue execution even if all reward processing methods fail
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

      // Record activity in project_activity table
      await supabase.from("project_activity").insert({
        project_id: projectId,
        user_id: userId,
        activity_type: "project_updated",
        description: "Project updated",
        metadata: { version: nextVersionNumber },
      });

      // Process reward for project update using the rewards service
      try {
        const { rewardsService } = await import("./rewards");
        const rewardResult = await rewardsService.processReward({
          userId,
          activityType: "project_updated",
          description: `Updated project: ${data.title}`,
          metadata: { version: nextVersionNumber, projectTitle: data.title },
          projectId,
        });

        console.log("Project update reward result:", rewardResult);

        // Ensure award toast is shown by directly dispatching the event
        if (rewardResult.success && rewardResult.points > 0) {
          if (typeof window !== "undefined" && window.dispatchEvent) {
            try {
              const awardEvent = new CustomEvent("award:received", {
                detail: {
                  points: rewardResult.points,
                  title: "Project Updated!",
                  description: `You earned ${rewardResult.points} points for updating a project`,
                  variant: "default",
                },
              });
              window.dispatchEvent(awardEvent);
              console.log("Project update award event dispatched");

              // Also try with document to ensure it's caught
              if (document && document.dispatchEvent) {
                document.dispatchEvent(awardEvent);
                console.log(
                  "Project update award event dispatched via document",
                );
              }
            } catch (eventError) {
              console.error(
                "Error dispatching project update award event:",
                eventError,
              );
            }
          }
        }
      } catch (rewardError) {
        console.error("Error processing project update reward:", rewardError);
        // Continue execution even if reward processing fails
      }

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
      console.log(
        `[Project Service] Starting deletion of project ${projectId} by user ${userId}`,
      );

      // First check if the project exists and if the user is the owner
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("user_id, title")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error(
          "[Project Service] Error fetching project:",
          projectError,
        );
        throw new Error("Project not found");
      }

      console.log(
        `[Project Service] Found project: ${project.title} (${projectId})`,
      );

      // Check if user is the direct owner of the project or a collaborator with owner role
      const isDirectOwner = project.user_id === userId;
      let isCollaboratorOwner = false;

      if (!isDirectOwner) {
        console.log(
          `[Project Service] User is not direct owner, checking collaborator status`,
        );
        // Check collaborator status
        const { data: collaborator, error: collabError } = await supabase
          .from("project_collaborators")
          .select("role")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .single();

        if (collabError || !collaborator || collaborator.role !== "owner") {
          console.error(
            "[Project Service] User does not have permission to delete project",
          );
          throw new Error("Only project owners can delete projects");
        }
        isCollaboratorOwner = true;
        console.log(`[Project Service] User is a collaborator with owner role`);
      } else {
        console.log(
          `[Project Service] User is the direct owner of the project`,
        );
      }

      // If we get here, the user has permission to delete the project
      console.log(
        `[Project Service] Deleting project ${projectId} and related records...`,
      );

      // First, delete related records in user_activity table
      const { error: activityError } = await supabase
        .from("user_activity")
        .delete()
        .eq("project_id", projectId);

      if (activityError) {
        console.error(
          "[Project Service] Error deleting related user activities:",
          activityError,
        );
        // Continue with deletion even if this fails
      } else {
        console.log(
          `[Project Service] Successfully deleted related user activities`,
        );
      }

      // Delete related records in project_activity table
      const { error: projectActivityError } = await supabase
        .from("project_activity")
        .delete()
        .eq("project_id", projectId);

      if (projectActivityError) {
        console.error(
          "Error deleting project activities:",
          projectActivityError,
        );
        // Continue with deletion even if this fails
      }

      // Delete related records in project_goals table
      const { error: goalsError } = await supabase
        .from("project_goals")
        .delete()
        .eq("project_id", projectId);

      if (goalsError) {
        console.error("Error deleting project goals:", goalsError);
        // Continue with deletion even if this fails
      }

      // Delete related records in project_questionnaires table
      const { error: questionnairesError } = await supabase
        .from("project_questionnaires")
        .delete()
        .eq("project_id", projectId);

      if (questionnairesError) {
        console.error(
          "Error deleting project questionnaires:",
          questionnairesError,
        );
        // Continue with deletion even if this fails
      }

      // Delete related records in project_collaborators table
      const { error: collaboratorsError } = await supabase
        .from("project_collaborators")
        .delete()
        .eq("project_id", projectId);

      if (collaboratorsError) {
        console.error(
          "Error deleting project collaborators:",
          collaboratorsError,
        );
        // Continue with deletion even if this fails
      }

      // Delete related records in project_feedback table
      const { error: feedbackError } = await supabase
        .from("project_feedback")
        .delete()
        .eq("project_id", projectId);

      if (feedbackError) {
        console.error("Error deleting project feedback:", feedbackError);
        // Continue with deletion even if this fails
      }

      // Delete related records in project_feedback_sentiment table
      const { error: sentimentError } = await supabase
        .from("project_feedback_sentiment")
        .delete()
        .eq("project_id", projectId);

      if (sentimentError) {
        console.error(
          "Error deleting project feedback sentiment:",
          sentimentError,
        );
        // Continue with deletion even if this fails
      }

      // Delete related records in project_versions table
      const { error: versionsError } = await supabase
        .from("project_versions")
        .delete()
        .eq("project_id", projectId);

      if (versionsError) {
        console.error("Error deleting project versions:", versionsError);
        // Continue with deletion even if this fails
      }

      // Finally, delete the project itself
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      console.log(
        `[Project Service] Project ${projectId} and related records deleted successfully`,
      );

      // Record the project deletion activity
      try {
        console.log(`[Project Service] Recording project deletion activity`);
        const { rewardsService } = await import("./rewards");
        const rewardResult = await rewardsService.processReward({
          userId,
          activityType: "project_updated", // Using project_updated for deletion
          description: `Deleted project: ${project.title}`,
          metadata: { projectTitle: project.title, action: "deleted" },
          // Don't include projectId since it's been deleted
        });

        console.log(
          `[Project Service] Project deletion activity result:`,
          rewardResult,
        );

        // Ensure award toast is shown by directly dispatching the event
        if (rewardResult.success && rewardResult.points > 0) {
          if (typeof window !== "undefined" && window.dispatchEvent) {
            try {
              const awardEvent = new CustomEvent("award:received", {
                detail: {
                  points: rewardResult.points,
                  title: "Project Deleted",
                  description: `You earned ${rewardResult.points} points for project management`,
                  variant: "default",
                },
              });
              window.dispatchEvent(awardEvent);
              console.log("Project deletion award event dispatched");

              // Also try with document to ensure it's caught
              if (document && document.dispatchEvent) {
                document.dispatchEvent(awardEvent);
                console.log(
                  "Project deletion award event dispatched via document",
                );
              }
            } catch (eventError) {
              console.error(
                "Error dispatching project deletion award event:",
                eventError,
              );
            }
          }
        }
      } catch (activityError) {
        console.error(
          "[Project Service] Error recording project deletion activity:",
          activityError,
        );
        // Continue execution even if activity recording fails
      }
    } catch (error) {
      console.error("[Project Service] Error deleting project:", error);
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
