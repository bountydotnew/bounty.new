'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { parseAsString, useQueryState } from 'nuqs';
import {
  BountyListContext,
  type BountyListContextValue,
  type BountyStatusFilter,
  type SortByOption,
  type SortOrderOption,
} from './context';

interface BountyListProviderProps {
  children: React.ReactNode;
}

const DEFAULT_SORT_BY: SortByOption = 'created_at';
const DEFAULT_SORT_ORDER: SortOrderOption = 'desc';

const ALLOWED_STATUS_FILTERS: BountyStatusFilter[] = [
  'open',
  'in_progress',
  'completed',
  'cancelled',
];

function normalizeStatusFilter(
  value: string | null
): BountyStatusFilter | null {
  if (
    value != null &&
    ALLOWED_STATUS_FILTERS.includes(value as BountyStatusFilter)
  ) {
    return value as BountyStatusFilter;
  }
  return null;
}

/**
 * BountyListProvider
 *
 * Provider component that implements the BountyListContext interface.
 * Handles all data fetching and filter state management for the bounty list page.
 */
export function BountyListProvider({ children }: BountyListProviderProps) {
  const { isAuthenticated, isPending: isSessionPending } = useSession();

  // URL state for filters using nuqs (stable references)
  const [search, setSearch] = useQueryState('search', parseAsString);
  const [creatorId, setCreatorId] = useQueryState('creatorId', parseAsString);
  const [rawStatus, setStatus] = useQueryState('status', parseAsString);
  const status = normalizeStatusFilter(rawStatus);
  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsString.withDefault(DEFAULT_SORT_BY)
  );
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsString.withDefault(DEFAULT_SORT_ORDER)
  );

  // Query
  const {
    data: bounties,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 100,
      search: search || undefined,
      creatorId: creatorId || undefined,
      status: status || undefined,
      sortBy: (sortBy as SortByOption) || DEFAULT_SORT_BY,
      sortOrder: (sortOrder as SortOrderOption) || DEFAULT_SORT_ORDER,
    }),
    enabled: isAuthenticated && !isSessionPending,
    retry: false,
  });

  const bountiesData = bounties?.data;
  const queryError = error instanceof Error ? error : null;

  const state = useMemo(
    () => ({
      bounties: bountiesData ?? [],
      isLoading,
      error: queryError,
      filters: {
        search: search ?? null,
        creatorId: creatorId ?? null,
        status,
        sortBy: (sortBy as SortByOption) ?? DEFAULT_SORT_BY,
        sortOrder: (sortOrder as SortOrderOption) ?? DEFAULT_SORT_ORDER,
      },
    }),
    [bountiesData, isLoading, queryError, search, creatorId, status, sortBy, sortOrder]
  );

  const actions = useMemo(
    () => ({
      setSearch: (value: string | null) => setSearch(value ?? ''),
      setCreatorId: (value: string | null) => setCreatorId(value ?? ''),
      setStatus: (value: BountyStatusFilter | null) => setStatus(value),
      setSortBy: (value: SortByOption) => setSortBy(value),
      setSortOrder: (value: SortOrderOption) => setSortOrder(value),
      resetFilters: () => {
        setSearch(null);
        setCreatorId(null);
        setStatus(null);
        setSortBy(DEFAULT_SORT_BY);
        setSortOrder(DEFAULT_SORT_ORDER);
      },
      refetch: () => refetch(),
    }),
    [setSearch, setCreatorId, setStatus, setSortBy, setSortOrder, refetch]
  );

  const meta = useMemo(
    () => ({ totalCount: bountiesData?.length ?? 0 }),
    [bountiesData?.length]
  );

  const contextValue: BountyListContextValue = useMemo(
    () => ({ state, actions, meta }),
    [state, actions, meta]
  );

  return <BountyListContext value={contextValue}>{children}</BountyListContext>;
}

// Export context for use in consuming components
export { BountyListContext } from './context';
