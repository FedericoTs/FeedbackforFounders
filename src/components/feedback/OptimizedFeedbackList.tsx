/**
 * OptimizedFeedbackList Component
 *
 * A component that displays a list of feedback items with optimized data fetching.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePaginatedQuery } from "@/hooks/useOptimizedQuery";
import {
  optimizedFeedbackService,
  FeedbackQueryParams,
} from "@/services/optimizedFeedback";
import FeedbackItem from "./FeedbackItem";

interface OptimizedFeedbackListProps {
  projectId?: string;
  sectionId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  className?: string;
  compact?: boolean;
  initialPageSize?: number;
}

const OptimizedFeedbackList: React.FC<OptimizedFeedbackListProps> = ({
  projectId,
  sectionId,
  status,
  sortBy = "created_at",
  sortOrder = "desc",
  className = "",
  compact = false,
  initialPageSize = 10,
}) => {
  // Create query parameters
  const queryParams: FeedbackQueryParams = {
    projectId,
    sectionId,
    status,
    sortBy,
    sortOrder,
    limit: initialPageSize,
  };

  // Use the paginated query hook
  const {
    data: feedback,
    isLoading,
    isError,
    error,
    metadata,
    loadNextPage,
    resetPagination,
    refetch,
  } = usePaginatedQuery({
    queryFn: optimizedFeedbackService.getFeedback.bind(
      optimizedFeedbackService,
    ),
    params: queryParams,
    cacheKeyPrefix: "feedback-list",
    cacheTtl: 5 * 60 * 1000, // 5 minutes
    initialPageSize,
  });

  // Handle errors
  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-red-500">
            {error?.message || "Failed to load feedback"}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <div className="space-y-4 p-4">
        {/* Feedback items */}
        {feedback.map((item) => (
          <FeedbackItem key={item.id} feedback={item} />
        ))}

        {/* Loading state */}
        {isLoading && feedback.length === 0 && (
          <div className="space-y-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && feedback.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No feedback found.
          </div>
        )}

        {/* Load more button */}
        {metadata.hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => loadNextPage()}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {/* Loading indicator at bottom when loading more */}
        {isLoading && feedback.length > 0 && (
          <div className="p-4 flex justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default OptimizedFeedbackList;
