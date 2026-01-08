import { redis } from '@bounty/realtime';

/**
 * Distributed lock for payment operations using Redis
 * Prevents race conditions when multiple requests try to process the same payment
 */

const LOCK_PREFIX = 'bounty:payment-lock';
const DEFAULT_LOCK_TTL = 30; // 30 seconds

export interface LockOptions {
  /** TTL in seconds (default: 30) */
  ttl?: number;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 100) */
  retryDelay?: number;
}

/**
 * Acquire a distributed lock for a bounty payment operation
 * Returns a release function if successful, null if lock couldn't be acquired
 */
export async function acquirePaymentLock(
  bountyId: string,
  options: LockOptions = {}
): Promise<(() => Promise<void>) | null> {
  const { ttl = DEFAULT_LOCK_TTL, maxRetries = 3, retryDelay = 100 } = options;
  const lockKey = `${LOCK_PREFIX}:${bountyId}`;
  const lockValue = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Try to set the lock with NX (only if not exists) and EX (expiration)
    const acquired = await redis.set(lockKey, lockValue, {
      nx: true,
      ex: ttl,
    });

    if (acquired === 'OK') {
      // Lock acquired successfully
      return async () => {
        // Only release if we still hold the lock (compare value)
        const currentValue = await redis.get(lockKey);
        if (currentValue === lockValue) {
          await redis.del(lockKey);
        }
      };
    }

    // Lock not acquired, wait and retry
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  // Couldn't acquire lock after all retries
  return null;
}

/**
 * Execute a payment operation with distributed lock protection
 * Automatically acquires and releases the lock
 */
export async function withPaymentLock<T>(
  bountyId: string,
  operation: () => Promise<T>,
  options?: LockOptions
): Promise<T> {
  const releaseLock = await acquirePaymentLock(bountyId, options);

  if (!releaseLock) {
    throw new PaymentLockError(
      `Could not acquire lock for bounty ${bountyId}. Another payment operation may be in progress.`
    );
  }

  try {
    return await operation();
  } finally {
    await releaseLock();
  }
}

/**
 * Check if a payment lock exists for a bounty
 */
export async function isPaymentLocked(bountyId: string): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}:${bountyId}`;
  const exists = await redis.exists(lockKey);
  return exists === 1;
}

export class PaymentLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentLockError';
  }
}

/**
 * Idempotency key management for Stripe operations
 * Prevents duplicate operations even if our system retries
 */
const IDEMPOTENCY_PREFIX = 'bounty:idempotency';
const IDEMPOTENCY_TTL = 86400; // 24 hours

/**
 * Generate and store an idempotency key for a payment operation
 * Returns the key if it's new, null if the operation was already performed
 */
export async function createIdempotencyKey(
  operation: string,
  bountyId: string,
  additionalContext?: string
): Promise<string | null> {
  const key = `${IDEMPOTENCY_PREFIX}:${operation}:${bountyId}${additionalContext ? `:${additionalContext}` : ''}`;
  const idempotencyKey = `bounty-${operation}-${bountyId}-${Date.now()}`;

  // Check if this operation was already performed
  const existing = await redis.get(key);
  if (existing) {
    return null; // Already processed
  }

  // Store the idempotency key
  await redis.setex(key, IDEMPOTENCY_TTL, idempotencyKey);
  return idempotencyKey;
}

/**
 * Check if an operation was already performed
 */
export async function wasOperationPerformed(
  operation: string,
  bountyId: string,
  additionalContext?: string
): Promise<boolean> {
  const key = `${IDEMPOTENCY_PREFIX}:${operation}:${bountyId}${additionalContext ? `:${additionalContext}` : ''}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Mark an operation as performed (for webhook-style idempotency)
 */
export async function markOperationPerformed(
  operation: string,
  bountyId: string,
  result: string,
  additionalContext?: string
): Promise<void> {
  const key = `${IDEMPOTENCY_PREFIX}:${operation}:${bountyId}${additionalContext ? `:${additionalContext}` : ''}`;
  await redis.setex(key, IDEMPOTENCY_TTL, result);
}
