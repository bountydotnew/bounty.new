'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { DashboardPageContext, type DashboardPageContextValue, type DashboardPageState, type DashboardPageActions, type DashboardPageMeta } from './context';

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
 *
 * This provider enables dependency injection - the UI components consume
 * the interface, not the implementation.
 */
export function DashboardPageProvider({ children }: DashboardPageProviderProps) {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const taskInputRef = useRef<{ focus: () => void } | null>(null);

  // ===== Queries =====

  // Memoized query options for better performance
  const bountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchAllBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.ALL_BOUNTIES,
      }),
    []
  );

  const myBountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchMyBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.MY_BOUNTIES,
      }),
    []
  );

  // Check onboarding state from database
  const onboardingQuery = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Queries - only run when authenticated, with staleTime to prevent refetching
  const bounties = useQuery({
    ...bountiesQuery,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000, // 2 minutes - bounties can change frequently
  });

  const myBounties = useQuery({
    ...myBountiesQuery,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ===== State =====

  const state: DashboardPageState = useMemo(
    () => ({
      bounties: bounties.data?.data ?? [],
      myBounties: myBounties.data?.data ?? [],
      onboardingState: onboardingQuery.data ?? null,
      isBountiesLoading: bounties.isLoading,
      isMyBountiesLoading: myBounties.isLoading,
      isOnboardingLoading: onboardingQuery.isLoading,
      bountiesError: bounties.error instanceof Error ? bounties.error : null,
      myBountiesError: myBounties.error instanceof Error ? myBounties.error : null,
    }),
    [
      bounties.data?.data,
      bounties.isLoading,
      bounties.error,
      myBounties.data?.data,
      myBounties.isLoading,
      myBounties.error,
      onboardingQuery.data,
      onboardingQuery.isLoading,
    ]
  );

  // ===== Actions =====

  const actions: DashboardPageActions = useMemo(
    () => ({
      refetchBounties: () => bounties.refetch(),
      refetchMyBounties: () => myBounties.refetch(),
      focusTaskInput: () => {
        taskInputRef.current?.focus();
      },
    }),
    [bounties, myBounties]
  );

  // ===== Meta =====

  const meta: DashboardPageMeta = useMemo(
    () => ({
      taskInputRef,
    }),
    []
  );

  // ===== Context Value =====

  const contextValue: DashboardPageContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <DashboardPageContext value={contextValue}>
      {children}
    </DashboardPageContext>
  );
}
