/**
 * Utility functions for preloading routes based on user navigation patterns
 */

// Track which routes have already been preloaded to avoid duplicate requests
const preloadedRoutes = new Set<string>();

/**
 * Preload a component module
 * @param importFunc - Dynamic import function for the component
 */
export function preloadRoute(importFunc: () => Promise<any>): void {
  // Create a unique key for this import function
  const key = importFunc.toString();

  // Skip if already preloaded
  if (preloadedRoutes.has(key)) return;

  // Mark as preloaded and trigger the import
  preloadedRoutes.add(key);
  importFunc().catch((err) => {
    console.error("Error preloading route:", err);
    // Remove from preloaded set so it can be tried again later
    preloadedRoutes.delete(key);
  });
}

/**
 * Preload dashboard routes that are likely to be visited
 */
export function preloadDashboardRoutes(): void {
  // Preload common dashboard routes
  setTimeout(() => {
    preloadRoute(() => import("../components/pages/Dashboard"));
    preloadRoute(() => import("../components/pages/Projects"));
    preloadRoute(() => import("../components/pages/Profile"));
  }, 2000); // Delay to prioritize current route loading
}

/**
 * Preload routes based on the current route
 * @param currentPath - Current route path
 */
export function preloadRelatedRoutes(currentPath: string): void {
  // Wait until after the current page has loaded
  setTimeout(() => {
    // Preload related routes based on current path
    if (currentPath.includes("/dashboard")) {
      preloadRoute(() => import("../components/pages/Dashboard"));
    }

    if (currentPath.includes("/projects")) {
      preloadRoute(() => import("../components/pages/ProjectDetails"));
      preloadRoute(() => import("../components/pages/FeedbackInterface"));
    }

    if (currentPath.includes("/feedback")) {
      preloadRoute(() => import("../components/pages/FeedbackAnalytics"));
    }
  }, 3000);
}
