import React from "react";
import { cn } from "@/lib/utils";
import designSystem from "@/lib/design-system";

/**
 * FeedbackLoop Design System Components
 *
 * This file contains reusable UI components that follow the FeedbackLoop design system.
 * These components are built on top of the design tokens defined in the design system.
 */

// Gradient Text component
export const GradientText = ({
  children,
  className,
  as: Component = "span",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) => {
  return (
    <Component
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Gradient Badge component
export const GradientBadge = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "inline-flex items-center bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Section component with consistent styling
export const Section = ({
  children,
  className,
  size = "lg",
  withTopDivider = false,
  withBottomDivider = false,
  background = "white",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  withTopDivider?: boolean;
  withBottomDivider?: boolean;
  background?: "white" | "light" | "gradient";
} & React.HTMLAttributes<HTMLElement>) => {
  const sizeClasses = {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-24",
    lg: "py-20 md:py-32",
  };

  const backgroundClasses = {
    white: "bg-white",
    light: "bg-slate-50",
    gradient: "bg-gradient-to-b from-white to-slate-50",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        sizeClasses[size],
        backgroundClasses[background],
        className,
      )}
      {...props}
    >
      {withTopDivider && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      )}
      {children}
      {withBottomDivider && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      )}
    </section>
  );
};

// Container component with consistent max-width and padding
export const Container = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("container px-4 mx-auto", className)} {...props}>
      {children}
    </div>
  );
};

// Gradient Button component
export const GradientButton = ({
  children,
  className,
  variant = "primary",
  size = "default",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  size?: "default" | "sm" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white",
    secondary:
      "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-300",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Avatar with glow effect
export const GlowAvatar = ({
  src,
  alt,
  className,
  size = "default",
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  size?: "sm" | "default" | "lg";
} & React.ImgHTMLAttributes<HTMLImageElement>) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("relative", className)} {...props}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-[6px] opacity-50" />
      <div
        className={cn(
          "relative rounded-full overflow-hidden ring-2 ring-white",
          sizeClasses[size],
        )}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

// Card with consistent styling
export const DesignCard = ({
  children,
  className,
  variant = "default",
  withHoverEffect = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "outline";
  withHoverEffect?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const variantClasses = {
    default: "bg-white/90 backdrop-blur-sm border border-slate-100",
    gradient: "bg-gradient-to-b from-white to-gray-50 border border-gray-200",
    outline: "bg-white border border-slate-200",
  };

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        variantClasses[variant],
        withHoverEffect &&
          "shadow-md hover:shadow-lg transition-shadow duration-300",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Section Header with consistent styling
export const SectionHeader = ({
  title,
  description,
  badge,
  className,
  titleClassName,
  descriptionClassName,
  ...props
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("text-center mb-16 max-w-3xl mx-auto", className)}
      {...props}
    >
      {badge && <div className="mb-4">{badge}</div>}
      <h2
        className={cn(
          "text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("text-slate-600 text-lg", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  );
};

// Export all components
export const DesignSystem = {
  GradientText,
  GradientBadge,
  Section,
  Container,
  GradientButton,
  GlowAvatar,
  DesignCard,
  SectionHeader,
};

export default DesignSystem;
