import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {}

const Breadcrumb = React.forwardRef<HTMLDivElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center text-sm text-gray-500 space-x-1",
          className,
        )}
        {...props}
      />
    );
  },
);
Breadcrumb.displayName = "Breadcrumb";

export interface BreadcrumbItemProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

const BreadcrumbItem = React.forwardRef<HTMLSpanElement, BreadcrumbItemProps>(
  ({ className, active, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "flex items-center",
          active ? "text-gray-900 font-medium" : "text-gray-500",
          className,
        )}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    );
  },
);
BreadcrumbItem.displayName = "BreadcrumbItem";

export interface BreadcrumbLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  to: string;
}

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, to, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        className={cn("hover:text-gray-900 transition-colors", className)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);
BreadcrumbLink.displayName = "BreadcrumbLink";

export interface BreadcrumbSeparatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbSeparator = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbSeparatorProps
>(({ className, ...props }, ref) => {
  return (
    <span ref={ref} className={cn("mx-1 text-gray-400", className)} {...props}>
      <ChevronRight className="h-3 w-3" />
    </span>
  );
});
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export interface BreadcrumbHomeProps
  extends React.HTMLAttributes<HTMLAnchorElement> {
  to?: string;
}

const BreadcrumbHome = React.forwardRef<HTMLAnchorElement, BreadcrumbHomeProps>(
  ({ className, to = "/", ...props }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        className={cn("hover:text-gray-900 transition-colors", className)}
        {...props}
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
    );
  },
);
BreadcrumbHome.displayName = "BreadcrumbHome";

export interface BreadcrumbEllipsisProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  BreadcrumbEllipsisProps
>(({ className, ...props }, ref) => {
  return (
    <span ref={ref} className={cn("mx-1 text-gray-400", className)} {...props}>
      ...
    </span>
  );
});
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbHome,
  BreadcrumbEllipsis,
};
