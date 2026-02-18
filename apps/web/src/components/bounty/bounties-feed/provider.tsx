'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
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
  bounties?: Bounty[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  title?: string;
  className?: string;
}

/**
 * BountiesFeed Provider
 *
 * Wraps the feed with state and actions following Vercel composition patterns.
 */
const EMPTY_BOUNTIES: Bounty[] = [];

export function BountiesFeedProvider({
  bounties = EMPTY_BOUNTIES,
  isLoading = false,
  isError = false,
  error = null,
  title,
  className,
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
    const m = new Map<string, {
      commentCount: number;
      voteCount: number;
      submissionCount: number;
      isVoted: boolean;
      bookmarked: boolean;
    }>();
    const stats = statsQuery.data?.stats ?? [];
    for (const stat of stats) {
      m.set(stat.bountyId, stat);
    }
    return m;
  }, [statsQuery.data]);

  const deleteBountyMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.bounties.deleteBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (Array.isArray(key) && key.length > 0) {
            const firstPart = key[0];
            // Match any query containing 'bounty'
            if (Array.isArray(firstPart) && typeof firstPart[0] === 'string' && firstPart[0].includes('bounty')) {
              return true;
            }
            if (typeof firstPart === 'string' && firstPart.includes('bounty')) {
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

  const actions: BountiesFeedActions = useMemo(
    () => ({
      deleteBounty: (bountyId: string) => {
        deleteBountyMutation.mutate({ id: bountyId });
      },
    }),
    [deleteBountyMutation]
  );

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

