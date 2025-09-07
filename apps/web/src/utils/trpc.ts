import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error((error as any)?.message ?? 'Request failed', {
        action: {
          label: 'retry',
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

const orpcLink = new RPCLink({
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

const orpcClient = createORPCClient<any>(orpcLink) as any;

function createOptionsProxy(path: string[]): any {
  const getProcedure = () => path.reduce((acc, key) => acc[key], orpcClient);

  const proxyTarget = () => {};
  return new Proxy(proxyTarget, {
    get(_target, prop) {
      if (prop === 'queryOptions') {
        return (input?: unknown) => ({
          queryKey: ['orpc', ...path, input ?? null],
          queryFn: () => getProcedure()(input as any),
        });
      }
      if (prop === 'mutationOptions') {
        return () => ({
          mutationFn: (input: unknown) => getProcedure()(input as any),
        });
      }
      if (prop === 'queryKey') {
        return (input?: unknown) => ['orpc', ...path, input ?? null] as const;
      }
      return createOptionsProxy([...path, String(prop)]);
    },
  });
}

export const trpc = createOptionsProxy([]);
