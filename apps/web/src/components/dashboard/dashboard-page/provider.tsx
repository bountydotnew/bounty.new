'use client';

import { useQuery } from 'convex/react';
import { useRef, useMemo } from 'react';
import { api } from '@/utils/convex';
import { useSession } from '@/context/session-context';
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import {
  DashboardPageContext,
  type DashboardPageContextValue,
} from './context';

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
export function DashboardPageProvider({
  children,
}: DashboardPageProviderProps) {
  const { isAuthenticated, isPending: isSessionPending } = useSession();
  const taskInputRef = useRef<{ focus: () => void } | null>(null);

  const canFetch = isAuthenticated && !isSessionPending;

  // Queries - only run when authenticated (pass 'skip' to disable)
  const bountiesResult = useQuery(
    api.functions.bounties.fetchAllBounties,
    canFetch
      ? {
          page: PAGINATION_DEFAULTS.PAGE,
          limit: PAGINATION_LIMITS.ALL_BOUNTIES,
        }
      : 'skip'
  );

  const myBountiesResult = useQuery(
    api.functions.bounties.fetchMyBounties,
    canFetch
      ? {
          page: PAGINATION_DEFAULTS.PAGE,
          limit: PAGINATION_LIMITS.MY_BOUNTIES,
        }
      : 'skip'
  );

  // TODO: getBountyStatsMany does not exist in Convex yet.
  // Convex queries are reactive, so prefetching is not needed.
  // When getBountyStatsMany is added to Convex, individual bounty stats
  // can be fetched reactively via useQuery in consuming components.

  const bountiesData = bountiesResult?.bounties;
  const myBountiesData = myBountiesResult?.bounties;

  const state = useMemo(
    () => ({
      bounties: bountiesData ?? [],
      myBounties: myBountiesData ?? [],
      onboardingState: null as null,
      isBountiesLoading: bountiesResult === undefined,
      isMyBountiesLoading: myBountiesResult === undefined,
      isOnboardingLoading: false,
      bountiesError: null,
      myBountiesError: null,
    }),
    [bountiesData, myBountiesData, bountiesResult, myBountiesResult]
  );

  // Convex queries are reactive — no manual refetch needed.
  // These are kept as no-ops for interface compatibility.
  const actions = useMemo(
    () => ({
      refetchBounties: () => {},
      refetchMyBounties: () => {},
      focusTaskInput: () => taskInputRef.current?.focus(),
    }),
    []
  );

  const meta = useMemo(() => ({ taskInputRef }), []);

  const contextValue: DashboardPageContextValue = useMemo(
    () => ({ state, actions, meta }),
    [state, actions, meta]
  );

  return (
    <DashboardPageContext value={contextValue}>{children}</DashboardPageContext>
  );
}
