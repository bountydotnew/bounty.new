import type { orpcRouter } from '@bounty/api';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const link = new RPCLink({
  url: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/orpc`,
  fetch(input: RequestInfo | URL, init?: RequestInit) {
    return fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    });
  },
});

export const orpc = createORPCClient<any>(link) as any;

