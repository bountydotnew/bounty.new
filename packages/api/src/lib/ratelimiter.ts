import { env } from '@bounty/env/server';
import { Ratelimit } from '@unkey/ratelimit';

const ratelimitCache: Record<string, Ratelimit> = {};

export function getRateLimiter(namespace: string): Ratelimit {
  if (!ratelimitCache[namespace]) {
    ratelimitCache[namespace] = new Ratelimit({
      duration: 60 * 1000,
      limit: 2,
      rootKey: env.UNKEY_ROOT_KEY,
      namespace,
    });
  }
  return ratelimitCache[namespace];
}
