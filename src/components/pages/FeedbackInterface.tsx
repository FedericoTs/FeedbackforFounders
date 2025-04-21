import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";

interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  user_id: string;
  created_at: string;
  status: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
  feedback_count: number;
}

const FeedbackInterface: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProjects = async () => {
      try {
        setIsLoading(true);

        // Fetch projects that are available for feedback
        const { data, error } = await supabase
          .from("projects")
          .select("*, user:user_id(full_name, avatar_url)")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch feedback counts for each project
        const projectsWithCounts = await Promise.all(
          data.map(async (project) => {
            const { count, error: countError } = await supabase
              .from("feedback")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id);

            return {
              ...project,
              feedback_count: count || 0,
            };
          }),
        );

        setProjects(projectsWithCounts);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user, authLoading, navigate, toast]);

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Apply search filter
      if (
        searchTerm &&
        !project.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !project.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Apply category filter
      if (categoryFilter && project.category !== categoryFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "most-feedback":
          return b.feedback_count - a.feedback_count;
        case "least-feedback":
          return a.feedback_count - b.feedback_count;
        default:
          return 0;
      }
    });

  // Get unique categories for filter
  const categories = Array.from(new Set(projects.map((p) => p.category)));

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    navigate(`/dashboard/feedback/${projectId}`);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feedback Discovery</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Find Projects to Review</CardTitle>
            <CardDescription>
              Browse projects and provide valuable feedback to earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search projects..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-feedback">Most Feedback</option>
                <option value="least-feedback">Least Feedback</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No projects found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {project.description}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`${project.category === "Web Design" ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" : project.category === "Mobile App" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"}`}
                        >
                          {project.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              project.user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.user_id}`
                            }
                          />
                          <AvatarFallback>
                            {project.user?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {project.user?.full_name || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {project.tags &&
                          project.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{project.feedback_count} feedback</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>Earn points</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {filteredProjects.length > 0 && (
              <Button variant="outline" className="w-full md:w-auto">
                Load More <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  1
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">
                  Browse projects
                </span>{" "}
                and select one that interests you.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  2
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">
                  Use the element selector
                </span>{" "}
                to highlight specific parts of the website.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  3
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">
                  Provide detailed feedback
                </span>{" "}
                with category, severity, and constructive comments.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  4
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">
                  Earn points and rewards
                </span>{" "}
                based on the quality and helpfulness of your feedback.
              </div>
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Have your own project you want feedback on?
              </p>
              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                onClick={() => navigate("/dashboard/projects")}
              >
                Create Your Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackInterface;
