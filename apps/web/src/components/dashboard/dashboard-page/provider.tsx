'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { DashboardPageContext, type DashboardPageContextValue } from './context';

// Export context for use in consuming components
export { DashboardPageContext } from './context';

interface DashboardPageProviderProps {
  children: React.ReactNode;
}

/**
 * DashboardPageProvider
 *
 * Provider component that implements the DashboardPageContext interface.
 * Handles all data fetching and state management for the dashboard page.
 */
export function DashboardPageProvider({ children }: DashboardPageProviderProps) {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const taskInputRef = useRef<{ focus: () => void } | null>(null);

  // Queries - only run when authenticated
  const bounties = useQuery({
    ...trpc.bounties.fetchAllBounties.queryOptions({
      page: PAGINATION_DEFAULTS.PAGE,
      limit: PAGINATION_LIMITS.ALL_BOUNTIES,
    }),
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000,
  });

  const myBounties = useQuery({
    ...trpc.bounties.fetchMyBounties.queryOptions({
      page: PAGINATION_DEFAULTS.PAGE,
      limit: PAGINATION_LIMITS.MY_BOUNTIES,
    }),
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000,
  });

  // TODO: Re-enable onboarding when needed
  // const onboardingQuery = useQuery({
  //   ...trpc.onboarding.getState.queryOptions(),
  //   staleTime: 5 * 60 * 1000,
  // });

  // Context value - memoized to prevent unnecessary re-renders
  const contextValue: DashboardPageContextValue = {
    state: {
      bounties: bounties.data?.data ?? [],
      myBounties: myBounties.data?.data ?? [],
      onboardingState: null, // onboardingQuery.data ?? null,
      isBountiesLoading: bounties.isLoading,
      isMyBountiesLoading: myBounties.isLoading,
      isOnboardingLoading: false, // onboardingQuery.isLoading,
      bountiesError: bounties.error instanceof Error ? bounties.error : null,
      myBountiesError: myBounties.error instanceof Error ? myBounties.error : null,
    },
    actions: {
      refetchBounties: () => bounties.refetch(),
      refetchMyBounties: () => myBounties.refetch(),
      focusTaskInput: () => taskInputRef.current?.focus(),
    },
    meta: {
      taskInputRef,
    },
  };

  return (
    <DashboardPageContext value={contextValue}>
      {children}
    </DashboardPageContext>
  );
}
