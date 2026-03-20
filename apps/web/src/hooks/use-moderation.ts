'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from '@/context/toast';
import { trpc, trpcClient } from '@/utils/trpc';

type ContentType = 'bounty' | 'comment' | 'submission';
type ModerationStatus = 'approved' | 'rejected';

/**
 * Hook for moderation functionality
 *
 * Provides:
 * - Fetching pending moderation flags (admin)
 * - Flagging content for review
 * - Approving/rejecting flags (admin)
 *
 * @example
 * // In admin moderation panel
 * const { pendingFlags, approveFlag, rejectFlag } = useModeration();
 *
 * @example
 * // Flag content when profanity is detected (but allowed through)
 * const { flagContent } = useModeration();
 * flagContent('bounty', bountyId, 'profanity', 'matched: f***');
 */
export function useModeration() {
  const queryClient = useQueryClient();

  // Fetch pending flags (admin only)
  const pendingFlagsQuery = useQuery({
    ...trpc.moderation.getPendingFlags.queryOptions({ limit: 50, offset: 0 }),
    staleTime: 30_000, // 30 seconds
  });

  // Get pending count (admin only)
  const pendingCountQuery = useQuery({
    ...trpc.moderation.getPendingCount.queryOptions(),
    staleTime: 30_000,
  });

  // Flag content mutation
  const flagMutation = useMutation({
    mutationFn: (input: {
      contentType: ContentType;
      contentId: string;
      reason: string;
      flaggedText?: string;
    }) => trpcClient.moderation.flagContent.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [['moderation', 'getPendingFlags']],
      });
      queryClient.invalidateQueries({
        queryKey: [['moderation', 'getPendingCount']],
      });
    },
  });

  // Review flag mutation (admin)
  const reviewMutation = useMutation({
    mutationFn: (input: {
      flagId: string;
      status: ModerationStatus;
      reviewNotes?: string;
    }) => trpcClient.moderation.reviewFlag.mutate(input),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({
        queryKey: [['moderation', 'getPendingFlags']],
      });
      queryClient.invalidateQueries({
        queryKey: [['moderation', 'getPendingCount']],
      });
      toast.success(status === 'approved' ? 'Content approved' : 'Content rejected');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Review failed');
    },
  });

  /**
   * Flag content for moderation review
   */
  const flagContent = useCallback(
    (
      contentType: ContentType,
      contentId: string,
      reason: string,
      flaggedText?: string
    ) => {
      flagMutation.mutate({ contentType, contentId, reason, flaggedText });
    },
    [flagMutation]
  );

  /**
   * Approve a moderation flag (admin)
   */
  const approveFlag = useCallback(
    (flagId: string, reviewNotes?: string) => {
      reviewMutation.mutate({ flagId, status: 'approved', reviewNotes });
    },
    [reviewMutation]
  );

  /**
   * Reject a moderation flag (admin)
   */
  const rejectFlag = useCallback(
    (flagId: string, reviewNotes?: string) => {
      reviewMutation.mutate({ flagId, status: 'rejected', reviewNotes });
    },
    [reviewMutation]
  );

  /**
   * Refetch pending flags
   */
  const refetch = useCallback(() => {
    pendingFlagsQuery.refetch();
    pendingCountQuery.refetch();
  }, [pendingFlagsQuery, pendingCountQuery]);

  return {
    // Data
    pendingFlags: pendingFlagsQuery.data ?? [],
    pendingCount: pendingCountQuery.data ?? 0,

    // Loading states
    isLoadingFlags: pendingFlagsQuery.isLoading,
    isLoadingCount: pendingCountQuery.isLoading,

    // Errors
    flagsError: pendingFlagsQuery.error,
    countError: pendingCountQuery.error,

    // Actions
    flagContent,
    approveFlag,
    rejectFlag,
    refetch,

    // Mutation states
    isFlagging: flagMutation.isPending,
    isReviewing: reviewMutation.isPending,
  } as const;
}
