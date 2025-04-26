/**
 * API Utilities
 *
 * Common utilities for API requests, including pagination, error handling, and optimistic updates.
 */

import { supabase } from "../../supabase/supabase";
import { requestCache, retryWithBackoff } from "@/utils/requestCache";

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total?: number;
    nextCursor?: string;
    hasMore: boolean;
  };
}

/**
 * Create a paginated query for Supabase
 */
export function createPaginatedQuery<T>(
  query: any,
  params: PaginationParams,
): any {
  const { page, limit = 10, cursor, sortBy, sortOrder = "desc" } = params;

  // Apply sorting if specified
  if (sortBy) {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  }

  // Apply pagination
  if (cursor) {
    // Cursor-based pagination
    if (sortOrder === "desc") {
      query = query.lt(sortBy || "created_at", cursor);
    } else {
      query = query.gt(sortBy || "created_at", cursor);
    }
    query = query.limit(limit);
  } else if (page !== undefined) {
    // Page-based pagination
    const start = page * limit;
    const end = start + limit - 1;
    query = query.range(start, end);
  } else {
    // Default limit
    query = query.limit(limit);
  }

  return query;
}

/**
 * Execute a paginated query and format the response
 */
export async function executePaginatedQuery<T>(
  query: any,
  params: PaginationParams,
  options: { countTotal?: boolean; cursorField?: string } = {},
): Promise<PaginatedResponse<T>> {
  const { limit = 10, sortBy = "created_at" } = params;
  const { countTotal = false, cursorField = sortBy } = options;

  try {
    // Get total count if requested
    let total: number | undefined;
    if (countTotal) {
      const countQuery = query.clone();
      const { count, error: countError } = await countQuery.count();
      if (countError) throw countError;
      total = count;
    }

    // Execute the query
    const { data, error } = await query;
    if (error) throw error;

    // Determine if there are more results
    const hasMore = data && data.length === limit;

    // Get the next cursor value from the last item
    let nextCursor: string | undefined;
    if (hasMore && data && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = lastItem[cursorField];
    }

    return {
      data: data || [],
      metadata: {
        total,
        nextCursor,
        hasMore,
      },
    };
  } catch (error) {
    console.error("Error executing paginated query:", error);
    throw error;
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, context: string): never {
  console.error(`API Error in ${context}:`, error);

  // Format the error message
  let errorMessage = "An unexpected error occurred";

  if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error?.error_description) {
    errorMessage = error.error_description;
  } else if (error?.details) {
    errorMessage = error.details;
  }

  // Create a structured error object
  const enhancedError = new Error(errorMessage);
  (enhancedError as any).originalError = error;
  (enhancedError as any).context = context;
  (enhancedError as any).timestamp = new Date().toISOString();

  throw enhancedError;
}

/**
 * Optimistic update helper
 */
export function optimisticUpdate<T>(
  currentData: T[],
  updateFn: (data: T[]) => T[],
  apiFn: () => Promise<any>,
): Promise<T[]> {
  // Apply optimistic update
  const optimisticData = updateFn([...currentData]);

  // Return a promise that resolves to either the API result or the original data on error
  return apiFn()
    .then(() => optimisticData)
    .catch((error) => {
      console.error("Optimistic update failed, reverting:", error);
      return currentData; // Revert to original data on error
    });
}

/**
 * Create a cached query function
 */
export function createCachedQuery<T, P extends Record<string, any>>(
  queryFn: (params: P) => Promise<T>,
  options: {
    cacheKeyPrefix: string;
    ttl?: number;
    staleWhileRevalidate?: boolean;
  },
) {
  const { cacheKeyPrefix, ttl, staleWhileRevalidate = false } = options;

  return async (params: P): Promise<T> => {
    const cacheKey = requestCache.createKey(cacheKeyPrefix, params);

    return requestCache.withCache(
      () => retryWithBackoff(() => queryFn(params)),
      { key: cacheKey, ttl, staleWhileRevalidate },
    );
  };
}

/**
 * Create an optimized query builder for a Supabase table
 */
export function createOptimizedQuery<T>(
  tableName: string,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
    defaultSelect?: string;
  } = {},
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = false,
    defaultSelect = "*",
  } = options;

  return {
    /**
     * Get a single row by ID with caching
     */
    async getById(
      id: string | number,
      select = defaultSelect,
    ): Promise<T | null> {
      const cacheKey = `${tableName}:${id}:${select}`;

      return requestCache.withCache(
        async () => {
          const { data, error } = await supabase
            .from(tableName)
            .select(select)
            .eq("id", id)
            .single();

          if (error) throw error;
          return data as T;
        },
        { key: cacheKey, ttl, staleWhileRevalidate },
      );
    },

    /**
     * Get multiple rows with filtering, ordering, and pagination
     */
    async getMany(
      params: {
        select?: string;
        filter?: Record<string, any>;
        order?: { column: string; ascending?: boolean }[];
        pagination?: { page?: number; pageSize?: number };
      } = {},
    ): Promise<T[]> {
      const {
        select = defaultSelect,
        filter = {},
        order = [],
        pagination = {},
      } = params;

      const cacheKey = `${tableName}:list:${JSON.stringify({ select, filter, order, pagination })}`;

      return requestCache.withCache(
        async () => {
          let query = supabase.from(tableName).select(select);

          // Apply filters
          Object.entries(filter).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (value === null) {
              query = query.is(key, null);
            } else {
              query = query.eq(key, value);
            }
          });

          // Apply ordering
          order.forEach(({ column, ascending = true }) => {
            query = query.order(column, { ascending });
          });

          // Apply pagination
          if (
            pagination.page !== undefined &&
            pagination.pageSize !== undefined
          ) {
            const { page, pageSize } = pagination;
            query = query.range(page * pageSize, (page + 1) * pageSize - 1);
          } else if (pagination.pageSize !== undefined) {
            query = query.limit(pagination.pageSize);
          }

          const { data, error } = await query;

          if (error) throw error;
          return data as T[];
        },
        { key: cacheKey, ttl, staleWhileRevalidate },
      );
    },

    /**
     * Count rows with filtering
     */
    async count(filter: Record<string, any> = {}): Promise<number> {
      const cacheKey = `${tableName}:count:${JSON.stringify(filter)}`;

      return requestCache.withCache(
        async () => {
          let query = supabase
            .from(tableName)
            .select("id", { count: "exact", head: true });

          // Apply filters
          Object.entries(filter).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (value === null) {
              query = query.is(key, null);
            } else {
              query = query.eq(key, value);
            }
          });

          const { count, error } = await query;

          if (error) throw error;
          return count || 0;
        },
        { key: cacheKey, ttl, staleWhileRevalidate },
      );
    },

    /**
     * Invalidate cache for this table
     */
    invalidateCache() {
      requestCache.invalidateByPrefix(`${tableName}:`);
    },

    /**
     * Invalidate cache for a specific ID
     */
    invalidateCacheForId(id: string | number) {
      requestCache.invalidateByPrefix(`${tableName}:${id}:`);
    },
  };
}

/**
 * Add optimistic update functionality to a mutation function
 */
export function withOptimisticUpdate<T, R>(
  mutationFn: (arg: T) => Promise<R>,
  optimisticUpdateFn: (arg: T) => void,
  rollbackFn: (arg: T) => void,
) {
  return async (arg: T): Promise<R> => {
    // Perform optimistic update
    optimisticUpdateFn(arg);

    try {
      // Perform actual mutation
      const result = await mutationFn(arg);
      return result;
    } catch (error) {
      // Rollback optimistic update on error
      rollbackFn(arg);
      throw error;
    }
  };
}

/**
 * Add retry logic to a function
 */
export function withRetry<T, R>(
  fn: (arg: T) => Promise<R>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {},
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = () => true,
  } = options;

  return async (arg: T): Promise<R> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(arg);
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (attempt >= maxRetries || !shouldRetry(error)) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
}
