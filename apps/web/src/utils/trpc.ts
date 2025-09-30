import type { AppRouter } from '@bounty/api';
import { toastError } from '@bounty/ui/lib/toast';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toastError(error.message);
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/trpc`,
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
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
