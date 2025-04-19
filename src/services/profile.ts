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

      // Try to get profile from edge function
      try {
        const { data, error } = await supabase.functions.invoke("profile", {
          method: "GET",
        });

        if (error) {
          console.error("Error fetching profile from edge function:", error);
          // Continue to fallback
        } else if (data) {
          // Return data from edge function if successful
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
        }
      } catch (edgeFunctionError) {
        console.error(
          "Edge function error, using fallback:",
          edgeFunctionError,
        );
        // Continue to fallback
      }

      // Fallback: Get user data directly from Supabase and localStorage
      console.log("Using fallback method to get profile data");
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Try to get cached profile data from localStorage
      let cachedProfile = {};
      try {
        const storageKey = `profile_${user.id}`;
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
          cachedProfile = JSON.parse(cachedData);
          console.log("Retrieved cached profile data from localStorage");
        }
      } catch (storageError) {
        console.error("Error reading from localStorage:", storageError);
      }

      // Create a default profile response with cached data if available
      return {
        user: {
          id: user.id,
          email: user.email,
          full_name:
            cachedProfile?.user?.full_name ||
            user.user_metadata?.full_name ||
            user.email ||
            "",
          bio: cachedProfile?.user?.bio || "",
          location: cachedProfile?.user?.location || "",
          website: cachedProfile?.user?.website || "",
          level: cachedProfile?.user?.level || 1,
          points: cachedProfile?.user?.points || 0,
          points_to_next_level:
            cachedProfile?.user?.points_to_next_level || 100,
        },
        socialLinks: cachedProfile?.socialLinks || [],
        skills: cachedProfile?.skills || [],
        achievements: cachedProfile?.achievements || [],
        activity: cachedProfile?.activity || [],
        stats: cachedProfile?.stats || {
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

      // Get current user for fallback mechanism
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        // Try to update profile using edge function
        const { data, error } = await supabase.functions.invoke("profile", {
          method: "POST",
          body: cleanedData,
        });

        if (error) {
          console.error("Error updating profile via edge function:", error);
          // Continue to fallback
        } else {
          console.log("Profile updated successfully via edge function:", data);

          // Also update localStorage cache for consistency
          try {
            const storageKey = `profile_${user.id}`;
            const cachedData = localStorage.getItem(storageKey);
            let cachedProfile = cachedData ? JSON.parse(cachedData) : {};

            // Update the cached profile
            cachedProfile = {
              ...cachedProfile,
              user: {
                ...cachedProfile.user,
                full_name: cleanedData.name,
                bio: cleanedData.bio,
                location: cleanedData.location,
                website: cleanedData.website,
              },
              skills: cleanedData.skills,
              socialLinks: cleanedData.socialLinks,
            };

            localStorage.setItem(storageKey, JSON.stringify(cachedProfile));
            console.log("Updated profile cache in localStorage");
          } catch (storageError) {
            console.error("Error updating localStorage cache:", storageError);
          }

          return;
        }
      } catch (edgeFunctionError) {
        console.error(
          "Edge function error, using fallback:",
          edgeFunctionError,
        );
        // Continue to fallback
      }

      // Fallback: Store profile data in localStorage
      console.log("Using fallback method to store profile data");
      try {
        // Store profile data in localStorage
        const storageKey = `profile_${user.id}`;
        const cachedData = localStorage.getItem(storageKey);
        let cachedProfile = cachedData ? JSON.parse(cachedData) : {};

        // Update the cached profile
        cachedProfile = {
          ...cachedProfile,
          user: {
            ...cachedProfile.user,
            id: user.id,
            email: user.email,
            full_name:
              cleanedData.name ||
              cachedProfile?.user?.full_name ||
              user.user_metadata?.full_name ||
              user.email ||
              "",
            bio: cleanedData.bio || cachedProfile?.user?.bio || "",
            location:
              cleanedData.location || cachedProfile?.user?.location || "",
            website: cleanedData.website || cachedProfile?.user?.website || "",
            level: cachedProfile?.user?.level || 1,
            points: cachedProfile?.user?.points || 0,
            points_to_next_level:
              cachedProfile?.user?.points_to_next_level || 100,
          },
          skills: cleanedData.skills,
          socialLinks: cleanedData.socialLinks,
          achievements: cachedProfile?.achievements || [],
          activity: cachedProfile?.activity || [],
          stats: cachedProfile?.stats || {
            projectsCreated: 0,
            feedbackReceived: 0,
            feedbackGiven: 0,
            pointsEarned: 0,
          },
        };

        localStorage.setItem(storageKey, JSON.stringify(cachedProfile));
        console.log("Profile data saved to localStorage");
      } catch (localStorageError) {
        console.error("Error saving to localStorage:", localStorageError);
        throw localStorageError;
      }
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
