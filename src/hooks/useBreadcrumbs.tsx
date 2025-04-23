import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

interface UseBreadcrumbsOptions {
  rootLabel?: string;
  rootPath?: string;
  excludePaths?: string[];
  labelsMap?: Record<string, string>;
}

export const useBreadcrumbs = ({
  rootLabel = "Dashboard",
  rootPath = "/dashboard",
  excludePaths = [],
  labelsMap = {},
}: UseBreadcrumbsOptions = {}) => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);

    // Skip if we're at the root
    if (
      pathSegments.length === 0 ||
      (pathSegments.length === 1 && pathSegments[0] === "dashboard")
    ) {
      setBreadcrumbs([{ label: rootLabel, path: rootPath, isActive: true }]);
      return;
    }

    // Build breadcrumbs array
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Add root item
    breadcrumbItems.push({
      label: rootLabel,
      path: rootPath,
      isActive: false,
    });

    // Add intermediate paths
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
      // Skip excluded paths
      if (excludePaths.includes(segment)) {
        return;
      }

      currentPath += `/${segment}`;

      // Check if this is the last segment (active item)
      const isLastSegment = index === pathSegments.length - 1;

      // Get custom label from map or format the segment
      const label = labelsMap[segment] || formatPathSegment(segment);

      breadcrumbItems.push({
        label,
        path: currentPath,
        isActive: isLastSegment,
      });
    });

    setBreadcrumbs(breadcrumbItems);
  }, [location.pathname, rootLabel, rootPath, excludePaths, labelsMap]);

  return breadcrumbs;
};

// Helper function to format path segments into readable labels
const formatPathSegment = (segment: string): string => {
  // Handle dynamic route parameters (e.g., [id], :id)
  if (
    (segment.startsWith("[") && segment.endsWith("]")) ||
    segment.startsWith(":")
  ) {
    return "Details";
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/-|_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
