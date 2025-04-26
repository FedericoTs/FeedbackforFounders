/**
 * useOptimizedQuery Hook
 *
 * A React hook for making optimized API requests with caching, pagination, and error handling.
 */

import { useState, useEffect, useCallback } from "react";
import { requestCache, retryWithBackoff } from "@/utils/requestCache";

interface QueryOptions<T, P> {
  /** Function that fetches data */
  queryFn: (params: P) => Promise<T>;
  /** Parameters to pass to the query function */
  params: P;
  /** Whether to enable the query (defaults to true) */
  enabled?: boolean;
  /** Cache key prefix */
  cacheKeyPrefix: string;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Whether to refetch on window focus */
  refetchOnFocus?: boolean;
  /** Whether to refetch on reconnect */
  refetchOnReconnect?: boolean;
  /** Retry options */
  retry?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}

interface QueryResult<T> {
  /** The query data */
  data: T | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is in error state */
  isError: boolean;
  /** The error if the query is in error state */
  error: Error | null;
  /** Function to manually refetch the data */
  refetch: () => Promise<void>;
  /** Function to invalidate the cache and refetch */
  invalidateAndRefetch: () => Promise<void>;
}

/**
 * Hook for making optimized API requests
 */
export function useOptimizedQuery<T, P extends Record<string, any>>(
  options: QueryOptions<T, P>,
): QueryResult<T> {
  const {
    queryFn,
    params,
    enabled = true,
    cacheKeyPrefix,
    cacheTtl = 5 * 60 * 1000, // 5 minutes default
    refetchOnFocus = true,
    refetchOnReconnect = true,
    retry = {
      maxRetries: 3,
      initialDelay: 300,
      maxDelay: 5000,
    },
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Create a stable cache key
  const cacheKey = requestCache.createKey(cacheKeyPrefix, params);

  // Function to fetch data
  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      if (!enabled) return;

      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const result = await requestCache.withCache(
          () => retryWithBackoff(() => queryFn(params), retry),
          { key: cacheKey, ttl: cacheTtl, bypassCache },
        );

        setData(result);
        setIsLoading(false);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    },
    [enabled, queryFn, params, cacheKey, cacheTtl, retry],
  );

  // Function to manually refetch data
  const refetch = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  // Function to invalidate cache and refetch
  const invalidateAndRefetch = useCallback(async () => {
    requestCache.delete(cacheKey);
    await fetchData(true);
  }, [cacheKey, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;

    const onFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refetchOnFocus, fetchData]);

  // Set up refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const onOnline = () => {
      fetchData();
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [refetchOnReconnect, fetchData]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    invalidateAndRefetch,
  };
}

/**
 * Hook for paginated queries
 */
export function usePaginatedQuery<T, P extends Record<string, any>>(
  options: QueryOptions<{ data: T[]; metadata: any }, P> & {
    initialPageSize?: number;
  },
) {
  const { initialPageSize = 10 } = options;
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);

  // Modify params to include pagination
  const paginatedParams = {
    ...options.params,
    limit: pageSize,
    ...(currentCursor ? { cursor: currentCursor } : {}),
  } as P;

  // Use the base query hook
  const query = useOptimizedQuery<{ data: T[]; metadata: any }, P>({
    ...options,
    params: paginatedParams,
  });

  // Function to load the next page
  const loadNextPage = useCallback(async () => {
    if (!query.data?.metadata?.nextCursor) return;
    setCurrentCursor(query.data.metadata.nextCursor);
  }, [query.data]);

  // Function to reset pagination
  const resetPagination = useCallback(() => {
    setCurrentCursor(null);
  }, []);

  return {
    ...query,
    data: query.data?.data || [],
    metadata: query.data?.metadata || { hasMore: false },
    loadNextPage,
    resetPagination,
    setPageSize,
  };
}
