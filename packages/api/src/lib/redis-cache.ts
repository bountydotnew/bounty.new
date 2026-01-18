import { redis } from '@bounty/realtime';

/**
 * Distributed Redis Cache for horizontal scaling
 * Replaces in-memory LRU cache to work across multiple server instances
 */

export interface RedisCacheOptions {
  /** TTL in seconds */
  ttl: number;
  /** Prefix for cache keys */
  prefix: string;
}

export class RedisCache<T> {
  private prefix: string;
  private ttl: number;

  constructor(options: RedisCacheOptions) {
    this.prefix = `bounty:cache:${options.prefix}`;
    this.ttl = options.ttl;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<T | null> {
    try {
      const data = await redis.get<T>(this.getKey(key));
      return data;
    } catch (error) {
      console.error(`[RedisCache] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: T): Promise<void> {
    try {
      await redis.setex(this.getKey(key), this.ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`[RedisCache] Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error(`[RedisCache] Error deleting key ${key}:`, error);
    }
  }

  /**
   * Clear all keys with this prefix
   * Note: Use sparingly in production as SCAN can be slow
   */
  async clear(): Promise<void> {
    try {
      // Use SCAN to find and delete keys (safer than KEYS in production)
      let cursor: number = 0;
      do {
        const result = await redis.scan(cursor, {
          match: `${this.prefix}:*`,
          count: 100,
        });
        cursor = Number(result[0]);
        const keys = result[1] as string[];
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      console.error(`[RedisCache] Error clearing cache:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value);
    return value;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      console.error(`[RedisCache] Error checking key ${key}:`, error);
      return false;
    }
  }
}

// Pre-configured cache instances for common use cases
export const bountyStatsCache = new RedisCache<{
  totalBounties: number;
  activeBounties: number;
  totalBountiesValue: number;
  totalPayout: number;
}>({
  prefix: 'bounty-stats',
  ttl: 300, // 5 minutes
});

export const bountyDetailCache = new RedisCache<{
  bounty: unknown;
  votes: { count: number; isVoted: boolean };
  bookmarked: boolean;
  comments: unknown[];
}>({
  prefix: 'bounty-detail',
  ttl: 120, // 2 minutes
});

export const bountyListCache = new RedisCache<{
  success: boolean;
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>({
  prefix: 'bounty-list',
  ttl: 60, // 1 minute
});

export const userProfileCache = new RedisCache<{
  id: string;
  name: string | null;
  image: string | null;
  email: string;
  bio: string | null;
  githubHandle: string | null;
}>({
  prefix: 'user-profile',
  ttl: 180, // 3 minutes
});

/**
 * Invalidate all bounty-related caches
 * Call this after bounty mutations
 */
export async function invalidateBountyCaches(bountyId?: string): Promise<void> {
  const promises: Promise<void>[] = [
    bountyStatsCache.clear(),
    bountyListCache.clear(),
  ];

  if (bountyId) {
    promises.push(bountyDetailCache.delete(bountyId));
  } else {
    promises.push(bountyDetailCache.clear());
  }

  await Promise.all(promises);
}
