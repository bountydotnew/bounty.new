'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { parseAsString, useQueryState } from 'nuqs';
import { BountyListContext, type BountyListContextValue, type SortByOption, type SortOrderOption } from './context';

interface BountyListProviderProps {
  children: React.ReactNode;
}

const DEFAULT_SORT_BY: SortByOption = 'created_at';
const DEFAULT_SORT_ORDER: SortOrderOption = 'desc';

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
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault(DEFAULT_SORT_BY));
  const [sortOrder, setSortOrder] = useQueryState('sortOrder', parseAsString.withDefault(DEFAULT_SORT_ORDER));

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
      sortBy: (sortBy as SortByOption) || DEFAULT_SORT_BY,
      sortOrder: (sortOrder as SortOrderOption) || DEFAULT_SORT_ORDER,
    }),
    enabled: isAuthenticated && !isSessionPending,
    retry: false,
  });

  // Context value
  const contextValue: BountyListContextValue = {
    state: {
      bounties: bounties?.data ?? [],
      isLoading,
      error: error instanceof Error ? error : null,
      filters: {
        search: search ?? null,
        creatorId: creatorId ?? null,
        sortBy: (sortBy as SortByOption) ?? DEFAULT_SORT_BY,
        sortOrder: (sortOrder as SortOrderOption) ?? DEFAULT_SORT_ORDER,
      },
    },
    actions: {
      setSearch: (value) => setSearch(value ?? ''),
      setCreatorId: (value) => setCreatorId(value ?? ''),
      setSortBy: (value) => setSortBy(value),
      setSortOrder: (value) => setSortOrder(value),
      resetFilters: () => {
        setSearch(null);
        setCreatorId(null);
        setSortBy(DEFAULT_SORT_BY);
        setSortOrder(DEFAULT_SORT_ORDER);
      },
      refetch: () => refetch(),
    },
    meta: {
      totalCount: bounties?.data?.length ?? 0,
    },
  };

  return (
    <BountyListContext value={contextValue}>
      {children}
    </BountyListContext>
  );
}

// Export context for use in consuming components
export { BountyListContext } from './context';
