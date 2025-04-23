import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivitySkeletonProps {
  count?: number;
}

const ActivitySkeleton: React.FC<ActivitySkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>

              <Skeleton className="h-4 w-full" />

              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivitySkeleton;
