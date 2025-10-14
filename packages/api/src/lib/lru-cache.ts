/**
 * LRU (Least Recently Used) Cache wrapper around lru-cache npm package
 *
 * This wrapper provides a consistent API while using the battle-tested lru-cache library.
 */

import { LRUCache as LRU } from "lru-cache";

export interface LRUCacheOptions<V> {
  /**
   * Maximum number of items to store in the cache
   */
  maxSize: number;

  /**
   * Time-to-live in milliseconds. Items expire after this duration.
   * If not set, items never expire based on time.
   */
  ttl?: number;

  /**
   * Optional callback called when an item is evicted from the cache
   */
  onEvict?: (key: string, value: V) => void;
}

export class LRUCache<V extends {} = Record<string, unknown>> {
  private cache: LRU<string, V>;
  private onEvict: ((key: string, value: V) => void) | undefined;

  constructor(options: LRUCacheOptions<V>) {
    this.onEvict = options.onEvict;

    this.cache = new LRU<string, V>({
      max: options.maxSize,
      ttl: options.ttl,
      dispose: options.onEvict
        ? (value, key) => {
            this.onEvict?.(key, value);
          }
        : undefined,
    });
  }

  /**
   * Get a value from the cache
   */
  get(key: string): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: V): void {
    this.cache.set(key, value);
  }

  /**
   * Check if a key exists in the cache (without updating access time)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
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
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache (from most to least recently used)
   */
  keys(): string[] {
    return [...this.cache.keys()];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    // Note: lru-cache doesn't expose timestamps directly, but we can provide size info
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }
}

/**
 * Creates a memoized version of an async function with LRU caching
 *
 * @param fn - The async function to memoize
 * @param options - Cache options
 * @param keyGenerator - Optional function to generate cache keys from arguments
 * @returns Memoized function with cache methods
 */
export const createMemoizedFunction = <Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: LRUCacheOptions<Result>,
  keyGenerator?: (...args: Args) => string
) => {
  const cache = new LRUCache<Result>(options);

  const defaultKeyGenerator = (...args: Args): string => {
    return JSON.stringify(args);
  };

  const getKey = keyGenerator ?? defaultKeyGenerator;

  const memoized = async (...args: Args): Promise<Result> => {
    const key = getKey(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };

  return {
    execute: memoized,
    cache,
    invalidate: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
  };
};
