import React, { useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { projectService } from "@/services/project";
import { useMemoizedCallback } from "@/hooks/useMemoizedCallback";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  image_url?: string;
}

interface VirtualizedProjectsListProps {
  userId?: string;
  limit?: number;
  showLoadMore?: boolean;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

const VirtualizedProjectsList: React.FC<VirtualizedProjectsListProps> = ({
  userId,
  limit = 10,
  showLoadMore = true,
  onProjectClick,
  className = "",
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  // Container ref for the virtualizer
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Set up the virtualizer
  const rowVirtualizer = useVirtualizer({
    count: loading ? 3 : projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each project card
    overscan: 5, // Number of items to render outside of the visible area
  });

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchProjects = useMemoizedCallback(
    async (pageToFetch: number) => {
      try {
        setLoading(true);
        setError(null);

        const offset = pageToFetch * limit;
        const response = await projectService.fetchProjects({
          userId,
          limit,
          offset: offset,
          sortBy: "updated_at",
        });

        // Format the response to match expected structure
        const formattedResponse = {
          data: response || [],
          metadata: { hasMore: (response || []).length >= limit },
        };

        if (pageToFetch === 0) {
          setProjects(formattedResponse.data || []);
        } else {
          setProjects((prev) => [...prev, ...(formattedResponse.data || [])]);
        }

        setHasMore(formattedResponse.metadata.hasMore);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [userId, limit, toast],
  );

  // Load initial projects
  useEffect(() => {
    fetchProjects(0);
    setPage(0);
  }, [userId, fetchProjects]);

  // Memoized load more function
  const handleLoadMore = useMemoizedCallback(() => {
    const nextPage = page + 1;
    fetchProjects(nextPage);
    setPage(nextPage);
  }, [page, fetchProjects]);

  // Memoized project click handler
  const handleProjectClick = useMemoizedCallback(
    (project: Project) => {
      if (onProjectClick) {
        onProjectClick(project);
      }
    },
    [onProjectClick],
  );

  // Render a project item
  const renderProject = (project: Project, index: number) => (
    <Card
      key={project.id}
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleProjectClick(project)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium">{project.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {project.description}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {project.status}
              </span>
              <span className="text-xs text-gray-500">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {project.image_url && (
            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
              <img
                src={project.image_url}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render a skeleton loader
  const renderSkeleton = (index: number) => (
    <Card key={`skeleton-${index}`} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-full">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center mt-2 space-x-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <Skeleton className="w-16 h-16 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div
        ref={parentRef}
        className="overflow-auto max-h-[600px] pr-2"
        style={{ height: "600px" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const index = virtualRow.index;
            const project = projects[index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {loading && !project
                  ? renderSkeleton(index)
                  : project && renderProject(project, index)}
              </div>
            );
          })}
        </div>
      </div>

      {showLoadMore && hasMore && !loading && (
        <div className="mt-4 text-center">
          <Button onClick={handleLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(VirtualizedProjectsList);
