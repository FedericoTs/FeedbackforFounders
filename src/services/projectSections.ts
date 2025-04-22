import { supabase } from "../../supabase/supabase";

export interface ProjectSection {
  id: string;
  project_id: string;
  section_id: string;
  section_name: string;
  section_type: string;
  dom_path?: string;
  visual_bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  priority: number;
  feedback_count: number;
  average_sentiment?: number;
}

export const projectSectionsService = {
  /**
   * Get sections for a project
   */
  async getProjectSections(projectId: string): Promise<ProjectSection[]> {
    try {
      const { data, error } = await supabase
        .from("project_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting project sections:", error);
      return [];
    }
  },

  /**
   * Detect sections for a project using AI
   * This would normally call an edge function that uses AI to analyze the project
   * For now, we'll return mock data
   */
  async detectProjectSections(projectId: string): Promise<ProjectSection[]> {
    try {
      // Check if sections already exist
      const existingSections = await this.getProjectSections(projectId);
      if (existingSections.length > 0) {
        return existingSections;
      }

      // In a real implementation, this would call an edge function
      // that uses AI to analyze the project and detect sections
      // For now, we'll create mock sections

      const mockSections = [
        {
          project_id: projectId,
          section_id: "header",
          section_name: "Header",
          section_type: "Navigation",
          priority: 10,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 0, width: 1200, height: 80 },
        },
        {
          project_id: projectId,
          section_id: "hero",
          section_name: "Hero Section",
          section_type: "Content",
          priority: 20,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 80, width: 1200, height: 500 },
        },
        {
          project_id: projectId,
          section_id: "features",
          section_name: "Features",
          section_type: "Content",
          priority: 30,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 580, width: 1200, height: 600 },
        },
        {
          project_id: projectId,
          section_id: "pricing",
          section_name: "Pricing",
          section_type: "Pricing",
          priority: 40,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 1180, width: 1200, height: 400 },
        },
        {
          project_id: projectId,
          section_id: "testimonials",
          section_name: "Testimonials",
          section_type: "Social Proof",
          priority: 50,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 1580, width: 1200, height: 300 },
        },
        {
          project_id: projectId,
          section_id: "cta",
          section_name: "Call to Action",
          section_type: "CTA",
          priority: 60,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 1880, width: 1200, height: 200 },
        },
        {
          project_id: projectId,
          section_id: "footer",
          section_name: "Footer",
          section_type: "Navigation",
          priority: 70,
          feedback_count: 0,
          visual_bounds: { x: 0, y: 2080, width: 1200, height: 150 },
        },
      ];

      // In a real implementation, we would save these sections to the database
      // For now, we'll just return them
      return mockSections as ProjectSection[];
    } catch (error) {
      console.error("Error detecting project sections:", error);
      return [];
    }
  },

  /**
   * Update section feedback count
   */
  async updateSectionFeedbackCount(
    projectId: string,
    sectionId: string,
  ): Promise<void> {
    try {
      // Get current section
      const { data: sectionData, error: sectionError } = await supabase
        .from("project_sections")
        .select("id, feedback_count")
        .eq("project_id", projectId)
        .eq("section_id", sectionId)
        .single();

      if (sectionError) {
        // Section doesn't exist, create it
        await supabase.from("project_sections").insert({
          project_id: projectId,
          section_id: sectionId,
          section_name: "Unknown Section", // Will be updated later
          section_type: "unknown", // Will be updated later
          priority: 999, // Low priority for unknown sections
          feedback_count: 1,
        });
      } else {
        // Update existing section
        await supabase
          .from("project_sections")
          .update({ feedback_count: (sectionData.feedback_count || 0) + 1 })
          .eq("id", sectionData.id);
      }
    } catch (error) {
      console.error("Error updating section feedback count:", error);
    }
  },
};
