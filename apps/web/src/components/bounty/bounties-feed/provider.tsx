'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import type { Bounty } from '@/types/dashboard';
import { trpc, trpcClient } from '@/utils/trpc';
import {
  BountiesFeedContext,
  type BountiesFeedContextValue,
  type BountiesFeedActions,
  type BountiesFeedMeta,
} from './context';

interface BountiesFeedProviderProps {
  children: ReactNode;
  /** The list of bounties to display */
  bounties?: Bounty[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object if present */
  error?: Error | null;
  /** Optional title to display */
  title?: string;
  /** CSS class name to apply */
  className?: string;
}

/**
 * BountiesFeed Provider
 *
 * Wraps the feed with state and actions following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <BountiesFeedProvider
 *   bounties={bounties}
 *   isLoading={isLoading}
 *   isError={isError}
 *   title="My Bounties"
 * >
 *   <BountiesFeed.ListView />
 * </BountiesFeedProvider>
 * ```
 */
export function BountiesFeedProvider({
  bounties = [],
  isLoading,
  isError,
  error = null,
  title,
  className = '',
  children,
}: BountiesFeedProviderProps) {
  const queryClient = useQueryClient();

  // Fetch stats for all bounties
  const ids = useMemo(() => bounties.map((b) => b.id), [bounties]);
  const statsQuery = useQuery({
    ...trpc.bounties.getBountyStatsMany.queryOptions({ bountyIds: ids }),
    enabled: ids.length > 0,
  });

  const statsMap = useMemo(() => {
    const m = new Map<
      string,
      {
        commentCount: number;
        voteCount: number;
        submissionCount: number;
        isVoted: boolean;
        bookmarked: boolean;
      }
    >();
    const stats = statsQuery.data?.stats ?? [];
    for (const stat of stats) {
      m.set(stat.bountyId, stat);
    }
    return m;
  }, [statsQuery.data]);

  // Delete bounty mutation
  const deleteBountyMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.bounties.deleteBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully');
      // Invalidate all bounty-related queries to refresh the list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key.length > 0) {
            const firstPart = key[0];
            if (Array.isArray(firstPart) && firstPart[0] === 'bounties') {
              return true;
            }
            if (typeof firstPart === 'string' && firstPart === 'bounties') {
              return true;
            }
          }
          return false;
        },
      });
    },
    onError: (err: Error) => {
      toast.error(`Failed to delete bounty: ${err.message}`);
    },
  });

  // Actions object
  const actions: BountiesFeedActions = useMemo(
    () => ({
      deleteBounty: (bountyId: string) => {
        deleteBountyMutation.mutate({ id: bountyId });
      },
    }),
    [deleteBountyMutation]
  );

  // State object
  const state = useMemo(
    () => ({
      bounties,
      isLoading,
      isError,
      error,
      statsMap,
      title,
    }),
    [bounties, isLoading, isError, error, statsMap, title]
  );

  // Meta object
  const meta: BountiesFeedMeta = useMemo(
    () => ({
      className,
    }),
    [className]
  );

  const contextValue: BountiesFeedContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <BountiesFeedContext.Provider value={contextValue}>
      {children}
    </BountiesFeedContext.Provider>
  );
}
