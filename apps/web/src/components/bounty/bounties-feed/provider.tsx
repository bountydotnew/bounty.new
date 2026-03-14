'use client';

import { useQuery, useMutation } from 'convex/react';
import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { Bounty } from '@/types/dashboard';
import { api } from '@/utils/convex';
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
  // Fetch stats for all bounties
  const ids = useMemo(() => bounties.map((b) => b.id), [bounties]);
  const statsData = useQuery(
    api.functions.bounties.getBountyStatsMany,
    ids.length > 0 ? { bountyIds: ids } : 'skip'
  );

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
    const stats = statsData?.stats ?? [];
    for (const stat of stats) {
      m.set(stat.bountyId, stat);
    }
    return m;
  }, [statsData]);

  const deleteBountyMut = useMutation(api.functions.bounties.deleteBounty);
  const [isDeletingBounty, setIsDeletingBounty] = useState(false);

  const handleDeleteBounty = useCallback(
    async (bountyId: string) => {
      setIsDeletingBounty(true);
      try {
        await deleteBountyMut({ id: bountyId });
        toast.success('Bounty deleted successfully');
      } catch (err) {
        toast.error(`Failed to delete bounty: ${(err as Error).message}`);
      } finally {
        setIsDeletingBounty(false);
      }
    },
    [deleteBountyMut]
  );

  const actions: BountiesFeedActions = useMemo(
    () => ({
      deleteBounty: (bountyId: string) => {
        handleDeleteBounty(bountyId);
      },
    }),
    [handleDeleteBounty]
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
