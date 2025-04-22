import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
} from "lucide-react";
import { projectService } from "@/services/project";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

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

const ProjectCard = ({ project, onGiveFeedback }) => {
  // Determine thumbnail image
  const thumbnailUrl =
    project.thumbnail_url ||
    defaultThumbnails[project.category] ||
    defaultThumbnails.default;

  // Determine project type based on category
  const projectType = project.category?.includes("Mobile")
    ? "mobile"
    : project.category?.includes("Web")
      ? "website"
      : "website";

  // Determine points reward
  const pointsReward =
    categoryPointsReward[project.category] || categoryPointsReward.default;

  // Parse tags from string array or comma-separated string
  const tags = Array.isArray(project.tags)
    ? project.tags
    : project.tags
      ? project.tags.split(",").map((tag) => tag.trim())
      : [];

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge
            className={`${projectType === "website" ? "bg-teal-100 text-teal-700" : projectType === "mobile" ? "bg-cyan-100 text-cyan-700" : "bg-rose-100 text-rose-700"}`}
          >
            {project.category || "Project"}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.user_id}`}
            />
            <AvatarFallback>{project.creator?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <CardDescription>
            {project.creator?.name || "User"}{" "}
            {project.creator?.level ? `· Level ${project.creator.level}` : ""}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1 mt-3">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-slate-50 dark:bg-slate-800"
              >
                {tag}
              </Badge>
            ))
          ) : (
            <Badge
              variant="outline"
              className="text-xs bg-slate-50 dark:bg-slate-800"
            >
              {project.category || "Project"}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>{project.feedback_count || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{pointsReward}</span>
          </div>
        </div>
        <Button
          onClick={() => onGiveFeedback(project.id)}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
        >
          <ThumbsUp className="h-4 w-4 mr-2" /> Give Feedback
        </Button>
      </CardFooter>
    </Card>
  );
};

const ProjectDiscovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Fetch projects from the database
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log("Fetching projects with filters:", {
          categoryFilter,
          sortBy,
          searchQuery,
        });

        // Fetch projects with filter options
        const projectsData = await projectService.fetchProjects({
          filter: "all", // Show all projects, not just active ones
          featured: false, // Don't filter for featured projects only
          sortBy:
            sortBy === "newest"
              ? "updated_at"
              : sortBy === "points"
                ? "points"
                : sortBy === "feedback"
                  ? "feedback_count"
                  : "updated_at",
          searchQuery: searchQuery,
        });

        console.log("Fetched projects data:", projectsData);
        console.log("Number of projects:", projectsData.length);

        // If no projects at all, we might need to check if tables exist
        if (projectsData.length === 0) {
          console.log(
            "No projects found. This could indicate missing data or database tables.",
          );
          // Continue execution to show empty state UI
        }

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            projectsData.map((project) => project.category).filter(Boolean),
          ),
        );
        setCategories(uniqueCategories);
        console.log("Unique categories:", uniqueCategories);

        // Apply category filter if needed
        let filteredProjects = projectsData;
        if (categoryFilter !== "all") {
          filteredProjects = filteredProjects.filter(
            (project) => project.category === categoryFilter,
          );
          console.log("After category filtering:", filteredProjects.length);
        }

        // Apply client-side sorting for points since it's not in the database
        if (sortBy === "points") {
          filteredProjects.sort((a, b) => {
            const aPoints =
              categoryPointsReward[a.category] || categoryPointsReward.default;
            const bPoints =
              categoryPointsReward[b.category] || categoryPointsReward.default;
            return bPoints - aPoints;
          });
          console.log("After points sorting");
        }

        // If no projects found after filtering, show a message
        if (filteredProjects.length === 0 && projectsData.length > 0) {
          toast({
            title: "No matching projects",
            description: "Try adjusting your filters to see more projects.",
            variant: "default",
          });
        }

        // Log the projects we're about to display
        console.log("Setting projects to display:", filteredProjects);

        // Set the projects state with the filtered projects
        setProjects(filteredProjects);

        // If we have projects, show a success toast
        if (filteredProjects.length > 0) {
          toast({
            title: "Projects Loaded",
            description: `Found ${filteredProjects.length} projects. You can now test the feedback functionality.`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
        // Set empty projects array if fetch fails
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [searchQuery, categoryFilter, sortBy, toast]);

  const handleGiveFeedback = (projectId) => {
    // Navigate to the feedback interface with the project ID
    console.log("Navigating to feedback interface for project:", projectId);

    // Show a toast to indicate navigation
    toast({
      title: "Opening Feedback Interface",
      description: "Loading the feedback interface for the selected project...",
      variant: "default",
    });

    navigate(`/dashboard/feedback/${projectId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Discover Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Find projects to provide feedback on and earn rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
            <span className="font-medium">Earn up to 90 points</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {categoryFilter === "all" ? "All Categories" : categoryFilter}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
              {categories.length === 0 && [
                <DropdownMenuItem
                  key="web"
                  onClick={() => setCategoryFilter("Web Design")}
                >
                  Web Design
                </DropdownMenuItem>,
                <DropdownMenuItem
                  key="mobile"
                  onClick={() => setCategoryFilter("Mobile App")}
                >
                  Mobile App
                </DropdownMenuItem>,
                <DropdownMenuItem
                  key="webapp"
                  onClick={() => setCategoryFilter("Web App")}
                >
                  Web App
                </DropdownMenuItem>,
              ]}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                Sort:{" "}
                {sortBy === "newest"
                  ? "Newest"
                  : sortBy === "points"
                    ? "Highest Points"
                    : "Most Feedback"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("points")}>
                Highest Points
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("feedback")}>
                Most Feedback
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading projects...
          </span>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="website">Websites</TabsTrigger>
            <TabsTrigger value="mobile">Mobile Apps</TabsTrigger>
            <TabsTrigger value="webapp">Web Apps</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onGiveFeedback={handleGiveFeedback}
                />
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                  No projects found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="website" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .filter((project) => {
                  const category = project.category?.toLowerCase() || "";
                  return category.includes("web") && !category.includes("app");
                })
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onGiveFeedback={handleGiveFeedback}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .filter((project) => {
                  const category = project.category?.toLowerCase() || "";
                  return category.includes("mobile");
                })
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onGiveFeedback={handleGiveFeedback}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="webapp" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .filter((project) => {
                  const category = project.category?.toLowerCase() || "";
                  return category.includes("web") && category.includes("app");
                })
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onGiveFeedback={handleGiveFeedback}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProjectDiscovery;
