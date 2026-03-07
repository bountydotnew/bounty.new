'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { DashboardPageContext, type DashboardPageContextValue } from './context';

// Export context for use in consuming components
export { DashboardPageContext } from './context';

interface DashboardPageProviderProps {
  children: React.ReactNode;
  initialAllBounties?: unknown;
}

/**
 * DashboardPageProvider
 *
 * Provider component that implements the DashboardPageContext interface.
 * Handles all data fetching and state management for the dashboard page.
 */
export function DashboardPageProvider({ children, initialAllBounties }: DashboardPageProviderProps) {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const taskInputRef = useRef<{ focus: () => void } | null>(null);
  const queryClient = useQueryClient();

  const allBountiesOptions = trpc.bounties.fetchAllBounties.queryOptions({
    page: PAGINATION_DEFAULTS.PAGE,
    limit: PAGINATION_LIMITS.ALL_BOUNTIES,
  });

  // Queries - only run when authenticated
  const bounties = useQuery({
    ...allBountiesOptions,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000,
    ...(initialAllBounties
      ? { initialData: initialAllBounties as typeof allBountiesOptions extends { queryFn: () => Promise<infer T> } ? T : never }
      : {}),
  });

  const myBounties = useQuery({
    ...trpc.bounties.fetchMyBounties.queryOptions({
      page: PAGINATION_DEFAULTS.PAGE,
      limit: PAGINATION_LIMITS.MY_BOUNTIES,
    }),
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000,
  });

  // Prefetch stats for all bounties as soon as they arrive (flatten waterfall)
  useEffect(() => {
    if (bounties.data?.data && bounties.data.data.length > 0) {
      const bountyIds = bounties.data.data.map((b) => b.id);
      queryClient.prefetchQuery(
        trpc.bounties.getBountyStatsMany.queryOptions({ bountyIds })
      );
    }
  }, [bounties.data?.data, queryClient]);

  // Also prefetch stats for myBounties
  useEffect(() => {
    if (myBounties.data?.data && myBounties.data.data.length > 0) {
      const bountyIds = myBounties.data.data.map((b) => b.id);
      queryClient.prefetchQuery(
        trpc.bounties.getBountyStatsMany.queryOptions({ bountyIds })
      );
    }
  }, [myBounties.data?.data, queryClient]);

  // TODO: Re-enable onboarding when needed
  // const onboardingQuery = useQuery({
  //   ...trpc.onboarding.getState.queryOptions(),
  //   staleTime: 5 * 60 * 1000,
  // });

  const bountiesData = bounties.data?.data;
  const myBountiesData = myBounties.data?.data;
  const bountiesError = bounties.error instanceof Error ? bounties.error : null;
  const myBountiesError = myBounties.error instanceof Error ? myBounties.error : null;

  const state = useMemo(
    () => ({
      bounties: bountiesData ?? [],
      myBounties: myBountiesData ?? [],
      onboardingState: null as null,
      isBountiesLoading: bounties.isLoading,
      isMyBountiesLoading: myBounties.isLoading,
      isOnboardingLoading: false,
      bountiesError,
      myBountiesError,
    }),
    [bountiesData, myBountiesData, bounties.isLoading, myBounties.isLoading, bountiesError, myBountiesError]
  );

  const actions = useMemo(
    () => ({
      refetchBounties: () => bounties.refetch(),
      refetchMyBounties: () => myBounties.refetch(),
      focusTaskInput: () => taskInputRef.current?.focus(),
    }),
    [bounties, myBounties]
  );

  const meta = useMemo(() => ({ taskInputRef }), []);

  const contextValue: DashboardPageContextValue = useMemo(
    () => ({ state, actions, meta }),
    [state, actions, meta]
  );

  return (
    <DashboardPageContext value={contextValue}>
      {children}
    </DashboardPageContext>
  );
}
