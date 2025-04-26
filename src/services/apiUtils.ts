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
  },
) {
  const { cacheKeyPrefix, ttl } = options;

  return async (params: P): Promise<T> => {
    const cacheKey = requestCache.createKey(cacheKeyPrefix, params);

    return requestCache.withCache(
      () => retryWithBackoff(() => queryFn(params)),
      { key: cacheKey, ttl },
    );
  };
}
