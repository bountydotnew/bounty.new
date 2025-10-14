/**
 * LRU (Least Recently Used) Cache implementation
 *
 * This cache automatically evicts the least recently used items when the cache is full.
 * Thread-safe for concurrent access patterns in Node.js.
 */

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

interface CacheNode<V> {
  key: string;
  value: V;
  timestamp: number;
  prev: CacheNode<V> | null;
  next: CacheNode<V> | null;
}

export class LRUCache<V = unknown> {
  private maxSize: number;
  private ttl: number | null;
  private onEvict: ((key: string, value: V) => void) | undefined;
  private cache: Map<string, CacheNode<V>>;
  private head: CacheNode<V> | null;
  private tail: CacheNode<V> | null;

  constructor(options: LRUCacheOptions<V>) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl ?? null;
    this.onEvict = options.onEvict ?? undefined;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
  }

  /**
   * Get a value from the cache
   */
  get(key: string): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      return undefined;
    }

    // Check if expired
    if (this.ttl && Date.now() - node.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);

    return node.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      existingNode.timestamp = Date.now();
      this.moveToFront(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode<V> = {
      key,
      value,
      timestamp: Date.now(),
      prev: null,
      next: null,
    };

    // Add to cache
    this.cache.set(key, newNode);
    this.addToFront(newNode);

    // Evict if over capacity
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Check if a key exists in the cache (without updating access time)
   */
  has(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    // Check if expired
    if (this.ttl && Date.now() - node.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);

    if (this.onEvict) {
      this.onEvict(key, node.value);
    }

    return true;
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    if (this.onEvict) {
      for (const [key, node] of this.cache.entries()) {
        this.onEvict(key, node.value);
      }
    }

    this.cache.clear();
    this.head = null;
    this.tail = null;
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
    const keys: string[] = [];
    let current = this.head;

    while (current) {
      keys.push(current.key);
      current = current.next;
    }

    return keys;
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
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestTimestamp: this.tail?.timestamp ?? null,
      newestTimestamp: this.head?.timestamp ?? null,
    };
  }

  private moveToFront(node: CacheNode<V>): void {
    if (node === this.head) {
      return;
    }

    this.removeNode(node);
    this.addToFront(node);
  }

  private addToFront(node: CacheNode<V>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const key = this.tail.key;
    const value = this.tail.value;

    this.removeNode(this.tail);
    this.cache.delete(key);

    if (this.onEvict) {
      this.onEvict(key, value);
    }
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
