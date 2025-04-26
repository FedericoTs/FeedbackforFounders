import React, { Suspense, lazy, ComponentType } from "react";
import { LoadingSection } from "./loading-page";

interface LazyComponentProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * A utility component for lazy loading components with a consistent loading state
 *
 * @example
 * <LazyComponent
 *   importFunc={() => import("../path/to/component")}
 *   props={{ title: "My Component" }}
 * />
 */
export function LazyComponent({
  importFunc,
  fallback = <LoadingSection />,
  props = {},
}: LazyComponentProps) {
  const Component = lazy(importFunc);

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
