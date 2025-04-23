import { supabase } from "../../supabase/supabase";

/**
 * This service provides functions to test database policies
 * and diagnose any issues with them.
 */
export const policyTestService = {
  /**
   * Test if the projects table can be accessed without recursion errors
   */
  async testProjectsAccess(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log("Testing projects table access...");

      // Simple query that should work with any valid policy
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .limit(5);

      if (error) {
        console.error("Error accessing projects table:", error);
        return {
          success: false,
          message: `Policy test failed: ${error.message}`,
        };
      }

      return {
        success: true,
        message: `Successfully accessed projects table. Found ${data.length} projects.`,
        data,
      };
    } catch (error) {
      console.error("Exception in testProjectsAccess:", error);
      return {
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Test if the project_collaborators table can be accessed without recursion errors
   */
  async testCollaboratorsAccess(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log("Testing project_collaborators table access...");

      // Simple query that should work with any valid policy
      const { data, error } = await supabase
        .from("project_collaborators")
        .select("id, project_id, user_id")
        .limit(5);

      if (error) {
        console.error("Error accessing project_collaborators table:", error);
        return {
          success: false,
          message: `Policy test failed: ${error.message}`,
        };
      }

      return {
        success: true,
        message: `Successfully accessed project_collaborators table. Found ${data.length} records.`,
        data,
      };
    } catch (error) {
      console.error("Exception in testCollaboratorsAccess:", error);
      return {
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Run a comprehensive test of all related policies
   */
  async runPolicyTests(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    const results: Record<string, any> = {};
    let allSuccessful = true;

    // Test projects table
    const projectsResult = await this.testProjectsAccess();
    results.projects = projectsResult;
    if (!projectsResult.success) allSuccessful = false;

    // Test project_collaborators table
    const collaboratorsResult = await this.testCollaboratorsAccess();
    results.collaborators = collaboratorsResult;
    if (!collaboratorsResult.success) allSuccessful = false;

    return {
      success: allSuccessful,
      results,
    };
  },
};
