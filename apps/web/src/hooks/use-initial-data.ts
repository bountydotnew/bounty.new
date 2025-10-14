import { authClient } from '@bounty/auth/client';
import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
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
export function useInitialData(enabled = true) {
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
 */
export function usePrefetchInitialData() {
  const { data: session } = authClient.useSession();
  
  useEffect(() => {
    if (session?.user) {
      // Prefetch in parallel - tRPC will batch these into one request
      queryClient.prefetchQuery(trpc.user.getMe.queryOptions());
      queryClient.prefetchQuery(trpc.user.getAccessProfile.queryOptions());
    }
  }, [session?.user]);
}

