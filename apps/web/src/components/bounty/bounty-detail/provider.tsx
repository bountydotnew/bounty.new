'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import type { BountyCommentCacheItem } from '@/types/comments';
import { BountyDetailContext, type BountyDetailContextValue, type BountyDetailState, type BountyDetailActions, type BountyDetailMeta } from './context';

interface BountyDetailProviderProps {
  children: React.ReactNode;
  bountyId: string;
  title: string;
  amount: number;
  description: string;
  user: string;
  avatarSrc: string;
  canEditBounty: boolean;
  initialVotes?: { count: number; isVoted: boolean };
  initialComments?: BountyCommentCacheItem[];
  initialBookmarked?: boolean;
  paymentStatus?: string | null;
  createdById?: string;
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;
  githubIssueNumber?: number | null;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * BountyDetailProvider
 *
 * Provider component that implements the BountyDetailContext interface.
 * Handles all data fetching, mutations, and state management for the
 * bounty detail page.
 *
 * This provider enables dependency injection - the UI components consume
 * the interface, not the implementation. This makes testing easier and
 * allows for different state implementations.
 */
export function BountyDetailProvider({
  children,
  bountyId,
  title,
  amount,
  description,
  user,
  avatarSrc,
  canEditBounty,
  initialVotes,
  initialComments,
  initialBookmarked,
  paymentStatus,
  createdById,
  githubRepoOwner,
  githubRepoName,
  githubIssueNumber,
  repositoryUrl,
  issueUrl,
  onEdit,
  onDelete,
}: BountyDetailProviderProps) {
  const queryClient = useQueryClient();
  const { session } = useSession();

  // Local state for cancellation dialog
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // ===== Queries =====

  // Fetch payment status if needed (for creator with pending payment)
  const paymentStatusQuery = useQuery({
    ...trpc.bounties.getBountyPaymentStatus.queryOptions({ bountyId }),
    enabled: Boolean(
      bountyId &&
        session?.user?.id &&
        createdById &&
        createdById === session.user.id &&
        paymentStatus === 'pending'
    ),
  });

  // Fetch votes
  const votesQuery = useQuery({
    ...trpc.bounties.getBountyVotes.queryOptions({ bountyId }),
    initialData: initialVotes,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Fetch comments
  const commentsQuery = useQuery({
    ...trpc.bounties.getBountyComments.queryOptions({ bountyId }),
    initialData: initialComments,
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Fetch submissions (exposed via context for compound components)
  const submissionsQuery = useQuery({
    ...trpc.bounties.getBountySubmissions.queryOptions({ bountyId }),
    staleTime: 10_000, // Refetch every 10 seconds
  });

  // Check if there's a pending cancellation request
  const cancellationStatusQuery = useQuery({
    ...trpc.bounties.getCancellationStatus.queryOptions({ bountyId }),
    enabled: Boolean(session?.user?.id === createdById && (paymentStatus === 'held' || paymentStatus === 'released')),
  });

  // ===== Mutations =====

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (input: { bountyId: string; vote: boolean }) => {
      return await trpcClient.bounties.voteBounty.mutate(input);
    },
  });

  // Delete mutation
  const deleteBountyMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.bounties.deleteBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
      });
      onDelete?.();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete bounty: ${error.message}`);
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.createPaymentForBounty.mutate({
        bountyId,
        origin: window.location.origin,
      });
    },
    onSuccess: (result) => {
      if (result?.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create payment: ${error.message}`);
    },
  });

  // Recheck payment mutation
  const recheckPaymentMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.recheckPaymentStatus.mutate({
        bountyId,
      });
    },
    onSuccess: (result) => {
      if (result.success && result.paymentStatus === 'held') {
        toast.success(
          result.message || 'Payment verified! Bounty is now live.'
        );
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyDetail']],
        });
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'getBountyPaymentStatus']],
        });
      } else {
        toast.info(
          result.message || 'Payment status checked. No changes needed.'
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to recheck payment: ${error.message}`);
    },
  });

  // Request cancellation mutation
  const requestCancellationMutation = useMutation({
    mutationFn: async (input: { bountyId: string; reason?: string }) => {
      return await trpcClient.bounties.requestCancellation.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Cancellation request submitted');
      setShowCancellationDialog(false);
      setCancellationReason('');
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getCancellationStatus']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to request cancellation: ${error.message}`);
    },
  });

  // Cancel cancellation request mutation
  const cancelCancellationRequestMutation = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.cancelCancellationRequest.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Cancellation request withdrawn');
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getCancellationStatus']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel cancellation request: ${error.message}`);
    },
  });

  // ===== Computed State =====

  const isCreator = session?.user?.id === createdById;
  const isFunded = paymentStatus === 'held' || paymentStatus === 'released';
  const isCancelled = paymentStatus === 'refunded';
  const isUnfunded = paymentStatus !== 'held' && paymentStatus !== null;
  const needsPayment = paymentStatus === 'pending' && isCreator;
  const canRequestCancellation = isCreator && isFunded;
  const hasPendingCancellation =
    cancellationStatusQuery.data?.hasPendingRequest ?? false;
  const canDelete = isCreator && (!isFunded || hasPendingCancellation || isCancelled);

  // ===== State =====

  const state: BountyDetailState = useMemo(
    () => ({
      bounty: {
        id: bountyId,
        title,
        amount,
        description,
        user,
        avatarSrc,
        createdById,
        paymentStatus,
        githubRepoOwner,
        githubRepoName,
        githubIssueNumber,
        repositoryUrl,
        issueUrl,
      },
      votes: votesQuery.data ?? null,
      comments: commentsQuery.data,
      bookmarked: initialBookmarked,
      submissions: submissionsQuery.data?.submissions,
      isSubmissionsLoading: submissionsQuery.isLoading,
      isPaymentStatusLoading: paymentStatusQuery.isLoading,
      isCreator,
      canEdit: canEditBounty,
      canDelete,
      isFunded,
      isUnfunded,
      isCancelled,
      canRequestCancellation,
      hasPendingCancellation,
      needsPayment,
      isCancellationStatusLoading: cancellationStatusQuery.isLoading,
    }),
    [
      bountyId,
      title,
      amount,
      description,
      user,
      avatarSrc,
      createdById,
      paymentStatus,
      githubRepoOwner,
      githubRepoName,
      githubIssueNumber,
      repositoryUrl,
      issueUrl,
      votesQuery.data,
      commentsQuery.data,
      submissionsQuery.data?.submissions,
      submissionsQuery.isLoading,
      initialBookmarked,
      paymentStatusQuery.isLoading,
      isCreator,
      canEditBounty,
      canDelete,
      isFunded,
      isUnfunded,
      isCancelled,
      canRequestCancellation,
      hasPendingCancellation,
      needsPayment,
      cancellationStatusQuery.isLoading,
    ]
  );

  // ===== Actions =====

  const actions: BountyDetailActions = useMemo(
    () => ({
      upvote: () => {
        const key = trpc.bounties.getBountyVotes.queryKey({ bountyId });
        const previous = votesQuery.data;
        const next = previous
          ? {
              count: previous.isVoted
                ? Math.max(0, Number(previous.count) - 1)
                : Number(previous.count) + 1,
              isVoted: !previous.isVoted,
            }
          : { count: 1, isVoted: true };
        queryClient.setQueryData(key, next);
        voteMutation.mutate(
          { bountyId, vote: next.isVoted },
          {
            onError: () => {
              if (previous) {
                queryClient.setQueryData(key, previous);
              }
            },
            onSettled: () => {
              queryClient.invalidateQueries({ queryKey: key });
            },
          }
        );
      },
      delete: () => {
        if (
          confirm(
            'Are you sure you want to delete this bounty? This action cannot be undone.'
          )
        ) {
          deleteBountyMutation.mutate({ id: bountyId });
        }
      },
      requestCancellation: useCallback((reason?: string) => {
        if (hasPendingCancellation) {
          toast.error(
            'You already have a pending cancellation request for this bounty.'
          );
          return;
        }
        if (reason !== undefined) {
          // Direct call with reason
          requestCancellationMutation.mutate({
            bountyId,
            reason,
          });
        } else {
          // Show dialog
          setShowCancellationDialog(true);
        }
      }, [bountyId, hasPendingCancellation, requestCancellationMutation]),
      cancelCancellationRequest: () => {
        cancelCancellationRequestMutation.mutate({ bountyId });
      },
      recheckPayment: () => {
        recheckPaymentMutation.mutate();
      },
      completePayment: () => {
        createPaymentMutation.mutate();
      },
      openEditModal: () => {
        onEdit?.();
      },
      share: () => {
        navigator.share({
          title,
          text: description,
          url: `${window.location.origin}/bounty/${bountyId}`,
        });
      },
    }),
    [
      bountyId,
      title,
      description,
      votesQuery.data,
      queryClient,
      voteMutation,
      deleteBountyMutation,
      hasPendingCancellation,
      requestCancellationMutation,
      cancelCancellationRequestMutation,
      recheckPaymentMutation,
      createPaymentMutation,
      onEdit,
    ]
  );

  // ===== Meta =====

  const meta: BountyDetailMeta = useMemo(
    () => ({
      bountyId,
      isDeleting: deleteBountyMutation.isPending,
      isRequestingCancellation: requestCancellationMutation.isPending,
      isCancellingCancellationRequest: cancelCancellationRequestMutation.isPending,
      isRecheckingPayment: recheckPaymentMutation.isPending,
      isCreatingPayment: createPaymentMutation.isPending,
    }),
    [
      bountyId,
      deleteBountyMutation.isPending,
      requestCancellationMutation.isPending,
      cancelCancellationRequestMutation.isPending,
      recheckPaymentMutation.isPending,
      createPaymentMutation.isPending,
    ]
  );

  // ===== Context Value =====

  const contextValue: BountyDetailContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <BountyDetailContext value={contextValue}>
      {children}
      {/* Cancellation dialog is rendered here but can be accessed via compound component */}
      <CancellationDialog
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        onConfirm={() => {
          if (!canRequestCancellation || requestCancellationMutation.isPending) {
            return;
          }
          requestCancellationMutation.mutate({
            bountyId,
            reason: cancellationReason || undefined,
          });
        }}
        isPending={requestCancellationMutation.isPending}
      />
    </BountyDetailContext>
  );
}

// ===== Internal Components =====

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function CancellationDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
  isPending,
}: CancellationDialogProps) {
  const { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } =
    require('@bounty/ui/components');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[#232323] bg-[#191919] text-[#CFCFCF]">
        <DialogHeader>
          <DialogTitle className="text-white mb-2">Request Cancellation</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
            Request to cancel this funded bounty. Our team will review your request and
            process a refund. Note: The platform fee is non-refundable.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onReasonChange(e.target.value)}
            className="min-h-[100px] border-[#333] bg-[#0a0a0a] text-white placeholder:text-[#666]"
          />
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
