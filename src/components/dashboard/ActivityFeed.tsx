import React, { useState, useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import ActivityItem from "./ActivityItem";
import ActivityFilter, { TimeRange } from "./ActivityFilter";
import ActivitySkeleton from "./ActivitySkeleton";
import { Activity, ActivityType } from "@/services/activity";
import { groupActivitiesByDate, ActivityGroup } from "@/lib/activityUtils";
import { supabase } from "@/supabase/supabase";
import { useAuth } from "@/supabase/auth";

interface ActivityFeedProps {
  activities?: Activity[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  isLoading = false,
  onLoadMore,
  hasMore = false,
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ActivityType | "all">("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("all");
  const [filteredActivities, setFilteredActivities] =
    useState<Activity[]>(activities);
  const [groupedActivities, setGroupedActivities] = useState<ActivityGroup[]>(
    [],
  );
  const [newActivities, setNewActivities] = useState<Activity[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter activities based on selected type and time range
  useEffect(() => {
    if (!activities.length) return;

    let filtered = [...activities];

    // Filter by activity type
    if (selectedType !== "all") {
      filtered = filtered.filter((activity) => activity.type === selectedType);
    }

    // Filter by time range
    if (selectedTimeRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (selectedTimeRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.created_at);
        return activityDate >= cutoffDate;
      });
    }

    setFilteredActivities(filtered);
  }, [activities, selectedType, selectedTimeRange]);

  // Group activities by date
  useEffect(() => {
    const grouped = groupActivitiesByDate(filteredActivities);
    setGroupedActivities(grouped);
  }, [filteredActivities]);

  // Set up real-time subscription for new activities
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activity",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setNewActivities((prev) => [newActivity, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle loading more activities when scrolling to the bottom
  useEffect(() => {
    if (!loadMoreRef.current || !parentRef.current || !onLoadMore || !hasMore)
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      { root: parentRef.current, threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, isLoading, hasMore]);

  // Handle new activities notification
  const handleShowNewActivities = useCallback(() => {
    setFilteredActivities((prev) => [...newActivities, ...prev]);
    setNewActivities([]);
  }, [newActivities]);

  // Create a flat array of all activities with their group information for virtualization
  const flatItems = groupedActivities.flatMap((group, groupIndex) => [
    { type: "header", id: `header-${groupIndex}`, title: group.title },
    ...group.activities.map((activity) => ({
      type: "activity",
      id: activity.id,
      activity,
    })),
  ]);

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      return item.type === "header" ? 40 : 120; // Estimate sizes for headers and activities
    },
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col">
      <ActivityFilter
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedTimeRange={selectedTimeRange}
        onTimeRangeChange={setSelectedTimeRange}
      />

      {newActivities.length > 0 && (
        <Button
          onClick={handleShowNewActivities}
          className="mb-4 bg-teal-100 text-teal-700 hover:bg-teal-200 w-full"
        >
          Show {newActivities.length} new{" "}
          {newActivities.length === 1 ? "activity" : "activities"}
        </Button>
      )}

      {isLoading && !activities.length ? (
        <ActivitySkeleton count={3} />
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activities found for the selected filters.
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatItems[virtualRow.index];

              return (
                <div
                  key={item.id}
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
                    <div className="sticky top-0 bg-white dark:bg-slate-900 py-2 font-medium text-sm text-gray-500 z-10">
                      {item.title}
                    </div>
                  ) : (
                    <div className="py-2">
                      <ActivityItem
                        activity={item.activity}
                        isNew={newActivities.some(
                          (a) => a.id === item.activity.id,
                        )}
                      />
                      <Separator className="my-2" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load more indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoading ? (
                <Spinner className="h-6 w-6 text-teal-500" />
              ) : (
                <Button
                  variant="ghost"
                  onClick={onLoadMore}
                  className="text-teal-600 hover:text-teal-700"
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ActivityFeed);
