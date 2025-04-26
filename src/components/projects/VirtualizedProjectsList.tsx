import React, { useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { projectService } from "@/services/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MessageSquare, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  status: string;
  feedback_count?: number;
  view_count?: number;
  owner?: {
    name: string;
    avatar_url?: string;
  };
}

interface VirtualizedProjectsListProps {
  userId?: string;
  limit?: number;
  className?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  view?: "grid" | "list";
}

const VirtualizedProjectsList: React.FC<VirtualizedProjectsListProps> = ({
  userId,
  limit = 20,
  className = "",
  status,
  sortBy = "created_at",
  sortOrder = "desc",
  view = "grid",
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getProjects({
          userId,
          limit,
          status,
          sortBy,
          sortOrder,
        });
        setProjects(data);
        setHasMore(data.length === limit);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId, limit, status, sortBy, sortOrder]);

  // Load more projects
  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const lastProject = projects[projects.length - 1];
      const cursor = lastProject ? lastProject.created_at : undefined;

      const data = await projectService.getProjects({
        userId,
        limit,
        cursor,
        status,
        sortBy,
        sortOrder,
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      setProjects([...projects, ...data]);
    } catch (err) {
      console.error("Error loading more projects:", err);
      setError("Failed to load more projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate row size based on view type
  const getRowSize = () => {
    return view === "grid" ? 300 : 120; // Height for grid cards or list items
  };

  // Set up virtualizer
  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getRowSize,
    overscan: 5,
  });

  // Handle scroll to load more
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= projects.length - 1 && hasMore && !loading) {
      loadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), hasMore, loading]);

  // Render project card
  const renderProjectCard = (project: Project) => {
    return (
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div
          className="h-32 bg-cover bg-center"
          style={{
            backgroundImage: project.thumbnail_url
              ? `url(${project.thumbnail_url})`
              : "linear-gradient(to right, #4f46e5, #6366f1)",
          }}
        />
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg truncate">{project.name}</h3>
            <Badge
              variant={project.status === "active" ? "default" : "outline"}
              className="ml-2"
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">
            {project.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src={project.owner?.avatar_url}
                  alt={project.owner?.name}
                />
                <AvatarFallback>
                  {(project.owner?.name || "U").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-500">
                {project.owner?.name || "Unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-xs text-slate-500">
                <MessageSquare className="h-3 w-3 mr-1" />
                {project.feedback_count || 0}
              </div>
              <div className="flex items-center text-xs text-slate-500">
                <Eye className="h-3 w-3 mr-1" />
                {project.view_count || 0}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`/dashboard/projects/${project.id}`}>View Project</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render project list item
  const renderProjectListItem = (project: Project) => {
    return (
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-medium truncate">{project.name}</h3>
                <Badge
                  variant={project.status === "active" ? "default" : "outline"}
                  className="ml-2"
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 line-clamp-1">
                {project.description}
              </p>
              <div className="flex items-center mt-1 text-xs text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(project.created_at).toLocaleDateString()}
                <span className="mx-2">•</span>
                <MessageSquare className="h-3 w-3 mr-1" />
                {project.feedback_count || 0}
                <span className="mx-2">•</span>
                <Eye className="h-3 w-3 mr-1" />
                {project.view_count || 0}
              </div>
            </div>
            <Button variant="outline" size="sm" className="ml-4" asChild>
              <Link to={`/dashboard/projects/${project.id}`}>View</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: "700px",
          width: "100%",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const project = projects[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: "8px",
                }}
              >
                {view === "grid"
                  ? renderProjectCard(project)
                  : renderProjectListItem(project)}
              </div>
            );
          })}
        </div>

        {loading && projects.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-32 w-full" />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-x-2">
                          <Skeleton className="h-4 w-8 inline-block" />
                          <Skeleton className="h-4 w-8 inline-block" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No projects found.
          </div>
        )}

        {loading && projects.length > 0 && (
          <div className="p-4 flex justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedProjectsList;
