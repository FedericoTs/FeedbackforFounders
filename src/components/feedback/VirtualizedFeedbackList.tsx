import React, { useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { feedbackService } from "@/services/feedback";
import FeedbackItem from "./FeedbackItem";

interface Feedback {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  element_selector?: string;
  screenshot_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  quality_score?: number;
  specificity_score?: number;
  actionability_score?: number;
  sentiment?: number;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface VirtualizedFeedbackListProps {
  projectId?: string;
  limit?: number;
  className?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const VirtualizedFeedbackList: React.FC<VirtualizedFeedbackListProps> = ({
  projectId,
  limit = 20,
  className = "",
  status,
  sortBy = "created_at",
  sortOrder = "desc",
}) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Fetch feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const data = await feedbackService.getFeedback({
          projectId,
          limit,
          status,
          sortBy,
          sortOrder,
        });
        setFeedback(data);
        setHasMore(data.length === limit);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to load feedback. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [projectId, limit, status, sortBy, sortOrder]);

  // Load more feedback
  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const lastFeedback = feedback[feedback.length - 1];
      const cursor = lastFeedback ? lastFeedback.created_at : undefined;

      const data = await feedbackService.getFeedback({
        projectId,
        limit,
        cursor,
        status,
        sortBy,
        sortOrder,
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      setFeedback([...feedback, ...data]);
    } catch (err) {
      console.error("Error loading more feedback:", err);
      setError("Failed to load more feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Set up virtualizer
  const rowVirtualizer = useVirtualizer({
    count: feedback.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimate height of each feedback item
    overscan: 5,
  });

  // Handle scroll to load more
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= feedback.length - 1 && hasMore && !loading) {
      loadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), hasMore, loading]);

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
    <Card className={`${className} overflow-hidden`}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: "600px",
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
            const item = feedback[virtualRow.index];
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
                <FeedbackItem feedback={item} />
              </div>
            );
          })}
        </div>

        {loading && feedback.length === 0 && (
          <div className="p-4 space-y-4">
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

        {!loading && feedback.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No feedback found.
          </div>
        )}

        {loading && feedback.length > 0 && (
          <div className="p-4 flex justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VirtualizedFeedbackList;
