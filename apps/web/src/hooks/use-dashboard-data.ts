import { useQueries } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

interface UseDashboardDataOptions {
  enabled?: boolean;
  bountiesLimit?: number;
  myBountiesLimit?: number;
}

/**
 * Hook to batch-fetch all dashboard data in a single request
 * 
 * Fetches:
 * - All bounties
 * - User's bounties
 * - Beta application status
 * - User profile (if not already cached)
 */
export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const {
    enabled = true,
    bountiesLimit = 50,
    myBountiesLimit = 10,
  } = options;

  // Batch all dashboard queries - tRPC will combine into one HTTP request
  const queries = useQueries({
    queries: [
      {
        ...trpc.bounties.fetchAllBounties.queryOptions({
          page: 1,
          limit: bountiesLimit,
        }),
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
      {
        ...trpc.bounties.fetchMyBounties.queryOptions({
          page: 1,
          limit: myBountiesLimit,
        }),
        enabled,
        staleTime: 1 * 60 * 1000, // 1 minute
      },
      {
        ...trpc.betaApplications.checkExisting.queryOptions(),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        ...trpc.user.getMe.queryOptions(),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes - likely cached from initial load
      },
    ],
  });

  const [bountiesQuery, myBountiesQuery, betaAppQuery, userQuery] = queries;

  return {
    bounties: bountiesQuery.data,
    myBounties: myBountiesQuery.data,
    betaApplication: betaAppQuery.data,
    user: userQuery.data,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    errors: queries.filter((q) => q.error).map((q) => q.error),
    refetch: () => {
      bountiesQuery.refetch();
      myBountiesQuery.refetch();
      betaAppQuery.refetch();
      userQuery.refetch();
    },
  };
}

