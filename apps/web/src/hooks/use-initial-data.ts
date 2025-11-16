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
 * - Access profile (beta status, feature flags)
 *
 * @param enabled - Whether to fetch data (should be true when user is authenticated)
 */
function useInitialData(enabled = true) {
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;
  const shouldFetch = enabled && isAuthenticated;

  // Batch fetch essential user data in parallel
  const queries = useQueries({
    queries: [
      {
        ...trpc.user.getMe.queryOptions(),
        enabled: shouldFetch,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        ...trpc.user.getAccessProfile.queryOptions(),
        enabled: shouldFetch,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
      },
    ],
  });

  const [meQuery, accessProfileQuery] = queries;

  return {
    me: meQuery.data,
    accessProfile: accessProfileQuery.data,
    isLoading: meQuery.isLoading || accessProfileQuery.isLoading,
    isError: meQuery.isError || accessProfileQuery.isError,
    error: meQuery.error || accessProfileQuery.error,
  };
}

/**
 * Hook to prefetch initial data on mount
 *
 * This triggers the initial data fetch and caches it for the entire session.
 * Use this at the root of your app to warm up the cache.
 *
 * Prefetches:
 * - User profile (tRPC - batched)
 * - Access profile (tRPC - batched)
 * - Billing/subscription data (Better Auth - separate request)
 */
export function usePrefetchInitialData() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Prefetch tRPC queries - these will be batched into one HTTP request
      queryClient.prefetchQuery(trpc.user.getMe.queryOptions());
      queryClient.prefetchQuery(trpc.user.getAccessProfile.queryOptions());

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
    }
  }, [session?.user]);
}
