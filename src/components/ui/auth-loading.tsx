import React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export type LoadingSize = "xs" | "sm" | "md" | "lg";
export type LoadingVariant = "default" | "primary" | "secondary" | "ghost";
export type LoadingType = "spinner" | "dots" | "pulse";

interface AuthLoadingProps {
  /** The size of the loading indicator */
  size?: LoadingSize;
  /** The variant of the loading indicator */
  variant?: LoadingVariant;
  /** The type of loading indicator to display */
  type?: LoadingType;
  /** Optional text to display next to the loading indicator */
  text?: string;
  /** Whether to center the loading indicator */
  centered?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a full-page overlay */
  fullPage?: boolean;
  /** Whether to show a transparent background */
  transparent?: boolean;
}

/**
 * A standardized loading indicator for authentication flows
 *
 * @example
 * // Basic usage
 * <AuthLoading />
 *
 * @example
 * // With text
 * <AuthLoading text="Signing in..." />
 *
 * @example
 * // Full page overlay
 * <AuthLoading fullPage text="Loading your profile..." />
 *
 * @example
 * // Inside a button
 * <Button disabled={isLoading}>
 *   {isLoading ? <AuthLoading size="xs" text="Processing..." /> : "Sign In"}
 * </Button>
 */
export function AuthLoading({
  size = "md",
  variant = "default",
  type = "spinner",
  text,
  centered = false,
  className,
  fullPage = false,
  transparent = false,
}: AuthLoadingProps) {
  // Map size to actual dimensions
  const sizeMap: Record<LoadingSize, string> = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  // Map variant to colors
  const variantMap: Record<LoadingVariant, string> = {
    default: "text-slate-600",
    primary: "text-teal-500",
    secondary: "text-cyan-500",
    ghost: "text-slate-400",
  };

  // Render the appropriate loading indicator based on type
  const renderLoadingIndicator = () => {
    switch (type) {
      case "spinner":
        return (
          <Spinner
            className={cn(sizeMap[size], variantMap[variant])}
            aria-hidden="true"
          />
        );
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full animate-pulse",
                  sizeMap[size].split(" ")[0],
                  sizeMap[size].split(" ")[0],
                  variantMap[variant],
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  backgroundColor: "currentColor",
                }}
              />
            ))}
          </div>
        );
      case "pulse":
        return (
          <div
            className={cn(
              "rounded-full animate-pulse",
              sizeMap[size],
              variantMap[variant],
            )}
            style={{ backgroundColor: "currentColor" }}
          />
        );
      default:
        return (
          <Spinner
            className={cn(sizeMap[size], variantMap[variant])}
            aria-hidden="true"
          />
        );
    }
  };

  // For full page overlay
  if (fullPage) {
    return (
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center z-50",
          transparent ? "bg-transparent" : "bg-white/80 backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {renderLoadingIndicator()}
          {text && (
            <p className={cn("text-sm font-medium", variantMap[variant])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // For inline or centered display
  return (
    <div
      className={cn(
        "flex items-center",
        centered && "justify-center",
        text ? "space-x-2" : "",
        className,
      )}
    >
      {renderLoadingIndicator()}
      {text && (
        <span className={cn("text-sm font-medium", variantMap[variant])}>
          {text}
        </span>
      )}
    </div>
  );
}

/**
 * A skeleton loader for authentication-dependent UI
 */
export function AuthSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-100 dark:bg-slate-800",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A button loading indicator
 */
export function ButtonLoading({ text = "Processing..." }: { text?: string }) {
  return (
    <AuthLoading
      size="xs"
      text={text}
      variant="ghost"
      className="text-current"
    />
  );
}

export default AuthLoading;
