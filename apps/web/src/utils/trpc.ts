import type { AppRouter } from '@bounty/api';
import { QueryClient } from '@tanstack/react-query';
import { TRPCClientError, createTRPCClient, httpLink, loggerLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { showAppErrorToast } from '@/context/toast';
import type { ReasonCode } from '@bounty/types';

export const queryClient = new QueryClient();

const toastDeduper = new Map<string, number>();
const maybeToastError = (err: unknown): void => {
  if (!(err instanceof TRPCClientError)) {
    return;
  }
  const data = (err as TRPCClientError<AppRouter>).data as unknown;
  const reason =
    typeof data === 'object' && data && 'reason' in (data as Record<string, unknown>)
      ? (data as { reason?: ReasonCode }).reason
      : undefined;
  const meta = (err as TRPCClientError<AppRouter>).meta as unknown;
  const isBackground =
    typeof meta === 'object' && meta && 'reactQuery' in (meta as Record<string, unknown>)
      ? Boolean((meta as Record<string, unknown>).reactQuery === 'down')
      : false;
  if (isBackground && (reason === 'unauthenticated' || reason === 'beta_required')) {
    return;
  }
  const key = `${reason || 'unknown'}:${err.message}`;
  const now = Date.now();
  const last = toastDeduper.get(key) || 0;
  if (now - last < 4000) {
    return;
  }
  toastDeduper.set(key, now);
  showAppErrorToast(reason, { messageOverride: err.message });
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({ enabled: (opts) => {
      const isDev = process.env.NODE_ENV === 'development';
      return isDev || (opts.direction === 'down' && opts.result instanceof Error);
    }}),
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
        }).then(async (res) => {
          if (!res.ok) {
            // Capture body for better error messages
            const text = await res.text();
            try { JSON.parse(text); } catch { /* noop */ }
          }
          return res;
        }).catch((e) => {
          maybeToastError(e);
          throw e;
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
