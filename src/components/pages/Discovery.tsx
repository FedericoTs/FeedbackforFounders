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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Code,
  Filter,
  Laptop,
  MessageSquare,
  Palette,
  Search,
  Smartphone,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";

// Mock project data
const mockProjects = [
  {
    id: "1",
    title: "E-commerce Website Redesign",
    description:
      "Looking for feedback on the new user interface and checkout flow.",
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
  },
  {
    id: "2",
    title: "Fitness App Onboarding",
    description: "Need feedback on the onboarding process for new users.",
    category: "Mobile App",
    tags: ["Onboarding", "UX", "Mobile"],
    creator: {
      name: "Michael Chen",
      avatar: "michael",
      level: 3,
    },
    feedbackCount: 8,
    pointsReward: 60,
    createdAt: "2023-06-18T14:45:00Z",
    type: "mobile",
  },
  {
    id: "3",
    title: "SaaS Dashboard Layout",
    description:
      "Looking for feedback on the dashboard layout and data visualization.",
    category: "Web App",
    tags: ["Dashboard", "SaaS", "Data Viz"],
    creator: {
      name: "Alex Rivera",
      avatar: "alex",
      level: 5,
    },
    feedbackCount: 15,
    pointsReward: 90,
    createdAt: "2023-06-10T09:15:00Z",
    type: "website",
  },
  {
    id: "4",
    title: "Logo Design for Tech Startup",
    description:
      "Need feedback on logo design concepts for a new tech startup.",
    category: "Branding",
    tags: ["Logo", "Branding", "Tech"],
    creator: {
      name: "Emma Wilson",
      avatar: "emma",
      level: 4,
    },
    feedbackCount: 20,
    pointsReward: 50,
    createdAt: "2023-06-20T11:00:00Z",
    type: "design",
  },
  {
    id: "5",
    title: "Travel Blog Homepage",
    description:
      "Seeking feedback on the layout and visual hierarchy of my travel blog homepage.",
    category: "Web Design",
    tags: ["Blog", "Layout", "Visual Design"],
    creator: {
      name: "David Kim",
      avatar: "david",
      level: 3,
    },
    feedbackCount: 6,
    pointsReward: 45,
    createdAt: "2023-06-22T16:30:00Z",
    type: "website",
  },
  {
    id: "6",
    title: "Food Delivery App UI",
    description:
      "Looking for feedback on the user interface and ordering process.",
    category: "Mobile App",
    tags: ["UI/UX", "Food", "Mobile"],
    creator: {
      name: "Priya Patel",
      avatar: "priya",
      level: 4,
    },
    feedbackCount: 10,
    pointsReward: 70,
    createdAt: "2023-06-17T13:20:00Z",
    type: "mobile",
  },
];

const Discovery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filter projects based on search query and active filter
  const filteredProjects = mockProjects
    .filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesFilter =
        activeFilter === "all" || project.type === activeFilter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "points") {
        return b.pointsReward - a.pointsReward;
      } else if (sortBy === "popular") {
        return b.feedbackCount - a.feedbackCount;
      }
      return 0;
    });

  // Get project icon based on type
  const getProjectIcon = (type) => {
    switch (type) {
      case "website":
        return <Laptop className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
      case "mobile":
        return (
          <Smartphone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        );
      case "design":
        return <Palette className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <Code className="h-5 w-5 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Discover Projects
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse projects seeking feedback and earn points for your
          contributions.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search projects by title, description, or tags..."
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setActiveFilter("all")}
                className={
                  activeFilter === "all" ? "bg-slate-100 dark:bg-slate-800" : ""
                }
              >
                All Projects
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveFilter("website")}
                className={
                  activeFilter === "website"
                    ? "bg-slate-100 dark:bg-slate-800"
                    : ""
                }
              >
                Websites
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveFilter("mobile")}
                className={
                  activeFilter === "mobile"
                    ? "bg-slate-100 dark:bg-slate-800"
                    : ""
                }
              >
                Mobile Apps
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveFilter("design")}
                className={
                  activeFilter === "design"
                    ? "bg-slate-100 dark:bg-slate-800"
                    : ""
                }
              >
                Design
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setSortBy("recent")}
                className={
                  sortBy === "recent" ? "bg-slate-100 dark:bg-slate-800" : ""
                }
              >
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("points")}
                className={
                  sortBy === "points" ? "bg-slate-100 dark:bg-slate-800" : ""
                }
              >
                Highest Points
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy("popular")}
                className={
                  sortBy === "popular" ? "bg-slate-100 dark:bg-slate-800" : ""
                }
              >
                Most Popular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Categories */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger
            value="all"
            onClick={() => setActiveFilter("all")}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="website"
            onClick={() => setActiveFilter("website")}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            Websites
          </TabsTrigger>
          <TabsTrigger
            value="mobile"
            onClick={() => setActiveFilter("mobile")}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            Mobile Apps
          </TabsTrigger>
          <TabsTrigger
            value="design"
            onClick={() => setActiveFilter("design")}
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
          >
            Design
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {getProjectIcon(project.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.creator.avatar}`}
                        />
                        <AvatarFallback>
                          {project.creator.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <CardDescription className="text-xs">
                        {project.creator.name} · Level {project.creator.level}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <Badge
                  className={`${project.type === "website" ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" : project.type === "mobile" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400"}`}
                >
                  {project.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                  <MessageSquare className="h-4 w-4" />
                  <span>{project.feedbackCount}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span>+{project.pointsReward} pts</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                Give Feedback
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            We couldn't find any projects matching your search criteria. Try
            adjusting your filters or search query.
          </p>
        </div>
      )}
    </div>
  );
};

export default Discovery;
