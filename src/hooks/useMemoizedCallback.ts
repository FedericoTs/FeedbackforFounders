import { useCallback, useRef } from "react";

/**
 * A hook that memoizes a callback function and ensures it maintains referential equality
 * even when dependencies change, as long as the function signature remains the same.
 *
 * This is useful for callbacks passed to memoized child components to prevent unnecessary re-renders.
 *
 * @param callback The function to memoize
 * @param dependencies Dependencies array that triggers recreation of the callback
 * @returns Memoized callback function
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList,
): T {
  // Store the latest callback in a ref to always have access to the latest version
  const callbackRef = useRef<T>(callback);

  // Update the ref whenever the callback changes
  callbackRef.current = callback;

  // Create a stable callback that delegates to the current callback in the ref
  return useCallback(
    ((...args: any[]) => {
      return callbackRef.current(...args);
    }) as T,
    dependencies,
  );
}
