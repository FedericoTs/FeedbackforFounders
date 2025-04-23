import { supabase } from "../supabase/supabase";
import { FeedbackCategory } from "@/components/feedback/FeedbackCategorySelector";

export interface CategoryWithConfidence extends FeedbackCategory {
  confidence?: number;
}

export const feedbackCategoriesService = {
  /**
   * Get all categories for a project
   */
  async getCategories(projectId?: string): Promise<FeedbackCategory[]> {
    try {
      let query = supabase
        .from("feedback_categories")
        .select("*")
        .order("name");

      // If projectId is provided, filter by project
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      return data.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
      }));
    } catch (error) {
      console.error("Error in getCategories:", error);
      return [];
    }
  },

  /**
   * Create a new category
   */
  async createCategory(
    category: Omit<FeedbackCategory, "id">,
    projectId?: string,
  ): Promise<FeedbackCategory> {
    try {
      const { data, error } = await supabase
        .from("feedback_categories")
        .insert({
          name: category.name,
          description: category.description || null,
          color: category.color || null,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating category:", error);
        throw new Error("Failed to create category");
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
      };
    } catch (error) {
      console.error("Error in createCategory:", error);
      throw error;
    }
  },

  /**
   * Update a category
   */
  async updateCategory(category: FeedbackCategory): Promise<FeedbackCategory> {
    try {
      const { data, error } = await supabase
        .from("feedback_categories")
        .update({
          name: category.name,
          description: category.description || null,
          color: category.color || null,
        })
        .eq("id", category.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating category:", error);
        throw new Error("Failed to update category");
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        color: data.color,
      };
    } catch (error) {
      console.error("Error in updateCategory:", error);
      throw error;
    }
  },

  /**
   * Get categories for a feedback item
   */
  async getFeedbackCategories(feedbackId: string): Promise<FeedbackCategory[]> {
    try {
      const { data, error } = await supabase
        .from("feedback_category_mappings")
        .select("category_id, feedback_categories(*)")
        .eq("feedback_id", feedbackId);

      if (error) {
        console.error("Error fetching feedback categories:", error);
        return [];
      }

      return data.map((mapping) => ({
        id: mapping.feedback_categories.id,
        name: mapping.feedback_categories.name,
        description: mapping.feedback_categories.description,
        color: mapping.feedback_categories.color,
      }));
    } catch (error) {
      console.error("Error in getFeedbackCategories:", error);
      return [];
    }
  },

  /**
   * Get suggested categories for feedback text
   */
  async getSuggestedCategories(
    text: string,
    projectId?: string,
  ): Promise<CategoryWithConfidence[]> {
    try {
      // Call the feedback-analysis edge function to get suggested categories
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-feedback-analysis",
        {
          body: { content: text, projectId },
        },
      );

      if (error) {
        console.error("Error getting suggested categories:", error);
        return [];
      }

      // If the function returns suggested categories, use them
      if (data && data.suggestedCategories) {
        return data.suggestedCategories;
      }

      // If the function doesn't return suggested categories, use the category and subcategory
      if (data && data.category) {
        const categories: CategoryWithConfidence[] = [];

        // Get existing categories that match the suggested ones
        const existingCategories = await this.getCategories(projectId);

        // Try to find a matching category by name
        const categoryMatch = existingCategories.find(
          (c) => c.name.toLowerCase() === data.category.toLowerCase(),
        );

        if (categoryMatch) {
          categories.push({
            ...categoryMatch,
            confidence: 0.9,
          });
        } else {
          // Create a temporary category object (not saved to DB yet)
          categories.push({
            id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: data.category,
            confidence: 0.9,
          });
        }

        // Add subcategory if available
        if (data.subcategory) {
          const subcategoryMatch = existingCategories.find(
            (c) => c.name.toLowerCase() === data.subcategory.toLowerCase(),
          );

          if (subcategoryMatch) {
            categories.push({
              ...subcategoryMatch,
              confidence: 0.8,
            });
          } else {
            // Create a temporary category object (not saved to DB yet)
            categories.push({
              id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: data.subcategory,
              confidence: 0.8,
            });
          }
        }

        return categories;
      }

      return [];
    } catch (error) {
      console.error("Error in getSuggestedCategories:", error);
      return [];
    }
  },
};
