'use client';

import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import type { BountyData } from '@/components/bounty/bounty-detail';

interface UseBountyDetailProps {
  id: string;
  enabled: boolean;
  initialData?: BountyData;
}

interface UseBountyDetailReturn {
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
  // Convex useQuery returns data directly or undefined while loading.
  // Pass 'skip' when not enabled.
  const queryResult = useQuery(
    api.functions.bounties.getBountyDetail,
    enabled ? { id } : 'skip'
  );

  // Convex queries are reactive — no need for prefetching votes/submissions.
  // Those queries will be subscribed to by the components that need them.

  // Use Convex data if available, otherwise fall back to initialData
  const data = (queryResult ?? initialData) as BountyData | undefined;
  const isLoading = enabled && queryResult === undefined && !initialData;

  // Convex queries throw errors as exceptions in the component tree,
  // but for compatibility we expose the same interface.
  // In practice, error boundaries handle Convex query errors.
  return {
    data,
    isLoading,
    isError: false,
    isNotFound: false,
    error: null,
  };
}
