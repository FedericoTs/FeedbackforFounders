import React from "react";
import { cn } from "@/lib/utils";

interface AuthSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The number of skeleton items to render */
  count?: number;
  /** The height of each skeleton item */
  height?: string;
  /** Whether to show a circular skeleton */
  circle?: boolean;
  /** Whether to show a skeleton with a header and content */
  card?: boolean;
  /** Whether to show a form skeleton */
  form?: boolean;
  /** Whether to show an avatar skeleton */
  avatar?: boolean;
  /** The width of the skeleton */
  width?: string;
}

/**
 * A skeleton loader for authentication-dependent UI
 *
 * @example
 * // Basic usage
 * <AuthSkeleton />
 *
 * @example
 * // Multiple items
 * <AuthSkeleton count={3} height="h-12" />
 *
 * @example
 * // Card skeleton
 * <AuthSkeleton card />
 *
 * @example
 * // Form skeleton
 * <AuthSkeleton form />
 */
export function AuthSkeleton({
  className,
  count = 1,
  height = "h-8",
  circle = false,
  card = false,
  form = false,
  avatar = false,
  width = "w-full",
  ...props
}: AuthSkeletonProps) {
  // For avatar skeleton
  if (avatar) {
    return (
      <div
        className={cn(
          "rounded-full animate-pulse bg-slate-200 dark:bg-slate-700",
          width || "w-10",
          height || "h-10",
          className,
        )}
        {...props}
      />
    );
  }

  // For card skeleton
  if (card) {
    return (
      <div
        className={cn(
          "rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4",
          width,
          className,
        )}
        {...props}
      >
        <div className="space-y-2">
          <div className="h-5 w-2/3 rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-20 w-full rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-1/3 rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  // For form skeleton
  if (form) {
    return (
      <div className={cn("space-y-4", width, className)} {...props}>
        <div className="space-y-2">
          <div className="h-4 w-1/4 rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-1/4 rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-10 w-full rounded animate-pulse bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  // For multiple items
  if (count > 1) {
    return (
      <div className={cn("space-y-2", width, className)} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse bg-slate-200 dark:bg-slate-700",
              circle ? "rounded-full" : "rounded",
              height,
            )}
          />
        ))}
      </div>
    );
  }

  // Basic skeleton
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-700",
        circle ? "rounded-full" : "rounded",
        height,
        width,
        className,
      )}
      {...props}
    />
  );
}

export default AuthSkeleton;
