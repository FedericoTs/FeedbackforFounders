import { supabase } from "../../supabase/supabase";

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  socialLinks?: {
    platform: string;
    username: string;
  }[];
}

export interface ProfileResponse {
  user: any;
  socialLinks: any[];
  skills: string[];
  achievements: any[];
  activity: any[];
  stats: {
    projectsCreated: number;
    feedbackReceived: number;
    feedbackGiven: number;
    pointsEarned: number;
  };
}

export const profileService = {
  /**
   * Get the current user's profile data
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      console.log("Fetching profile data from edge function");
      const { data, error } = await supabase.functions.invoke("profile", {
        method: "GET",
      });

      if (error) {
        console.error("Error fetching profile:", error);
        throw new Error(error.message);
      }

      // Ensure we have a valid response structure even if some data is missing
      return {
        user: data?.user || {},
        socialLinks: data?.socialLinks || [],
        skills: data?.skills || [],
        achievements: data?.achievements || [],
        activity: data?.activity || [],
        stats: data?.stats || {
          projectsCreated: 0,
          feedbackReceived: 0,
          feedbackGiven: 0,
          pointsEarned: 0,
        },
      };
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<void> {
    try {
      console.log(
        "Updating profile with data:",
        JSON.stringify(profileData, null, 2),
      );

      // Filter out empty social links
      if (profileData.socialLinks) {
        profileData.socialLinks = profileData.socialLinks.filter(
          (link) => link.username && link.username.trim() !== "",
        );
      }

      // Filter out empty skills
      if (profileData.skills) {
        profileData.skills = profileData.skills.filter(
          (skill) => skill && skill.trim() !== "",
        );
        console.log("Filtered skills:", profileData.skills);
      }

      // Ensure we're sending the correct data structure
      const cleanedData = {
        name: profileData.name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        skills: profileData.skills || [],
        socialLinks: profileData.socialLinks || [],
      };

      console.log("Sending cleaned data to edge function:", cleanedData);

      const { data, error } = await supabase.functions.invoke("profile", {
        method: "POST",
        body: cleanedData,
      });

      if (error) {
        console.error("Error updating profile:", error);
        throw new Error(error.message);
      }

      console.log("Profile updated successfully:", data);
    } catch (error) {
      console.error("Error in updateProfile:", error);
      throw error;
    }
  },

  /**
   * Calculate the percentage progress to the next level
   */
  calculateLevelProgress(points: number, pointsToNextLevel: number): number {
    if (!points || !pointsToNextLevel) return 0;
    return Math.min(
      Math.round((points / (points + pointsToNextLevel)) * 100),
      100,
    );
  },

  /**
   * Format a date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  },
};
