import React, { useState } from "react";
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
  X,
} from "lucide-react";

// Mock user profile data
const mockUserProfile = {
  id: "user123",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar: "user123",
  bio: "UX designer and feedback enthusiast. I love helping creators improve their projects through constructive feedback.",
  level: 5,
  points: 750,
  pointsToNextLevel: 350,
  joinedDate: "2023-01-15T10:30:00Z",
  location: "San Francisco, CA",
  website: "https://alexmorgan.design",
  socialLinks: {
    twitter: "alexmorgan_ux",
    github: "alexmorgan",
    linkedin: "alex-morgan-ux",
    instagram: "alex.design",
  },
  skills: ["UI/UX Design", "Web Development", "Mobile Apps", "Branding"],
  stats: {
    projectsCreated: 8,
    feedbackReceived: 48,
    feedbackGiven: 32,
    pointsEarned: 750,
  },
  achievements: [
    {
      id: "a1",
      title: "First Feedback",
      description: "Provided your first feedback",
      icon: "MessageSquare",
      date: "2023-01-20T14:30:00Z",
      color: "teal",
    },
    {
      id: "a2",
      title: "Top Reviewer",
      description: "Received 10+ upvotes on your feedback",
      icon: "ThumbsUp",
      date: "2023-02-15T09:45:00Z",
      color: "cyan",
    },
    {
      id: "a3",
      title: "7-Day Streak",
      description: "Provided feedback for 7 consecutive days",
      icon: "Flame",
      date: "2023-03-10T11:20:00Z",
      color: "amber",
    },
    {
      id: "a4",
      title: "Helpful Pro",
      description: "Received 'helpful' badges on 5+ feedback items",
      icon: "Heart",
      date: "2023-04-05T16:15:00Z",
      color: "rose",
    },
  ],
  recentActivity: [
    {
      id: "act1",
      type: "feedback_given",
      project: "E-commerce Website Redesign",
      date: "2023-06-15T10:30:00Z",
      points: 25,
    },
    {
      id: "act2",
      type: "achievement_earned",
      achievement: "Top Reviewer",
      date: "2023-06-10T14:45:00Z",
      points: 50,
    },
    {
      id: "act3",
      type: "project_created",
      project: "Mobile App UX",
      date: "2023-06-05T09:15:00Z",
      points: 0,
    },
    {
      id: "act4",
      type: "feedback_received",
      project: "SaaS Dashboard Layout",
      date: "2023-06-01T16:30:00Z",
      points: 0,
    },
  ],
};

// Get icon component based on name
const getIconComponent = (iconName, className = "h-5 w-5") => {
  const icons = {
    MessageSquare: <MessageSquare className={className} />,
    ThumbsUp: <ThumbsUp className={className} />,
    Flame: <Flame className={className} />,
    Heart: <Heart className={className} />,
    Trophy: <Trophy className={className} />,
    Medal: <Medal className={className} />,
    Star: <Star className={className} />,
    Award: <Award className={className} />,
  };

  return icons[iconName] || <Star className={className} />;
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(mockUserProfile);

  // Form state
  const [formData, setFormData] = useState({
    name: mockUserProfile.name,
    bio: mockUserProfile.bio,
    location: mockUserProfile.location,
    website: mockUserProfile.website,
    twitter: mockUserProfile.socialLinks.twitter,
    github: mockUserProfile.socialLinks.github,
    linkedin: mockUserProfile.socialLinks.linkedin,
    instagram: mockUserProfile.socialLinks.instagram,
    skills: mockUserProfile.skills.join(", "),
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    // In a real app, save to database
    const updatedProfile = {
      ...profileData,
      name: formData.name,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      socialLinks: {
        twitter: formData.twitter,
        github: formData.github,
        linkedin: formData.linkedin,
        instagram: formData.instagram,
      },
      skills: formData.skills.split(",").map((skill) => skill.trim()),
    };

    setProfileData(updatedProfile);
    setIsEditing(false);
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="h-48 w-full rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 overflow-hidden">
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() => setIsEditing(!isEditing)}
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

        {/* Profile Info */}
        <div className="absolute -bottom-16 left-8 flex items-end">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-75" />
            <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 relative">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.avatar}`}
                alt={profileData.name}
              />
              <AvatarFallback>{profileData.name[0]}</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full bg-white dark:bg-slate-800 h-8 w-8"
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mb-4 ml-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profileData.name}
            </h1>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                Level {profileData.level}
              </Badge>
              <span className="text-sm">{profileData.points} points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="space-y-6">
          {/* Profile Details */}
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
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Skills (comma separated)
                    </label>
                    <Input
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {profileData.name}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-500 mt-1" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {profileData.bio}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {profileData.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {profileData.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Skills
                    </h4>
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Links */}
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
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
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
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
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
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
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
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        className="rounded-l-none border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <a
                    href={`https://twitter.com/${profileData.socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">
                      @{profileData.socialLinks.twitter}
                    </span>
                  </a>

                  <a
                    href={`https://github.com/${profileData.socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">
                      @{profileData.socialLinks.github}
                    </span>
                  </a>

                  <a
                    href={`https://linkedin.com/in/${profileData.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">
                      @{profileData.socialLinks.linkedin}
                    </span>
                  </a>

                  <a
                    href={`https://instagram.com/${profileData.socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400"
                  >
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm">
                      @{profileData.socialLinks.instagram}
                    </span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card className="bg-white dark:bg-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Projects Created
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData.stats.projectsCreated}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Feedback Received
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData.stats.feedbackReceived}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Feedback Given
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData.stats.feedbackGiven}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Points Earned
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {profileData.stats.pointsEarned}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Level {profileData.level}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Level {profileData.level + 1}
                  </span>
                </div>
                <Progress
                  value={
                    (profileData.points /
                      (profileData.points + profileData.pointsToNextLevel)) *
                    100
                  }
                  className="h-2 bg-slate-200 dark:bg-slate-700"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {profileData.points} points
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {profileData.pointsToNextLevel} to next level
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Achievements & Activity */}
        <div className="space-y-6">
          {/* Achievements */}
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
              <div className="grid grid-cols-2 gap-4">
                {profileData.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-${achievement.color}-100 dark:bg-${achievement.color}-900/30`}
                    >
                      {getIconComponent(
                        achievement.icon,
                        "h-5 w-5 text-" + achievement.color + "-500",
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
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
              <div className="space-y-4">
                {profileData.recentActivity.map((activity) => {
                  const date = new Date(activity.date);
                  const formattedDate = new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(date);

                  let icon, title, description;

                  switch (activity.type) {
                    case "feedback_given":
                      icon = (
                        <MessageSquare className="h-4 w-4 text-teal-500" />
                      );
                      title = "Gave feedback";
                      description = `You provided feedback on "${activity.project}"`;
                      break;
                    case "achievement_earned":
                      icon = <Award className="h-4 w-4 text-amber-500" />;
                      title = "Achievement earned";
                      description = `You earned the "${activity.achievement}" badge`;
                      break;
                    case "project_created":
                      icon = <Edit className="h-4 w-4 text-indigo-500" />;
                      title = "Created project";
                      description = `You created "${activity.project}"`;
                      break;
                    case "feedback_received":
                      icon = (
                        <MessageSquare className="h-4 w-4 text-cyan-500" />
                      );
                      title = "Received feedback";
                      description = `You received feedback on "${activity.project}"`;
                      break;
                    default:
                      icon = <Star className="h-4 w-4 text-slate-500" />;
                      title = "Activity";
                      description = "You did something";
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings & Security */}
        <div className="space-y-6">
          {/* Account Settings */}
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

          {/* Membership */}
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

          {/* Danger Zone */}
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
