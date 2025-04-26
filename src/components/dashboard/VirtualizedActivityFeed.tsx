import React, { useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityItem from "./ActivityItem";
import ActivitySkeleton from "./ActivitySkeleton";
import ActivityFilter from "./ActivityFilter";
import { activityService } from "@/services/activity";

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
}

interface VirtualizedActivityFeedProps {
  userId?: string;
  limit?: number;
  className?: string;
  showFilters?: boolean;
  compact?: boolean;
}

const VirtualizedActivityFeed: React.FC<VirtualizedActivityFeedProps> = ({
  userId,
  limit = 50,
  className = "",
  showFilters = true,
  compact = false,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [groupedActivities, setGroupedActivities] = useState<
    Record<string, Activity[]>
  >({});
  const [groupKeys, setGroupKeys] = useState<string[]>([]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await activityService.getUserActivities({
          userId,
          limit,
          activityType: filter,
        });
        setActivities(data);
        setHasMore(data.length === limit);
        groupActivitiesByDate(data);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId, limit, filter]);

  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]) => {
    const grouped: Record<string, Activity[]> = {};

    activities.forEach((activity) => {
      const date = new Date(activity.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(activity);
    });

    setGroupedActivities(grouped);
    setGroupKeys(
      Object.keys(grouped).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
      }),
    );
  };

  // Load more activities
  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const lastActivity = activities[activities.length - 1];
      const cursor = lastActivity ? lastActivity.created_at : undefined;

      const data = await activityService.getUserActivities({
        userId,
        limit,
        cursor,
        activityType: filter,
      });

      if (data.length < limit) {
        setHasMore(false);
      }

      const newActivities = [...activities, ...data];
      setActivities(newActivities);
      groupActivitiesByDate(newActivities);
    } catch (err) {
      console.error("Error loading more activities:", err);
      setError("Failed to load more activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (value: string | null) => {
    setFilter(value);
    setActivities([]);
    setHasMore(true);
  };

  // Create flat array of items for virtualization
  const items: Array<{ type: "header" | "activity"; content: any }> = [];
  groupKeys.forEach((date) => {
    items.push({ type: "header", content: date });
    groupedActivities[date].forEach((activity) => {
      items.push({ type: "activity", content: activity });
    });
  });

  // Set up virtualizer
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (items[index]?.type === "header" ? 40 : 80),
    overscan: 5,
  });

  // Handle scroll to load more
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= items.length - 1 && hasMore && !loading) {
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
      {showFilters && (
        <div className="p-3 border-b">
          <ActivityFilter
            onFilterChange={handleFilterChange}
            currentFilter={filter}
          />
        </div>
      )}

      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: compact ? "300px" : "500px",
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
            const item = items[virtualRow.index];
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
                }}
              >
                {item.type === "header" ? (
                  <div className="sticky top-0 bg-slate-50 p-2 font-medium text-sm text-slate-500">
                    {item.content}
                  </div>
                ) : (
                  <ActivityItem activity={item.content} compact={compact} />
                )}
              </div>
            );
          })}
        </div>

        {loading && items.length === 0 && (
          <div className="p-4 space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <ActivitySkeleton key={i} />
              ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No activities found.
          </div>
        )}

        {loading && items.length > 0 && (
          <div className="p-4 flex justify-center">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default VirtualizedActivityFeed;
