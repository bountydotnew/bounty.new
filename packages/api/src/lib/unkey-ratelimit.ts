import { Ratelimit } from '@unkey/ratelimit';
import { env } from '@bounty/env/server';
import { TRPCError } from '@trpc/server';

// ---------------------------------------------------------------------------
// Namespace configs
// ---------------------------------------------------------------------------

const NAMESPACES = {
  /** Redeeming invite codes — strict to prevent brute force */
  'invite.redeem': { limit: 5, duration: '60s' as const },
  /** Generating invite codes (admin) */
  'invite.generate': { limit: 20, duration: '60s' as const },
  /** Setting a username */
  'user.setHandle': { limit: 5, duration: '60s' as const },
  /** Checking username availability */
  'user.checkHandle': { limit: 20, duration: '60s' as const },
  /** Joining the waitlist */
  waitlist1: { limit: 3, duration: '60s' as const },
} as const;

export type UnkeyNamespace = keyof typeof NAMESPACES;

// ---------------------------------------------------------------------------
// Limiter cache
// ---------------------------------------------------------------------------

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(namespace: UnkeyNamespace): Ratelimit | null {
  if (!env.UNKEY_ROOT_KEY) return null;

  const cached = limiterCache.get(namespace);
  if (cached) return cached;

  const config = NAMESPACES[namespace];
  const limiter = new Ratelimit({
    rootKey: env.UNKEY_ROOT_KEY,
    namespace,
    limit: config.limit,
    duration: config.duration,
  });

  limiterCache.set(namespace, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check Unkey rate limit for a given namespace and identifier.
 *
 * Returns `{ success: true, remaining }` if allowed.
 * Throws `TRPCError` with code `TOO_MANY_REQUESTS` if denied.
 * If Unkey is not configured (no `UNKEY_ROOT_KEY`), silently allows all requests.
 */
export async function checkUnkeyRateLimit(
  namespace: UnkeyNamespace,
  identifier: string
): Promise<{ success: true; remaining: number }> {
  const limiter = getLimiter(namespace);

  // If Unkey is not configured, allow all (development fallback)
  if (!limiter) {
    return { success: true, remaining: -1 };
  }

  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'whoaaaa, slow down there pal',
      });
    }

    return { success: true, remaining: result.remaining };
  } catch (err) {
    // Re-throw rate limit errors, but silently allow on infrastructure failures
    // (deleted namespace, network issues, etc.)
    if (err instanceof TRPCError) throw err;
    return { success: true, remaining: -1 };
  }
}
