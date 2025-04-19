import { supabase } from "../../supabase/supabase";

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  avatar_url?: string;
  banner_url?: string;
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
   * Get the current user's profile data directly from Supabase tables
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      console.log("Fetching profile data from Supabase tables");

      // Get current authenticated user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("User not authenticated");
      }

      const user = userData.user;
      const userId = user.id;

      // Initialize default response
      const response: ProfileResponse = {
        user: {
          id: userId,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email || "",
          bio: "",
          location: "",
          website: "",
          level: 1,
          points: 0,
          points_to_next_level: 100,
        },
        socialLinks: [],
        skills: [],
        achievements: [],
        activity: [],
        stats: {
          projectsCreated: 0,
          feedbackReceived: 0,
          feedbackGiven: 0,
          pointsEarned: 0,
        },
      };

      // 1. Get user profile data from users table
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.log("User profile not found, creating a new one");
        // User doesn't exist in the users table, create it
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email || "",
            level: 1,
            points: 0,
            points_to_next_level: 100,
          })
          .select()
          .single();

        if (!insertError && newUser) {
          response.user = newUser;
        }
      } else if (profileData) {
        response.user = profileData;
      }

      // 2. Get social links
      const { data: socialLinks, error: socialLinksError } = await supabase
        .from("social_links")
        .select("*")
        .eq("user_id", userId);

      if (!socialLinksError && socialLinks) {
        response.socialLinks = socialLinks;
      }

      // 3. Get skills
      const { data: userSkills, error: skillsError } = await supabase
        .from("user_skills")
        .select("skill_id, skills(id, name)")
        .eq("user_id", userId);

      if (!skillsError && userSkills) {
        const skillNames = userSkills
          .map((item: any) => item.skills?.name)
          .filter(Boolean);

        console.log("Retrieved skills from database:", skillNames);

        if (skillNames && skillNames.length > 0) {
          response.skills = skillNames;
        }
      }

      // 4. Get achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(
          "achievement_id, earned_at, achievements(title, description, icon, color, points_reward)",
        )
        .eq("user_id", userId);

      if (!achievementsError && achievements) {
        response.achievements = achievements;
      }

      // 5. Get activity
      const { data: activity, error: activityError } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!activityError && activity) {
        response.activity = activity;
      }

      // 6. Calculate stats
      response.stats.pointsEarned = response.user?.points || 0;

      // Count projects created
      const { count: projectCount, error: projectCountError } = await supabase
        .from("user_activity")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("activity_type", "project_created");

      if (!projectCountError && projectCount !== null) {
        response.stats.projectsCreated = projectCount;
      }

      // Count feedback received
      const { count: feedbackReceivedCount, error: feedbackReceivedError } =
        await supabase
          .from("user_activity")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("activity_type", "feedback_received");

      if (!feedbackReceivedError && feedbackReceivedCount !== null) {
        response.stats.feedbackReceived = feedbackReceivedCount;
      }

      // Count feedback given
      const { count: feedbackGivenCount, error: feedbackGivenError } =
        await supabase
          .from("user_activity")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("activity_type", "feedback_given");

      if (!feedbackGivenError && feedbackGivenCount !== null) {
        response.stats.feedbackGiven = feedbackGivenCount;
      }

      console.log("Profile data fetched successfully", response);
      return response;
    } catch (error) {
      console.error("Error in getProfile:", error);
      throw error;
    }
  },

  /**
   * Update the current user's profile directly in Supabase tables
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<void> {
    try {
      console.log(
        "Updating profile with data:",
        JSON.stringify(profileData, null, 2),
      );

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("User not authenticated");
      }

      const user = userData.user;
      const userId = user.id;

      // Filter out empty social links
      const filteredSocialLinks =
        profileData.socialLinks?.filter(
          (link) => link.username && link.username.trim() !== "",
        ) || [];

      // Filter out empty skills
      const filteredSkills =
        profileData.skills?.filter((skill) => skill && skill.trim() !== "") ||
        [];

      console.log("Filtered skills:", filteredSkills);

      // 1. Update user profile in users table
      console.log("Profile data before creating updates:", {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
      });

      const userUpdates = {
        full_name: profileData.name || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
        website: profileData.website || "",
        updated_at: new Date().toISOString(),
        ...(profileData.avatar_url && { avatar_url: profileData.avatar_url }),
        ...(profileData.banner_url && { banner_url: profileData.banner_url }),
      };

      console.log("User updates to be sent to database:", userUpdates);

      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (checkError) {
        // User doesn't exist, create it
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          email: user.email,
          ...userUpdates,
          level: 1,
          points: 0,
          points_to_next_level: 100,
        });

        if (insertError) {
          console.error("Error creating user profile:", insertError);
          throw new Error("Failed to create user profile");
        }
      } else {
        // User exists, update it
        console.log("Attempting to update user with ID:", userId);

        // First, let's check if the user exists in the database
        const { data: userCheck, error: userCheckError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId);

        console.log("User check result:", userCheck, "Error:", userCheckError);

        // Now perform the update with more detailed logging
        const { data: updateResult, error: updateError } = await supabase
          .from("users")
          .update(userUpdates)
          .eq("id", userId)
          .select();

        console.log("Update result:", updateResult, "Error:", updateError);

        if (updateError) {
          console.error("Error updating user profile:", updateError);
          throw new Error("Failed to update user profile");
        }
      }

      // 2. Update social links
      if (filteredSocialLinks.length > 0) {
        // First delete existing links
        await supabase.from("social_links").delete().eq("user_id", userId);

        // Then insert new ones
        const socialLinksToInsert = filteredSocialLinks.map((link) => ({
          user_id: userId,
          platform: link.platform,
          username: link.username,
        }));

        const { error: socialLinksError } = await supabase
          .from("social_links")
          .insert(socialLinksToInsert);

        if (socialLinksError) {
          console.error("Error updating social links:", socialLinksError);
        }
      } else {
        // Delete all social links if none provided
        await supabase.from("social_links").delete().eq("user_id", userId);
      }

      // 3. Update skills
      if (filteredSkills.length > 0) {
        // First delete existing user skills
        await supabase.from("user_skills").delete().eq("user_id", userId);

        // For each skill, check if it exists, if not create it
        const skillsToInsert = [];
        for (const skillName of filteredSkills) {
          // Check if skill exists - using proper filter syntax for Supabase
          // Use ilike for case-insensitive matching instead of eq to avoid encoding issues with spaces
          let { data: existingSkill, error: skillCheckError } = await supabase
            .from("skills")
            .select("id")
            .ilike("name", skillName)
            .maybeSingle();

          // If skill doesn't exist, create it
          if (skillCheckError || !existingSkill) {
            console.log(`Creating new skill: ${skillName}`);
            const { data: newSkill, error: skillCreateError } = await supabase
              .from("skills")
              .insert({ name: skillName })
              .select("id")
              .maybeSingle();

            if (skillCreateError) {
              console.error(
                `Error creating skill ${skillName}:`,
                skillCreateError,
              );
              continue;
            }
            existingSkill = newSkill;
          }

          if (existingSkill && existingSkill.id) {
            // Add to skills to insert
            skillsToInsert.push({
              user_id: userId,
              skill_id: existingSkill.id,
            });
          }
        }

        // Insert user skills
        if (skillsToInsert.length > 0) {
          const { error: skillsError } = await supabase
            .from("user_skills")
            .insert(skillsToInsert);

          if (skillsError) {
            console.error("Error updating user skills:", skillsError);
          }
        }
      } else {
        // Delete all user skills if none provided
        await supabase.from("user_skills").delete().eq("user_id", userId);
      }

      console.log("Profile updated successfully");
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
