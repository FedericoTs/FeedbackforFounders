/**
 * Request Cache Utility
 *
 * This utility provides caching functionality for API requests to reduce redundant network calls
 * and improve application performance.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** Cache expiration time in milliseconds */
  ttl?: number;
  /** Cache key to use (defaults to the request URL) */
  key?: string;
  /** Whether to bypass the cache for this request */
  bypassCache?: boolean;
  /** Whether to use stale-while-revalidate pattern */
  staleWhileRevalidate?: boolean;
}

class RequestCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL
  private revalidating: Set<string> = new Set();

  /**
   * Set the default TTL for all cache items
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Get an item from the cache, including stale data
   */
  getStale<T>(key: string): { data: T | null; isStale: boolean } {
    const item = this.cache.get(key);
    if (!item) return { data: null, isStale: false };

    const now = Date.now();
    const isStale = now > item.expiresAt;

    return {
      data: item.data as T,
      isStale,
    };
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items from the cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Wrap a promise-returning function with caching
   */
  async withCache<T>(
    fn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const {
      ttl = this.defaultTTL,
      key = fn.toString(),
      bypassCache = false,
      staleWhileRevalidate = false,
    } = options;

    // Bypass cache if requested
    if (bypassCache) {
      const data = await fn();
      this.set(key, data, ttl);
      return data;
    }

    // Check cache first
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    // Check for stale data if using stale-while-revalidate
    if (staleWhileRevalidate) {
      const { data: staleData, isStale } = this.getStale<T>(key);

      if (staleData !== null && isStale && !this.revalidating.has(key)) {
        // Mark as revalidating to prevent multiple simultaneous requests
        this.revalidating.add(key);

        // Revalidate in background
        setTimeout(async () => {
          try {
            const freshData = await fn();
            this.set(key, freshData, ttl);
          } catch (error) {
            console.error(`Error revalidating cache for key ${key}:`, error);
          } finally {
            this.revalidating.delete(key);
          }
        }, 0);

        // Return stale data immediately
        return staleData;
      }
    }

    // If not in cache, call the function
    const data = await fn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Create a cache key from parameters
   */
  createKey(base: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          if (params[key] !== undefined && params[key] !== null) {
            acc[key] = params[key];
          }
          return acc;
        },
        {} as Record<string, any>,
      );

    return `${base}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const item of this.cache.values()) {
      if (now <= item.expiresAt) {
        validItems++;
      } else {
        expiredItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      revalidatingCount: this.revalidating.size,
    };
  }

  /**
   * Invalidate all cache entries that match a prefix
   */
  invalidateByPrefix(keyPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const requestCache = new RequestCache();

/**
 * Decorator for caching class methods
 */
export function cached(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey =
        options.key ||
        `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;

      return requestCache.withCache(() => originalMethod.apply(this, args), {
        ...options,
        key: cacheKey,
      });
    };

    return descriptor;
  };
}

/**
 * Batch multiple requests together
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((request) => request()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Retry a failed request with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  } = {},
): Promise<T> {
  const { maxRetries = 3, initialDelay = 300, maxDelay = 5000 } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        maxDelay,
        initialDelay * Math.pow(2, attempt) * (0.9 + Math.random() * 0.2),
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
