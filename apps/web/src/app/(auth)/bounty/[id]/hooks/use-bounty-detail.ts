'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import type { BountyData } from '@/components/bounty/bounty-detail';

export interface UseBountyDetailProps {
  id: string;
  enabled: boolean;
}

export interface UseBountyDetailReturn {
  data: BountyData;
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  error: Error | null;
}

export function useBountyDetail({
  id,
  enabled,
}: UseBountyDetailProps): UseBountyDetailReturn {
  const query = useQuery({
    ...trpc.bounties.getBountyDetail.queryOptions({ id }),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
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

  const isError = query.isError;
  const error = query.error as Error | null;

  // Check if the error is specifically a "not found" error
  const isNotFound = Boolean(
    isError &&
    (error?.message?.includes('not found') ||
     error?.message?.includes('Bounty not found') ||
     error?.message?.includes('does not exist'))
  );

  return {
    data: query.data as unknown as BountyData,
    isLoading: query.isLoading,
    isError,
    isNotFound,
    error,
  };
}
