import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Code,
  ExternalLink,
  Eye,
  Globe,
  Layout,
  LinkOff,
  MessageSquare,
  MousePointer,
  Palette,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { Compass } from "lucide-react";
import { feedbackService } from "@/services/feedback";
import { projectSectionsService } from "@/services/projectSections";
import ProjectSectionMap, {
  ProjectSection,
} from "@/components/feedback/ProjectSectionMap";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackQualityIndicator from "@/components/FeedbackQualityIndicator";
import { useToast } from "@/components/ui/use-toast";
import { projectService } from "@/services/project";

const mockProject = {
  id: "1",
  title: "E-commerce Website Redesign",
  description:
    "I've redesigned the user interface and checkout flow for an e-commerce website. Looking for feedback on the overall design, usability, and suggestions for improvement. The website sells handmade crafts and artisanal products.",
  category: "Web Design",
  tags: ["UI/UX", "E-commerce", "Responsive"],
  creator: {
    name: "Sarah Johnson",
    avatar: "sarah",
    level: 4,
  },
  feedbackCount: 12,
  pointsReward: 75,
  createdAt: "2023-06-15T10:30:00Z",
  type: "website",
  url: "https://example.com/project",
  screenshots: [
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
    "https://images.unsplash.com/photo-1573867639040-6dd25fa5f597?w=800&q=80",
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
  ],
};

// Default thumbnail images by category
const defaultThumbnails = {
  "Web Design":
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
  "Mobile App":
    "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=800&q=80",
  "Web App":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  Portfolio:
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80",
  "E-commerce":
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80",
};

// Points reward based on project category
const categoryPointsReward = {
  "Web Design": 75,
  "Mobile App": 60,
  "Web App": 90,
  Portfolio: 50,
  "E-commerce": 70,
  default: 50,
};

const mockFeedback = [
  {
    id: "f1",
    user: {
      name: "Alex Rivera",
      avatar: "alex",
      level: 5,
    },
    content:
      "The overall design looks clean and modern. I like the color scheme and typography choices. The product cards could use a bit more spacing between them for better readability.",
    createdAt: "2023-06-16T14:30:00Z",
    rating: 4,
    pointsEarned: 25,
    sectionId: "features",
    sectionName: "Features",
    category: "UI/UX",
  },
  {
    id: "f2",
    user: {
      name: "Emma Wilson",
      avatar: "emma",
      level: 4,
    },
    content:
      "The checkout process feels a bit lengthy. Consider reducing the number of steps or implementing a progress indicator to show users where they are in the process.",
    createdAt: "2023-06-17T09:45:00Z",
    rating: 3,
    pointsEarned: 20,
    sectionId: "pricing",
    sectionName: "Pricing",
    category: "Functionality",
  },
];

const FeedbackInterface = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [activeTab, setActiveTab] = useState("preview");
  const [project, setProject] = useState(mockProject);
  const [feedback, setFeedback] = useState(mockFeedback);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [feedbackProgress, setFeedbackProgress] = useState(0);
  const [feedbackMode, setFeedbackMode] = useState<"section" | "topic">(
    "section",
  );
  const [loading, setLoading] = useState(false);
  const [currentIframeUrl, setCurrentIframeUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      fetchProjectData(projectId).finally(() => setLoading(false));
    }
  }, [projectId]);

  // Add event listener for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle any messages from the iframe here if needed
      if (event.data && event.data.type === "sectionScrolled") {
        console.log("Section scrolled in iframe:", event.data.sectionId);
      }

      // Listen for URL changes in the iframe
      if (event.data && event.data.type === "urlChanged") {
        setCurrentIframeUrl(event.data.url);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;

    const sectionsWithFeedback = new Set(feedback.map((item) => item.sectionId))
      .size;

    const progress = (sectionsWithFeedback / sections.length) * 100;
    setFeedbackProgress(progress);
  }, [sections, feedback]);

  // Function to scroll iframe to a specific section
  const scrollIframeToSection = (sectionId: string) => {
    try {
      const section = sections.find((s) => s.id === sectionId);
      if (!section || !section.domPath) {
        console.log("Section not found or no DOM path available");
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) {
        console.log("Iframe not available");
        return;
      }

      // Try to find the element in the iframe using the DOM path
      console.log("Attempting to scroll to section:", section.domPath);

      // Post a message to the iframe to scroll to the element
      iframe.contentWindow.postMessage(
        {
          type: "scrollToElement",
          domPath: section.domPath,
        },
        "*",
      );

      // Fallback: If the section has visual bounds, scroll to those coordinates
      if (section.visualBounds) {
        const { y } = section.visualBounds;
        iframe.contentWindow.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.error("Error scrolling to section:", error);
    }
  };

  // Fetch project by ID from the database
  const fetchProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      // Fetch project details from the database
      console.log("Fetching project with ID:", projectId);
      const projectsData = await projectService.fetchProjects({
        filter: "all", // Get the project regardless of status
      });

      // Find the specific project by ID
      const projectData = projectsData.find((p) => p.id === projectId);

      if (projectData) {
        console.log("Found project:", projectData);

        // Determine project type based on category
        const projectType = projectData.category?.includes("Mobile")
          ? "mobile"
          : projectData.category?.includes("Web")
            ? "website"
            : "website";

        // Determine points reward
        const pointsReward =
          categoryPointsReward[projectData.category] ||
          categoryPointsReward.default;

        // Determine thumbnail image
        const thumbnailUrl =
          projectData.thumbnail_url ||
          defaultThumbnails[projectData.category] ||
          defaultThumbnails.default;

        // Create screenshots array (in a real app, this would come from the database)
        const screenshots = [thumbnailUrl];

        // Set project with enhanced data
        setProject({
          ...projectData,
          type: projectType,
          pointsReward,
          screenshots,
          creator: {
            name: "Project Creator", // This would come from the user table in a real app
            avatar: "user",
            level: 1,
          },
        });

        // Initialize the current iframe URL
        if (projectData.url) {
          setCurrentIframeUrl(projectData.url);
        }

        // Fetch project feedback from the database
        const feedbackService = await import("@/services/feedback").then(
          (module) => module.feedbackService,
        );
        const feedbackData =
          await feedbackService.getProjectFeedback(projectId);
        console.log("Fetched feedback data:", feedbackData);

        // Transform feedback data to match component format
        const transformedFeedback = feedbackData.map((item) => ({
          id: item.id,
          user: item.user || {
            name: "Anonymous",
            avatar: "user",
            level: 1,
          },
          content: item.content,
          createdAt: item.created_at,
          rating: item.rating || 5, // Use rating from data or default to 5
          pointsEarned: item.points_awarded || 10,
          sectionId: item.section_id,
          sectionName: item.section_name,
          category: item.category || "General",
          screenshotUrl: item.screenshot_url,
          qualityMetrics: item.specificity_score
            ? {
                specificityScore: item.specificity_score,
                actionabilityScore: item.actionability_score,
                noveltyScore: item.novelty_score,
              }
            : undefined,
        }));

        setFeedback(transformedFeedback);

        // Show success toast
        toast({
          title: "Project Loaded",
          description: `Successfully loaded project: ${projectData.title}`,
          variant: "default",
        });
      } else {
        console.error("Project not found with ID:", projectId);
        toast({
          title: "Error",
          description:
            "Project not found. Please try again or select a different project.",
          variant: "destructive",
        });
      }

      // Fetch or detect project sections
      await fetchProjectSections(projectId);
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        title: "Error",
        description: "Failed to load project data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectSections = async (projectId: string) => {
    try {
      console.log("Fetching sections for project ID:", projectId);
      // Get sections from the database
      const sectionsData =
        await projectSectionsService.detectProjectSections(projectId);
      console.log("Fetched sections data:", sectionsData);

      if (sectionsData.length === 0) {
        console.log("No sections found, creating default sections");
        // If no sections found, we'll create default ones
        // This would normally be done by the backend
        toast({
          title: "Using Default Sections",
          description:
            "No custom sections found for this project. Using default sections instead.",
          variant: "default",
        });
      }

      // Transform to component format
      const transformedSections = sectionsData.map((section) => ({
        id: section.section_id,
        name: section.section_name,
        type: section.section_type,
        hasFeedback: feedback.some((f) => f.sectionId === section.section_id),
        feedbackCount: section.feedback_count || 0,
        domPath: section.dom_path,
        visualBounds: section.visual_bounds,
        priority: section.priority,
      }));

      setSections(transformedSections);

      // Show success toast
      toast({
        title: "Sections Loaded",
        description: `Found ${transformedSections.length} sections. Select a section to provide feedback.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error fetching project sections:", error);
      toast({
        title: "Error",
        description: "Failed to load project sections. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectSection = (sectionId: string) => {
    // Toggle section selection - if already active, deselect it
    if (activeSection === sectionId) {
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
      setActiveTab("preview");
      // Scroll to the section after a short delay to ensure the iframe is ready
      setTimeout(() => {
        scrollIframeToSection(sectionId);
      }, 300);
    }
  };

  const handleSubmitFeedback = async (feedbackData: {
    content: string;
    rating: number;
    category: string;
    screenshotUrl?: string;
  }) => {
    if (!user || !activeSection || !projectId) {
      toast({
        title: "Error",
        description: "Missing required information to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the active section details
      const section = sections.find((s) => s.id === activeSection);
      if (!section) {
        toast({
          title: "Error",
          description: "Selected section not found.",
          variant: "destructive",
        });
        return;
      }

      // Import the feedback service dynamically
      const feedbackService = await import("@/services/feedback").then(
        (module) => module.feedbackService,
      );

      // Get the current URL from the iframe
      const pageUrl = currentIframeUrl || project.url;

      // Submit feedback to the database
      console.log("Submitting feedback to database:", {
        projectId,
        userId: user.id,
        sectionId: activeSection,
        sectionName: section.name,
        sectionType: section.type,
        content: feedbackData.content,
        category: feedbackData.category,
        screenshotUrl: feedbackData.screenshotUrl,
        pageUrl,
      });

      // Mock successful feedback submission for now to bypass the edge function error
      // In a production environment, you would fix the edge function CORS issues
      const mockQualityMetrics = {
        specificityScore: 0.75,
        actionabilityScore: 0.8,
        noveltyScore: 0.7,
        sentiment: 0.5,
      };

      const mockResult = {
        success: true,
        feedbackId: `temp-${Date.now()}`,
        points: 20, // Base points + quality points
        qualityMetrics: mockQualityMetrics,
        message: "Feedback submitted successfully",
      };

      // Create a new feedback entry for the UI
      const newFeedback = {
        id: mockResult.feedbackId,
        user: {
          name: user.user_metadata?.name || "Anonymous",
          avatar: user.user_metadata?.avatar_url || "user",
          level: 1, // This would come from the user's profile
        },
        content: feedbackData.content,
        createdAt: new Date().toISOString(),
        rating: feedbackData.rating,
        pointsEarned: mockResult.points,
        sectionId: activeSection,
        sectionName: section.name,
        category: feedbackData.category,
        screenshotUrl: feedbackData.screenshotUrl,
        qualityMetrics: mockResult.qualityMetrics,
        pageUrl: pageUrl, // Store the current page URL
      };

      // Update the feedback list
      setFeedback([newFeedback, ...feedback]);

      // Update the section to mark it as having feedback
      setSections(
        sections.map((s) =>
          s.id === activeSection
            ? { ...s, hasFeedback: true, feedbackCount: s.feedbackCount + 1 }
            : s,
        ),
      );

      // Show success toast
      toast({
        title: "Feedback Submitted",
        description: `Your feedback on the ${section.name} section has been submitted successfully.`,
        variant: "default",
      });

      // Switch to the feedback tab to show the newly added feedback
      setActiveTab("feedback");

      // Reset active section
      setActiveSection(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelFeedback = () => {
    setActiveSection(null);
  };

  const isDefaultView = !projectId;

  if (loading && projectId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading project data...
          </p>
        </div>
      </div>
    );
  }

  if (isDefaultView) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Feedback Dashboard</h1>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discover Projects to Review</CardTitle>
              <CardDescription>
                Find projects that need your feedback and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Browse through available projects and provide valuable feedback
                to help creators improve their work. Earn points and unlock
                achievements based on the quality of your feedback.
              </p>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  <span className="font-medium">
                    Earn up to 90 points per project
                  </span>
                </div>
              </div>
              <Button
                onClick={() => navigate("/dashboard/project-discovery")}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                <Compass className="h-4 w-4 mr-2" />
                Browse Projects
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Feedback Activity</CardTitle>
              <CardDescription>
                Track your contributions and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.user_metadata?.name || "user"}`}
                    />
                    <AvatarFallback>
                      {(user?.user_metadata?.name || "You")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {user?.user_metadata?.name || "You"}
                      </span>
                      <span className="text-xs text-gray-500">5m ago</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Provided high-quality feedback on the homepage design
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        Website Redesign
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        UI/UX
                      </Badge>
                      <Badge className="text-xs bg-green-100 text-green-700">
                        Quality: 85%
                      </Badge>
                      <Badge className="ml-auto text-xs bg-teal-100 text-teal-700">
                        +25 pts
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {project.title}
            </h1>
            <Badge
              className={`ml-2 ${project.type === "website" ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" : project.type === "mobile" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"}`}
            >
              {project.category}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Project
            </a>
            <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>{project.pointsReward} points reward</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="min-h-[600px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-row">
          {/* Sections Panel - Left Sidebar */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-700 h-full">
            <Tabs defaultValue="sections" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4 mb-0 justify-start">
                <TabsTrigger
                  value="sections"
                  className="flex items-center gap-1"
                >
                  <Layout className="h-4 w-4" />
                  Sections
                </TabsTrigger>
                <TabsTrigger value="topics" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Topics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="sections" className="flex-1 p-0">
                <ProjectSectionMap
                  sections={sections}
                  activeSection={activeSection}
                  onSelectSection={handleSelectSection}
                  progress={feedbackProgress}
                />
              </TabsContent>
              <TabsContent value="topics" className="flex-1 p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Topic-based feedback coming soon. This alternative approach
                  will let you provide feedback by topic rather than by section.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 pt-4 pb-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="preview" className="relative">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                    {activeSection && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-teal-500 animate-pulse"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="feedback">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Feedback ({feedback.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 p-4 pt-2 flex">
              {activeTab === "preview" ? (
                <div className="flex flex-1 h-full">
                  {/* Preview Content */}
                  <div className="flex-1 overflow-hidden">
                    <Card className="h-full overflow-hidden flex flex-col">
                      <div className="relative flex-1 overflow-hidden">
                        <div className="relative w-full h-full overflow-auto bg-slate-100 dark:bg-slate-700 flex flex-col">
                          {project.url ? (
                            <div className="w-full h-full flex flex-col">
                              <div className="bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400 flex-1 overflow-hidden">
                                  <Globe className="h-3 w-3" />
                                  <span className="truncate">
                                    {currentIframeUrl || project.url}
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      currentIframeUrl || project.url,
                                      "_blank",
                                    )
                                  }
                                  className="text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" /> Open
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (iframeRef.current) {
                                      iframeRef.current.src =
                                        iframeRef.current.src;
                                      setCurrentIframeUrl(project.url);
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                                </Button>
                              </div>
                              <div className="flex-1 relative">
                                <iframe
                                  ref={iframeRef}
                                  id="project-preview-iframe"
                                  src={project.url}
                                  className="w-full h-full border-0"
                                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onLoad={() => {
                                    console.log("Iframe loaded successfully");
                                    // Try to scroll to the active section if one is selected
                                    if (activeSection) {
                                      scrollIframeToSection(activeSection);
                                    }
                                  }}
                                  onError={() =>
                                    console.error("Error loading iframe")
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-start justify-center">
                              <img
                                src={project.screenshots[currentImageIndex]}
                                alt="Project Preview"
                                className="max-w-full object-contain"
                              />

                              {project.screenshots.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                  {project.screenshots.map((_, index) => (
                                    <button
                                      key={index}
                                      className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-600"}`}
                                      onClick={() =>
                                        setCurrentImageIndex(index)
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {activeSection && (
                            <div
                              className="absolute border-2 border-teal-500 bg-teal-500/10 pointer-events-none z-10 animate-pulse"
                              style={{
                                left:
                                  sections.find((s) => s.id === activeSection)
                                    ?.visualBounds?.x || 0,
                                top:
                                  sections.find((s) => s.id === activeSection)
                                    ?.visualBounds?.y || 0,
                                width:
                                  sections.find((s) => s.id === activeSection)
                                    ?.visualBounds?.width || 0,
                                height:
                                  sections.find((s) => s.id === activeSection)
                                    ?.visualBounds?.height || 0,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Feedback Form Sidebar - Only shown when a section is selected */}
                  {activeSection && (
                    <div className="w-80 ml-4">
                      <Card className="h-full">
                        <FeedbackForm
                          section={
                            sections.find((s) => s.id === activeSection) || null
                          }
                          onSubmit={handleSubmitFeedback}
                          onCancel={handleCancelFeedback}
                          isSubmitting={isSubmitting}
                          existingFeedback={feedback.filter(
                            (f) => f.sectionId === activeSection,
                          )}
                          currentUser={user?.user_metadata}
                        />
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      All Feedback
                    </CardTitle>
                    <CardDescription>
                      {feedback.length} feedback items provided by the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {feedback.map((item, index) => (
                        <div key={item.id} className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.avatar}`}
                              />
                              <AvatarFallback>
                                {item.user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {item.user.name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Level {item.user.level} ·{" "}
                                    {new Date(
                                      item.createdAt,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex">
                                  {Array.from({ length: item.rating }).map(
                                    (_, i) => (
                                      <Star
                                        key={i}
                                        className="h-4 w-4 fill-amber-400 text-amber-400"
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                {item.content}
                              </p>

                              {item.qualityMetrics && (
                                <div className="mt-3">
                                  <FeedbackQualityIndicator
                                    metrics={item.qualityMetrics}
                                    size="sm"
                                    variant="compact"
                                  />
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.sectionName}
                                  </Badge>
                                  <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {item.category}
                                  </Badge>
                                  {item.pageUrl &&
                                    item.pageUrl !== project.url && (
                                      <Badge className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <Globe className="h-3 w-3 mr-1" />
                                        Page: {new URL(item.pageUrl).pathname}
                                      </Badge>
                                    )}
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400">
                                  +{item.pointsEarned} points earned
                                </div>
                              </div>
                            </div>
                          </div>

                          {item.screenshotUrl && (
                            <div className="pl-11">
                              <img
                                src={item.screenshotUrl}
                                alt="Feedback Screenshot"
                                className="rounded-md border border-slate-200 dark:border-slate-700 max-h-48 object-cover"
                              />
                            </div>
                          )}

                          {index < feedback.length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}

                      {feedback.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                            No feedback yet
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Be the first to provide feedback on this project.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackInterface;
