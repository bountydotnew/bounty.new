import type { AppRouter } from '@bounty/api';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import {
  TRPCClientError,
  createTRPCClient,
  httpBatchLink,
  loggerLink,
} from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { showAppErrorToast } from '@/context/toast';
import type { ReasonCode } from '@bounty/types/auth';

/**
 * tRPC error codes that are expected in normal app flow and should NOT
 * trigger a toast.  These are handled locally by the calling component.
 */
const SILENT_TRPC_CODES = new Set(['NOT_FOUND', 'UNAUTHORIZED', 'BAD_REQUEST']);

function handleGlobalError(error: unknown): void {
  if (!(error instanceof TRPCClientError)) return;

  const data = error.data as { code?: string; reason?: ReasonCode } | undefined;
  const code = data?.code;
  const reason = data?.reason;

  // Suppress expected errors — the calling component handles them
  if (code && SILENT_TRPC_CODES.has(code)) return;

  // Suppress auth/access errors that middleware already handles via redirects
  if (reason === 'unauthenticated' || reason === 'no_active_org') return;

  maybeToastError(error);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default staleTime for all queries (5 minutes)
      // This prevents excessive refetching on component mounts
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes for Suspense transitions
      gcTime: 10 * 60 * 1000,
      // Reduce unnecessary refetches
      refetchOnWindowFocus: false,
      // Retry once on failure
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
});

const toastDeduper = new Map<string, number>();
const CLEANUP_INTERVAL = 60_000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of toastDeduper.entries()) {
    if (now - timestamp > 10_000) {
      // Remove entries older than 10s
      toastDeduper.delete(key);
    }
  }
}, CLEANUP_INTERVAL);
const maybeToastError = (err: unknown): void => {
  if (!(err instanceof TRPCClientError)) {
    return;
  }
  const data = (err as TRPCClientError<AppRouter>).data as unknown;
  const reason =
    typeof data === 'object' &&
    data &&
    'reason' in (data as Record<string, unknown>)
      ? (data as { reason?: ReasonCode }).reason
      : undefined;
  const meta = (err as TRPCClientError<AppRouter>).meta as unknown;
  const isBackground =
    typeof meta === 'object' &&
    meta &&
    'reactQuery' in (meta as Record<string, unknown>)
      ? Boolean((meta as Record<string, unknown>).reactQuery === 'down')
      : false;
  if (
    isBackground &&
    (reason === 'unauthenticated' || reason === 'early_access_required')
  ) {
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
    loggerLink({
      enabled: (opts) => {
        const isDev = process.env.NODE_ENV === 'development';
        if (
          !(
            isDev ||
            (opts.direction === 'down' && opts.result instanceof Error)
          )
        ) {
          return false;
        }
        // In dev, suppress noisy logs for expected tRPC errors (NOT_FOUND, etc.)
        if (
          isDev &&
          opts.direction === 'down' &&
          opts.result instanceof TRPCClientError
        ) {
          const data = (opts.result as TRPCClientError<AppRouter>).data as
            | { code?: string }
            | undefined;
          if (data?.code && SILENT_TRPC_CODES.has(data.code)) {
            return false;
          }
        }
        return true;
      },
    }),
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL || ''}/api/trpc`,
      maxURLLength: 2083,
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        return fetch(input, {
          ...init,
          credentials: 'include',
          headers: {
            ...init?.headers,
            'Content-Type': 'application/json',
          },
        })
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.clone().text();
              try {
                JSON.parse(text);
              } catch {
                /* noop */
              }
            }
            return res;
          })
          .catch((e) => {
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
