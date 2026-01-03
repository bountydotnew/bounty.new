import { authClient } from '@bounty/auth/client';
import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { CustomerState } from '@bounty/types/billing';
import { trpc, queryClient } from '@/utils/trpc';

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
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;
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
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Prefetch tRPC queries
      queryClient.prefetchQuery(trpc.user.getMe.queryOptions());

      // Prefetch billing data (Better Auth) - runs in parallel with tRPC batch
      queryClient.prefetchQuery({
        queryKey: ['billing'],
        queryFn: async (): Promise<CustomerState | null> => {
          try {
            const { data: customerState } = await authClient.customer.state();
            return customerState as CustomerState | null;
          } catch {
            // Fail silently - billing might not be set up yet
            return null;
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
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
  }, [session?.user]);
}
