import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authClient } from '@bounty/auth/client';
import { trpc, queryClient } from '@/utils/trpc';
import { useSession } from '@/context/session-context';

/**
 * Hook to batch-fetch essential data on initial app load
 *
 * This prefetches common queries in parallel, which tRPC will batch
 * into a single HTTP request (if they happen in the same tick).
 *
 * Data fetched:
 * - User profile (getMe)
 *
 * @param enabled - Whether to fetch data (should be true when user is authenticated)
 */
export function useInitialData(enabled = true) {
  const { isAuthenticated } = useSession();
  const shouldFetch = enabled && isAuthenticated;

  // Fetch essential user data
  const meQuery = useQueries({
    queries: [
      {
        ...trpc.user.getMe.queryOptions(),
        enabled: shouldFetch,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    ],
  })[0];

  return {
    me: meQuery.data,
    isLoading: meQuery.isLoading,
    isError: meQuery.isError,
    error: meQuery.error,
  };
}

/**
 * Hook to prefetch initial data on mount
 *
 * This triggers the initial data fetch and caches it for the entire session.
 * Use this at the root of your app to warm up the cache.
 *
 * Prefetches:
 * - User profile (tRPC)
 * - Billing/subscription data (Better Auth - separate request)
 * - Device sessions (Better Auth - for account switcher)
 */
export function usePrefetchInitialData() {
  const { isAuthenticated } = useSession();

  useEffect(() => {
    if (isAuthenticated) {
      // Prefetch tRPC queries
      queryClient.prefetchQuery(trpc.user.getMe.queryOptions());

      // Prefetch billing data (Autumn via tRPC) - runs in parallel
      queryClient.prefetchQuery({
        ...trpc.billing.getCustomerState.queryOptions(),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Prefetch device sessions (Better Auth) - for account switcher
      queryClient.prefetchQuery({
        queryKey: ['auth', 'multiSession', 'listDeviceSessions'],
        queryFn: async () => {
          try {
            const { data, error } =
              await authClient.multiSession.listDeviceSessions();
            if (error) {
              console.error('Failed to prefetch device sessions:', error);
              return [];
            }
            return data || [];
          } catch (error) {
            console.error('Failed to prefetch device sessions:', error);
            return [];
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
      });
    }
  }, [isAuthenticated]);
}
