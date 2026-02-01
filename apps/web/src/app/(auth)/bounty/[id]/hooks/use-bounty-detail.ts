'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import type { BountyData } from '@/components/bounty/bounty-detail';

export interface UseBountyDetailProps {
  id: string;
  enabled: boolean;
  initialData?: BountyData;
}

export interface UseBountyDetailReturn {
  data: BountyData | undefined;
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  error: Error | null;
}

export function useBountyDetail({
  id,
  enabled,
  initialData,
}: UseBountyDetailProps): UseBountyDetailReturn {
  const queryClient = useQueryClient();

  const queryOptions = trpc.bounties.getBountyDetail.queryOptions({ id });

  const query = useQuery({
    ...queryOptions,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    // Use server-provided initialData to avoid duplicate fetch
    initialData: initialData as typeof queryOptions extends { queryFn: () => Promise<infer T> } ? T : never,
    // Treat 404 errors as "not found" rather than a hard error
    retry: (failureCount, error) => {
      // Don't retry on 404 (bounty not found or deleted)
      if (error?.message?.includes('not found') || error?.message?.includes('Bounty not found')) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });

  // Prefetch related data in parallel to flatten waterfall
  useEffect(() => {
    if (id && enabled) {
      // Prefetch votes and submissions in parallel
      queryClient.prefetchQuery(
        trpc.bounties.getBountyVotes.queryOptions({ bountyId: id })
      );
      queryClient.prefetchQuery(
        trpc.bounties.getBountySubmissions.queryOptions({ bountyId: id })
      );
    }
  }, [id, enabled, queryClient]);

  const isError = query.isError;
  const error = query.error instanceof Error ? query.error : null;

  // Check if the error is specifically a "not found" error
  const isNotFound = Boolean(
    isError &&
    (error?.message?.includes('not found') ||
     error?.message?.includes('Bounty not found') ||
     error?.message?.includes('does not exist'))
  );

  return {
    data: query.data as BountyData | undefined,
    isLoading: query.isLoading,
    isError,
    isNotFound,
    error,
  };
}
