import React, { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "../../../supabase/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/supabase/auth";
import {
  profileService,
  ProfileResponse,
  ProfileUpdateData,
} from "@/services/profile";
import {
  Award,
  Camera,
  Check,
  Edit,
  ExternalLink,
  Flame,
  Github,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Lock,
  Loader2,
  Mail,
  Medal,
  MessageSquare,
  Save,
  Settings,
  Star,
  ThumbsUp,
  Trophy,
  Twitter,
  User,
  Users,
  X,
} from "lucide-react";

const getIconComponent = (iconName: string, className = "h-5 w-5") => {
  const icons: Record<string, React.ReactNode> = {
    MessageSquare: <MessageSquare className={className} />,
    ThumbsUp: <ThumbsUp className={className} />,
    Flame: <Flame className={className} />,
    Heart: <Heart className={className} />,
    Trophy: <Trophy className={className} />,
    Medal: <Medal className={className} />,
    Star: <Star className={className} />,
    Award: <Award className={className} />,
    Users: <Users className={className} />,
  };

  return icons[iconName] || <Star className={className} />;
};

const Profile = () => {
  // Function to handle image uploads
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const bucketName = type === "avatar" ? "avatars" : "banners";

      try {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2,
        });
      } catch (bucketError) {
        console.log(`Bucket ${bucketName} might already exist:`, bucketError);
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (type === "avatar") {
        setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      } else {
        setFormData((prev) => ({ ...prev, banner_url: urlData.publicUrl }));
      }

      await profileService.updateProfile({
        ...formData,
        [type === "avatar" ? "avatar_url" : "banner_url"]: urlData.publicUrl,
      });

      const updatedProfile = await profileService.getProfile();
      setProfileData(updatedProfile);

      toast({
        title: "Success",
        description: `Your ${type} has been updated.`,
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingPoints, setIsSyncingPoints] = useState(false);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);

  const [formData, setFormData] = useState<
    ProfileUpdateData & { _skillsInput?: string }
  >({
    name: "",
    bio: "",
    location: "",
    website: "",
    skills: [],
    _skillsInput: "",
    avatar_url: "",
    banner_url: "",
    socialLinks: [
      { platform: "twitter", username: "" },
      { platform: "github", username: "" },
      { platform: "linkedin", username: "" },
      { platform: "instagram", username: "" },
    ],
  });

  const debugCheckUserActivity = async () => {
    if (!user) return;

    try {
      console.log("Directly checking user_activity table for user:", user.id);
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error directly querying user_activity:", error);
      } else {
        console.log(`Found ${data?.length || 0} activity records:`, data);
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points, level, points_to_next_level")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("Error querying user data:", userError);
      } else {
        console.log("Current user data in database:", userData);
      }
    } catch (e) {
      console.error("Exception in direct user_activity check:", e);
    }
  };

  const syncUserPoints = async () => {
    if (!user) return;

    try {
      setIsSyncingPoints(true);
      toast({
        title: "Synchronizing Points",
        description: "Please wait while we update your points...",
      });

      const { data: activityData, error: activityError } = await supabase
        .from("user_activity")
        .select("points")
        .eq("user_id", user.id);

      if (activityError) {
        throw new Error(
          `Error fetching activity data: ${activityError.message}`,
        );
      }

      const totalPoints = activityData.reduce(
        (sum, activity) => sum + (activity.points || 0),
        0,
      );

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single();

      if (userError) {
        throw new Error(`Error fetching user data: ${userError.message}`);
      }

      if (totalPoints !== userData.points) {
        console.log(
          `Updating user ${user.id} points from ${userData.points} to ${totalPoints}`,
        );

        const { error: updateError } = await supabase
          .from("users")
          .update({ points: totalPoints })
          .eq("id", user.id);

        if (updateError) {
          throw new Error(`Error updating user points: ${updateError.message}`);
        }

        toast({
          title: "Points Synchronized",
          description: `Your points have been updated from ${userData.points} to ${totalPoints}.`,
        });
      } else {
        toast({
          title: "Points Already Synchronized",
          description: "Your points are already up to date.",
        });
      }

      await fetchProfileData();
    } catch (error) {
      console.error("Error synchronizing points:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to synchronize points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingPoints(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getProfile();

      const validData = {
        user: data?.user || {
          full_name: user?.email || "",
          email: user?.email || "",
          level: 1,
          points: 0,
          points_to_next_level: 100,
        },
        socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : [],
        skills: Array.isArray(data?.skills) ? data.skills : [],
        achievements: Array.isArray(data?.achievements)
          ? data.achievements
          : [],
        activity: Array.isArray(data?.activity) ? data.activity : [],
        stats: data?.stats || {
          projectsCreated: 0,
          feedbackReceived: 0,
          feedbackGiven: 0,
          pointsEarned: 0,
        },
      };

      console.log("Setting profile data:", validData);
      console.log("Stats:", validData.stats);
      console.log("Activity:", validData.activity);

      if (
        user &&
        Array.isArray(validData.activity) &&
        validData.activity.length > 0
      ) {
        try {
          const calculatedPoints = validData.activity.reduce(
            (sum, activity) => sum + (activity.points || 0),
            0,
          );

          if (calculatedPoints !== validData.user.points) {
            console.log(
              `[Profile] Points mismatch detected. User record: ${validData.user.points}, Calculated: ${calculatedPoints}`,
            );

            const { error: updateError } = await supabase
              .from("users")
              .update({ points: calculatedPoints })
              .eq("id", user.id);

            if (updateError) {
              console.error(
                "[Profile] Error updating user points:",
                updateError,
              );
            } else {
              console.log(
                `[Profile] Updated user points to ${calculatedPoints}`,
              );
              validData.user.points = calculatedPoints;
            }
          }
        } catch (pointsError) {
          console.error(
            "[Profile] Error calculating total points:",
            pointsError,
          );
        }
      }

      setProfileData(validData);

      const skills = validData.skills || [];
      setFormData({
        name: validData.user.full_name || "",
        bio: validData.user.bio || "",
        location: validData.user.location || "",
        website: validData.user.website || "",
        skills: skills,
        _skillsInput: skills.join(", "),
        avatar_url: validData.user.avatar_url || "",
        banner_url: validData.user.banner_url || "",
        socialLinks:
          validData.socialLinks.length > 0
            ? validData.socialLinks.map((link: any) => ({
                platform: link.platform,
                username: link.username,
              }))
            : [
                { platform: "twitter", username: "" },
                { platform: "github", username: "" },
                { platform: "linkedin", username: "" },
                { platform: "instagram", username: "" },
              ],
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Using default values.",
        variant: "destructive",
      });

      const defaultData = {
        user: {
          full_name: user?.email || "",
          email: user?.email || "",
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

      setProfileData(defaultData);

      setFormData({
        name: defaultData.user.full_name || "",
        bio: "",
        location: "",
        website: "",
        skills: [],
        _skillsInput: "",
        avatar_url: "",
        banner_url: "",
        socialLinks: [
          { platform: "twitter", username: "" },
          { platform: "github", username: "" },
          { platform: "linkedin", username: "" },
          { platform: "instagram", username: "" },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
      debugCheckUserActivity();
    } else {
      setIsLoading(false);
    }
  }, [user, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks?.map((link) =>
        link.platform === platform ? { ...link, username: value } : link,
      ),
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills,
      _skillsInput: inputValue,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      console.log("Form data before save:", formData);

      const filteredSocialLinks =
        formData.socialLinks?.filter(
          (link) => link.username && link.username.trim() !== "",
        ) || [];

      let processedSkills = formData.skills || [];

      if (formData._skillsInput !== undefined) {
        processedSkills = formData._skillsInput
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "");
      }

      const filteredSkills =
        processedSkills.filter((skill) => skill && skill.trim() !== "") || [];

      console.log("Filtered skills before update:", filteredSkills);

      const updateData = {
        ...formData,
        socialLinks: filteredSocialLinks,
        skills: filteredSkills,
      };

      await profileService.updateProfile(updateData);

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedProfile = await profileService.getProfile();
        console.log("Refreshed profile data from Supabase:", updatedProfile);

        const validData = {
          user: updatedProfile?.user || {
            ...profileData.user,
            full_name: updateData.name || profileData.user.full_name || "",
            bio: updateData.bio || profileData.user.bio || "",
            location: updateData.location || profileData.user.location || "",
            website: updateData.website || profileData.user.website || "",
          },
          socialLinks: Array.isArray(updatedProfile?.socialLinks)
            ? updatedProfile.socialLinks
            : Array.isArray(filteredSocialLinks)
              ? filteredSocialLinks
              : [],
          skills: Array.isArray(updatedProfile?.skills)
            ? updatedProfile.skills
            : Array.isArray(updateData.skills)
              ? updateData.skills
              : [],
          achievements: Array.isArray(updatedProfile?.achievements)
            ? updatedProfile.achievements
            : Array.isArray(profileData.achievements)
              ? profileData.achievements
              : [],
          activity: Array.isArray(updatedProfile?.activity)
            ? updatedProfile.activity
            : Array.isArray(profileData.activity)
              ? profileData.activity
              : [],
          stats: updatedProfile?.stats ||
            profileData.stats || {
              projectsCreated: 0,
              feedbackReceived: 0,
              feedbackGiven: 0,
              pointsEarned: 0,
            },
        };

        console.log("Setting profile data to:", validData);
        setProfileData(validData);
      } catch (refreshError) {
        console.error("Error refreshing profile data:", refreshError);
        const fallbackData = {
          ...profileData,
          user: {
            ...profileData.user,
            full_name: updateData.name || profileData.user.full_name || "",
            bio: updateData.bio || profileData.user.bio || "",
            location: updateData.location || profileData.user.location || "",
            website: updateData.website || profileData.user.website || "",
          },
          skills: updateData.skills || profileData.skills || [],
          socialLinks: filteredSocialLinks || profileData.socialLinks || [],
        };

        console.log("Setting fallback profile data to:", fallbackData);
        setProfileData(fallbackData);
      }

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Your profile has been updated in Supabase.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile in Supabase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-8">
        <div className="h-48 w-full rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 overflow-hidden relative">
          {profileData.user.banner_url && (
            <img
              src={profileData.user.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm hover:bg-white"
                onClick={() =>
                  document.getElementById("banner-upload")?.click()
                }
              >
                <Camera className="h-4 w-4 mr-2" /> Change Banner
              </Button>
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "banner")}
              />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="absolute -bottom-16 left-8 flex items-end">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-75" />
            <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 relative">
              <AvatarImage
                src={
                  profileData.user.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                }
                alt={profileData.user.full_name || user?.email || ""}
              />
              <AvatarFallback>
                {(
                  profileData.user.full_name?.[0] ||
                  user?.email?.[0] ||
                  ""
                ).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full bg-white dark:bg-slate-800 h-8 w-8"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, "avatar")}
            />
          </div>
          <div className="mb-4 ml-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profileData.user.full_name || user?.email || ""}
            </h1>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                Level {profileData.user.level || 1}
              </Badge>
              <span className="text-sm">
                {profileData.user.points || 0} points
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Name
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bio
                    </label>
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      className="border-slate-200 dark:border-slate-700 min-h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Location
                    </label>
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Website
                    </label>
                    <Input
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Skills (comma separated)
                    </label>
                    <Input
                      name="skills"
                      value={
                        formData._skillsInput || formData.skills?.join(", ")
                      }
                      onChange={handleSkillsChange}
                      placeholder="Web Design, UI/UX, React Development"
                      className="border-slate-200 dark:border-slate-700"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Separate skills with commas. Spaces within skills are
                      allowed (e.g., "Web Design, UI/UX").
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {profileData.user.full_name || user?.email || ""}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500 mt-1" />
                    {profileData.user.bio ? (
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {profileData.user.bio}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500 italic">
                        No bio added yet. Click "Edit Profile" to add your bio.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    {profileData.user.location ? (
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {profileData.user.location}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500 italic">
                        No location added yet. Click "Edit Profile" to add your
                        location.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                    {profileData.user.website ? (
                      <a
                        href={
                          profileData.user.website.startsWith("http")
                            ? profileData.user.website
                            : `https://${profileData.user.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        {profileData.user.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500 italic">
                        No website added yet. Click "Edit Profile" to add your
                        website.
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Skills
                    </h4>
                    {profileData?.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        No skills added yet. Click "Edit Profile" to add your
                        skills.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Twitter
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                        @
                      </span>
                      <Input
                        value={
                          formData.socialLinks?.find(
                            (link) => link.platform === "twitter",
                          )?.username || ""
                        }
                        onChange={(e) =>
                          handleSocialLinkChange("twitter", e.target.value)
                        }
                        className="rounded-l-none border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      GitHub
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                        @
                      </span>
                      <Input
                        value={
                          formData.socialLinks?.find(
                            (link) => link.platform === "github",
                          )?.username || ""
                        }
                        onChange={(e) =>
                          handleSocialLinkChange("github", e.target.value)
                        }
                        className="rounded-l-none border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      LinkedIn
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                        @
                      </span>
                      <Input
                        value={
                          formData.socialLinks?.find(
                            (link) => link.platform === "linkedin",
                          )?.username || ""
                        }
                        onChange={(e) =>
                          handleSocialLinkChange("linkedin", e.target.value)
                        }
                        className="rounded-l-none border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Instagram
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                        @
                      </span>
                      <Input
                        value={
                          formData.socialLinks?.find(
                            (link) => link.platform === "instagram",
                          )?.username || ""
                        }
                        onChange={(e) =>
                          handleSocialLinkChange("instagram", e.target.value)
                        }
                        className="rounded-l-none border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profileData.socialLinks &&
                    profileData.socialLinks.some(
                      (link) => link.platform === "twitter" && link.username,
                    ) && (
                      <a
                        href={`https://twitter.com/${profileData.socialLinks.find((link) => link.platform === "twitter")?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                      >
                        <Twitter className="h-4 w-4" />
                        <span className="text-sm">
                          @
                          {
                            profileData.socialLinks.find(
                              (link) => link.platform === "twitter",
                            )?.username
                          }
                        </span>
                      </a>
                    )}

                  {profileData.socialLinks &&
                    profileData.socialLinks.some(
                      (link) => link.platform === "github" && link.username,
                    ) && (
                      <a
                        href={`https://github.com/${profileData.socialLinks.find((link) => link.platform === "github")?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                      >
                        <Github className="h-4 w-4" />
                        <span className="text-sm">
                          @
                          {
                            profileData.socialLinks.find(
                              (link) => link.platform === "github",
                            )?.username
                          }
                        </span>
                      </a>
                    )}

                  {profileData.socialLinks &&
                    profileData.socialLinks.some(
                      (link) => link.platform === "linkedin" && link.username,
                    ) && (
                      <a
                        href={`https://linkedin.com/in/${profileData.socialLinks.find((link) => link.platform === "linkedin")?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="text-sm">
                          @
                          {
                            profileData.socialLinks.find(
                              (link) => link.platform === "linkedin",
                            )?.username
                          }
                        </span>
                      </a>
                    )}

                  {profileData.socialLinks &&
                    profileData.socialLinks.some(
                      (link) => link.platform === "instagram" && link.username,
                    ) && (
                      <a
                        href={`https://instagram.com/${profileData.socialLinks.find((link) => link.platform === "instagram")?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                      >
                        <Instagram className="h-4 w-4" />
                        <span className="text-sm">
                          @
                          {
                            profileData.socialLinks.find(
                              (link) => link.platform === "instagram",
                            )?.username
                          }
                        </span>
                      </a>
                    )}

                  {(!profileData.socialLinks ||
                    profileData.socialLinks.length === 0) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      No social links added yet. Click "Edit Profile" to add
                      some.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Account Stats
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncUserPoints}
                  disabled={isSyncingPoints}
                  className="text-xs"
                >
                  {isSyncingPoints ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Loader2 className="h-3 w-3 mr-1" />
                  )}
                  Sync Points
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Projects Created
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData?.stats?.projectsCreated || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Feedback Received
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData?.stats?.feedbackReceived || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Feedback Given
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData?.stats?.feedbackGiven || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Points Earned
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData?.stats?.pointsEarned || 0}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Level {profileData.user.level || 1}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Level {(profileData.user.level || 1) + 1}
                  </span>
                </div>
                <Progress
                  value={profileService.calculateLevelProgress(
                    profileData?.user?.points || 0,
                    profileData?.user?.points_to_next_level || 100,
                  )}
                  className="h-2 bg-slate-200 dark:bg-slate-700"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {profileData?.user?.points || 0} points
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {profileData?.user?.points_to_next_level || 100} to next
                    level
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Achievements
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Badges and rewards you've earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(profileData?.achievements) &&
              profileData.achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {profileData.achievements.map((achievement) => (
                    <div
                      key={achievement.achievement_id}
                      className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-${achievement.achievements.color}-100 dark:bg-${achievement.achievements.color}-900/30`}
                      >
                        {getIconComponent(
                          achievement.achievements.icon,
                          `h-5 w-5 text-${achievement.achievements.color}-500`,
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                        {achievement.achievements.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                        {achievement.achievements.description}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Star className="h-3 w-3" />
                        <span>
                          +{achievement.achievements.points_reward} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No achievements yet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Start participating in the community by giving feedback and
                    creating projects to earn achievements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Your latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(profileData?.activity) &&
              profileData.activity.length > 0 ? (
                <div className="space-y-4">
                  {profileData.activity.map((activity) => {
                    const formattedDate = profileService.formatDate(
                      activity.created_at,
                    );
                    let icon, title, description;

                    switch (activity.activity_type) {
                      case "feedback_given":
                        icon = (
                          <MessageSquare className="h-4 w-4 text-teal-500" />
                        );
                        title = "Gave feedback";
                        description = activity.description;
                        break;
                      case "achievement_earned":
                        icon = <Award className="h-4 w-4 text-amber-500" />;
                        title = "Achievement earned";
                        description = activity.description;
                        break;
                      case "project_created":
                        icon = <Edit className="h-4 w-4 text-indigo-500" />;
                        title = "Created project";
                        description =
                          activity.description || "Created a new project";
                        break;
                      case "project_updated":
                        icon = <Edit className="h-4 w-4 text-blue-500" />;
                        title = "Updated project";
                        description = activity.description;
                        break;
                      case "project_promotion":
                        icon = <Star className="h-4 w-4 text-amber-500" />;
                        title = "Promoted project";
                        description = activity.description;
                        break;
                      case "feedback_received":
                        icon = (
                          <MessageSquare className="h-4 w-4 text-cyan-500" />
                        );
                        title = "Received feedback";
                        description = activity.description;
                        break;
                      case "level_up":
                        icon = <Trophy className="h-4 w-4 text-emerald-500" />;
                        title = "Level up";
                        description = activity.description;
                        break;
                      default:
                        icon = <Star className="h-4 w-4 text-slate-500" />;
                        title = "Activity";
                        description =
                          activity.description || "Performed an action";
                    }

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                      >
                        <div className="mt-1">{icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              {title}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formattedDate}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {description}
                          </p>
                          {activity.points > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                              <Star className="h-3 w-3" />
                              <span>+{activity.points} points</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                    No activity yet
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Your recent actions will appear here. Start by creating a
                    project or giving feedback.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      Email Notifications
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive updates about your projects
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Configure
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-slate-500" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      Password & Security
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage your password and 2FA
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Update
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-slate-500" />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      Preferences
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Customize your experience
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">Free Plan</h3>
                    <p className="text-teal-100 text-sm mt-1">
                      Current membership
                    </p>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white">
                    Active
                  </Badge>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                  Free Plan Includes:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span>Up to 3 active projects</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span>Basic feedback tools</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className="h-4 w-4 text-teal-500" />
                    <span>Community support</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 shadow-sm border-red-100 dark:border-red-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                These actions are permanent and cannot be undone.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Delete All Projects
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
