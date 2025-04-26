import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { preloadRelatedRoutes } from "../utils/preloadRoutes";

/**
 * Hook to preload related routes based on the current route
 */
export function useRoutePreloading() {
  const location = useLocation();

  useEffect(() => {
    // Preload related routes when the location changes
    preloadRelatedRoutes(location.pathname);
  }, [location.pathname]);

  // No need to return anything as this is a side-effect only hook
  return null;
}
