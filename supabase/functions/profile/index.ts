import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

interface ProfileUpdateData {
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

// For debugging purposes
const logDebug = (message: string, data?: any) => {
  console.log(
    `[PROFILE FUNCTION] ${message}`,
    data ? JSON.stringify(data) : "",
  );
};

interface ProfileResponse {
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

// Define CORS headers to be used in all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No content status is more appropriate for OPTIONS
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    logDebug("Function started with URL and key", {
      urlExists: !!supabaseUrl,
      keyExists: !!supabaseKey,
    });

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Create authenticated client
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Handle different HTTP methods
    if (req.method === "GET") {
      // Initialize default response structure
      const response: ProfileResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email || "",
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

      // Get user profile data
      try {
        const { data, error } = await supabaseAuth
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("User data error:", error);
          // User record doesn't exist, create it
          try {
            const { data: newUser, error: insertError } = await supabaseAuth
              .from("users")
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email || "",
                level: 1,
                points: 0,
                points_to_next_level: 100,
              })
              .select("*")
              .single();

            if (insertError) {
              console.error("Error creating user profile:", insertError);
              // Keep default user data
            } else if (newUser) {
              response.user = newUser;
            }
          } catch (insertErr) {
            console.error("Exception creating user profile:", insertErr);
            // Keep default user data
          }
        } else if (data) {
          response.user = data;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Keep default user data
      }

      // Get social links
      try {
        const { data: links, error: socialLinksError } = await supabaseAuth
          .from("social_links")
          .select("*")
          .eq("user_id", user.id);

        if (!socialLinksError && links) {
          response.socialLinks = links;
        }
      } catch (error) {
        console.error("Error fetching social links:", error);
        // Keep default empty social links
      }

      // Get skills
      try {
        const { data: userSkills, error: userSkillsError } = await supabaseAuth
          .from("user_skills")
          .select("skills(name)")
          .eq("user_id", user.id);

        if (!userSkillsError && userSkills) {
          const skillNames = userSkills
            .map((item) => item.skills?.name)
            .filter(Boolean);
          if (skillNames && skillNames.length > 0) {
            response.skills = skillNames;
          }
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        // Keep default empty skills
      }

      // Get achievements
      try {
        const { data: achievements, error: userAchievementsError } =
          await supabaseAuth
            .from("user_achievements")
            .select(
              "achievement_id, earned_at, achievements(title, description, icon, color, points_reward)",
            )
            .eq("user_id", user.id);

        if (!userAchievementsError && achievements) {
          response.achievements = achievements;
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
        // Keep default empty achievements
      }

      // Get activity
      try {
        const { data: activity, error: userActivityError } = await supabaseAuth
          .from("user_activity")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!userActivityError && activity) {
          response.activity = activity;
        }
      } catch (error) {
        console.error("Error fetching user activity:", error);
        // Keep default empty activity
      }

      // Get stats
      response.stats.pointsEarned = response.user?.points || 0;

      // Count project creations
      try {
        const { count: projectCount, error: projectCountError } =
          await supabaseAuth
            .from("user_activity")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("activity_type", "project_created");

        if (!projectCountError && projectCount !== null) {
          response.stats.projectsCreated = projectCount;
        }
      } catch (error) {
        console.error("Error counting projects:", error);
        // Keep default project count
      }

      // Count feedback received
      try {
        const { count: feedbackReceivedCount, error: feedbackReceivedError } =
          await supabaseAuth
            .from("user_activity")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("activity_type", "feedback_received");

        if (!feedbackReceivedError && feedbackReceivedCount !== null) {
          response.stats.feedbackReceived = feedbackReceivedCount;
        }
      } catch (error) {
        console.error("Error counting feedback received:", error);
        // Keep default feedback received count
      }

      // Count feedback given
      try {
        const { count: feedbackGivenCount, error: feedbackGivenError } =
          await supabaseAuth
            .from("user_activity")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("activity_type", "feedback_given");

        if (!feedbackGivenError && feedbackGivenCount !== null) {
          response.stats.feedbackGiven = feedbackGivenCount;
        }
      } catch (error) {
        console.error("Error counting feedback given:", error);
        // Keep default feedback given count
      }

      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else if (req.method === "POST") {
      try {
        // Update user profile
        const data: ProfileUpdateData = await req.json();
        logDebug("Received profile update data", data);

        const updates: any = {};

        // Update basic profile info
        if (data.name !== undefined) updates.full_name = data.name;
        if (data.bio !== undefined) updates.bio = data.bio;
        if (data.location !== undefined) updates.location = data.location;
        if (data.website !== undefined) updates.website = data.website;

        logDebug("Prepared updates object", updates);

        // Check if user exists first
        try {
          logDebug("Checking if user exists", { userId: user.id });
          const { data: existingUser, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single();

          if (checkError) {
            logDebug("User does not exist, creating new user", {
              error: checkError.message,
            });
            // User doesn't exist, create it first
            try {
              const { error: insertError } = await supabase
                .from("users")
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name:
                    data.name ||
                    user.user_metadata?.full_name ||
                    user.email ||
                    "",
                  bio: data.bio || "",
                  location: data.location || "",
                  website: data.website || "",
                  level: 1,
                  points: 0,
                  points_to_next_level: 100,
                });

              if (insertError) {
                logDebug("Error creating user during update", {
                  error: insertError.message,
                });
              } else {
                logDebug("Successfully created new user");
              }
            } catch (insertErr) {
              console.error(
                "Exception creating user during update:",
                insertErr,
              );
            }
          } else if (Object.keys(updates).length > 0) {
            // User exists, update it
            logDebug("User exists, updating profile", { updates });
            try {
              const { error: updateError } = await supabase
                .from("users")
                .update(updates)
                .eq("id", user.id);

              if (updateError) {
                logDebug("Error updating user", { error: updateError.message });
              } else {
                logDebug("Successfully updated user profile");
              }
            } catch (updateErr) {
              console.error("Exception updating user:", updateErr);
            }
          }
        } catch (checkErr) {
          console.error("Exception checking if user exists:", checkErr);
        }
      } catch (error) {
        console.error("Error in profile update:", error);
      }

      // Update social links
      try {
        if (data.socialLinks && data.socialLinks.length > 0) {
          logDebug("Processing social links", { links: data.socialLinks });
          // First delete existing links
          try {
            const { error: deleteError } = await supabase
              .from("social_links")
              .delete()
              .eq("user_id", user.id);

            if (deleteError) {
              logDebug("Error deleting existing social links", {
                error: deleteError.message,
              });
            } else {
              logDebug("Successfully deleted existing social links");
            }
          } catch (error) {
            console.error("Error deleting social links:", error);
            // Continue anyway
          }

          // Filter out empty usernames
          const validSocialLinks = data.socialLinks.filter(
            (link) => link.username && link.username.trim() !== "",
          );

          if (validSocialLinks.length > 0) {
            // Then insert new ones
            const socialLinksToInsert = validSocialLinks.map((link) => ({
              user_id: user.id,
              platform: link.platform,
              username: link.username,
            }));

            logDebug("Inserting new social links", {
              links: socialLinksToInsert,
            });

            try {
              const { error: socialLinksError } = await supabase
                .from("social_links")
                .insert(socialLinksToInsert);

              if (socialLinksError) {
                console.error(
                  "Error inserting social links:",
                  socialLinksError,
                );
              }
            } catch (insertErr) {
              console.error("Exception inserting social links:", insertErr);
            }
          }
        }
      } catch (error) {
        console.error("Error handling social links:", error);
        // Continue with the rest of the updates
      }

      // Update skills
      try {
        if (data.skills && data.skills.length > 0) {
          logDebug("Processing skills", { skills: data.skills });
          // First delete existing user skills
          try {
            const { error: deleteSkillsError } = await supabase
              .from("user_skills")
              .delete()
              .eq("user_id", user.id);

            if (deleteSkillsError) {
              logDebug("Error deleting existing skills", {
                error: deleteSkillsError.message,
              });
            } else {
              logDebug("Successfully deleted existing skills");
            }
          } catch (error) {
            console.error("Error deleting user skills:", error);
            // Continue anyway
          }

          // Filter out empty skills and log them for debugging
          const validSkills = data.skills.filter(
            (skill) => skill && skill.trim() !== "",
          );

          logDebug("Valid skills after filtering", { validSkills });

          if (validSkills.length > 0) {
            // For each skill, check if it exists, if not create it
            const skillsToInsert = [];
            for (const skillName of validSkills) {
              try {
                // Check if skill exists
                logDebug("Checking if skill exists", { skillName });
                let { data: existingSkill, error: skillCheckError } =
                  await supabase
                    .from("skills")
                    .select("id")
                    .eq("name", skillName)
                    .single();

                // If skill doesn't exist, create it
                if (skillCheckError || !existingSkill) {
                  try {
                    logDebug("Creating new skill", { skillName });
                    const { data: newSkill, error: skillCreateError } =
                      await supabase
                        .from("skills")
                        .insert({ name: skillName })
                        .select("id")
                        .single();

                    if (skillCreateError) {
                      console.error(
                        `Error creating skill ${skillName}:`,
                        skillCreateError,
                      );
                      continue;
                    }
                    existingSkill = newSkill;
                  } catch (createErr) {
                    console.error(
                      `Exception creating skill ${skillName}:`,
                      createErr,
                    );
                    continue;
                  }
                }

                if (existingSkill && existingSkill.id) {
                  // Add to skills to insert
                  skillsToInsert.push({
                    user_id: user.id,
                    skill_id: existingSkill.id,
                  });
                }
              } catch (error) {
                console.error(`Error processing skill ${skillName}:`, error);
              }
            }

            // Insert user skills
            if (skillsToInsert.length > 0) {
              try {
                logDebug("Inserting user skills", { skillsToInsert });
                const { error: skillsError } = await supabase
                  .from("user_skills")
                  .insert(skillsToInsert);

                if (skillsError) {
                  console.error("Error inserting user skills:", skillsError);
                }
              } catch (insertErr) {
                console.error("Exception inserting user skills:", insertErr);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error handling skills:", error);
        // Continue with the rest of the updates
      }

      logDebug("Profile update completed successfully");
      // Return a simplified success response
      return new Response(JSON.stringify({ success: true }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Unhandled error in profile edge function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});
