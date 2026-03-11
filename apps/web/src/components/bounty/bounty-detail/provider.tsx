'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
import { useActiveOrg } from '@/hooks/use-active-org';
import {
  BountyDetailContext,
  type BountyDetailContextValue,
  type BountyDetailState,
  type BountyDetailActions,
  type BountyDetailMeta,
  type BountyLink,
} from './context';
import { AlertDialog } from '@bounty/ui/components/alert-dialog';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Textarea } from '@bounty/ui/components/textarea';
import { ConnectOnboardingModal } from '@/components/payment/connect-onboarding-modal';

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
  initialBookmarked?: boolean;
  paymentStatus?: string | null;
  createdById?: string;
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;
  githubIssueNumber?: number | null;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
  organizationId?: string | null;
  links?: BountyLink[];
  onEdit?: () => void;
}

function useBountyDetailQueries({
  bountyId,
  sessionUserId,
  createdById,
  paymentStatus,
  initialVotes,
}: {
  bountyId: string;
  sessionUserId: string | undefined;
  createdById: string | undefined;
  paymentStatus: string | null | undefined;
  initialVotes?: { count: number; isVoted: boolean };
}) {
  const paymentStatusQuery = useQuery({
    ...trpc.bounties.getBountyPaymentStatus.queryOptions({ bountyId }),
    enabled: Boolean(
      bountyId &&
        sessionUserId &&
        createdById &&
        createdById === sessionUserId &&
        paymentStatus === 'pending'
    ),
  });

  const votesQuery = useQuery({
    ...trpc.bounties.getBountyVotes.queryOptions({ bountyId }),
    initialData: initialVotes,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const submissionsQuery = useQuery({
    ...trpc.bounties.getBountySubmissions.queryOptions({ bountyId }),
    staleTime: 10_000,
  });

  const cancellationStatusQuery = useQuery({
    ...trpc.bounties.getCancellationStatus.queryOptions({ bountyId }),
    enabled: Boolean(
      sessionUserId === createdById &&
        (paymentStatus === 'held' || paymentStatus === 'released')
    ),
  });

  const connectStatusQuery = useQuery({
    ...trpc.connect.getConnectStatus.queryOptions(),
    enabled: Boolean(
      sessionUserId && createdById && createdById === sessionUserId
    ),
    staleTime: 60_000,
  });

  return {
    paymentStatusQuery,
    votesQuery,
    submissionsQuery,
    cancellationStatusQuery,
    connectStatusQuery,
  };
}

function useBountyDetailMutations({
  bountyId,
  organizationId,
  setShowCancellationDialog,
  setCancellationReason,
}: {
  bountyId: string;
  organizationId?: string | null;
  setShowCancellationDialog: (open: boolean) => void;
  setCancellationReason: (reason: string) => void;
}) {
  const queryClient = useQueryClient();
  const { orgs, switchOrg } = useActiveOrg();

  const voteMutation = useMutation({
    mutationFn: async (input: { bountyId: string; vote: boolean }) => {
      return await trpcClient.bounties.voteBounty.mutate(input);
    },
  });

  const deleteBountyMutation = useMutation({
    mutationFn: async (input: { id: string }) => {
      return await trpcClient.bounties.deleteBounty.mutate(input);
    },
    onSuccess: () => {
      toast.success('Bounty deleted successfully');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [first] = query.queryKey;

          if (typeof first === 'string') {
            return first.includes('bounty');
          }

          if (Array.isArray(first)) {
            const namespace = first[0];
            return (
              typeof namespace === 'string' && namespace.includes('bounty')
            );
          }

          return false;
        },
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    },
    onError: (error: Error) => {
      const isDifferentOrg = error.message.includes('different organization');
      const bountyOrg = isDifferentOrg && organizationId
        ? orgs.find((o) => o.id === organizationId)
        : undefined;

      if (isDifferentOrg && bountyOrg) {
        toast.error('This bounty belongs to a different organization', {
          description: `Switch to "${bountyOrg.name}" to manage this bounty.`,
          action: {
            label: `Switch to ${bountyOrg.name}`,
            onClick: async () => {
              try {
                await switchOrg(bountyOrg.id);
              } catch {
                toast.error('Failed to switch organization');
              }
            },
          },
        });
      } else {
        toast.error(`Failed to delete bounty: ${error.message}`);
      }
    },
  });

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

  const setupConnectMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.connect.createConnectAccountLink.mutate({});
    },
    onSuccess: (result) => {
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to start Stripe setup: ${error.message}`);
    },
  });

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

  const approveSubmissionMutation = useMutation({
    mutationFn: async (input: { bountyId: string; submissionId: string }) => {
      return await trpcClient.bounties.approveSubmission.mutate(input);
    },
    onSuccess: () => {
      toast.success('Submission approved');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [first] = query.queryKey;
          if (typeof first === 'string') {
            return first.includes('bounty');
          }
          if (Array.isArray(first)) {
            const namespace = first[0];
            return (
              typeof namespace === 'string' && namespace.includes('bounty')
            );
          }
          return false;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const unapproveSubmissionMutation = useMutation({
    mutationFn: async (input: { bountyId: string; submissionId: string }) => {
      return await trpcClient.bounties.unapproveSubmission.mutate(input);
    },
    onSuccess: () => {
      toast.success('Approval withdrawn');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [first] = query.queryKey;
          if (typeof first === 'string') {
            return first.includes('bounty');
          }
          if (Array.isArray(first)) {
            const namespace = first[0];
            return (
              typeof namespace === 'string' && namespace.includes('bounty')
            );
          }
          return false;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to unapprove: ${error.message}`);
    },
  });

  const mergeSubmissionMutation = useMutation({
    mutationFn: async (input: { bountyId: string; submissionId: string }) => {
      return await trpcClient.bounties.mergeSubmission.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Submission processed');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [first] = query.queryKey;
          if (typeof first === 'string') {
            return first.includes('bounty');
          }
          if (Array.isArray(first)) {
            const namespace = first[0];
            return (
              typeof namespace === 'string' && namespace.includes('bounty')
            );
          }
          return false;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to release payout: ${error.message}`);
    },
  });

  const submitWorkMutation = useMutation({
    mutationFn: async (input: {
      bountyId: string;
      pullRequestUrl: string;
      description?: string;
    }) => {
      return await trpcClient.bounties.submitWorkFromApp.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Submission received!');
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [first] = query.queryKey;
          if (typeof first === 'string') {
            return first.includes('bounty');
          }
          if (Array.isArray(first)) {
            const namespace = first[0];
            return (
              typeof namespace === 'string' && namespace.includes('bounty')
            );
          }
          return false;
        },
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit: ${error.message}`);
    },
  });

  return {
    queryClient,
    voteMutation,
    deleteBountyMutation,
    createPaymentMutation,
    recheckPaymentMutation,
    setupConnectMutation,
    requestCancellationMutation,
    cancelCancellationRequestMutation,
    approveSubmissionMutation,
    unapproveSubmissionMutation,
    mergeSubmissionMutation,
    submitWorkMutation,
  };
}

function useBountyDetailComputedState({
  sessionUserId,
  createdById,
  paymentStatus,
  amount,
  hasPendingRequest,
}: {
  sessionUserId: string | undefined;
  createdById: string | undefined;
  paymentStatus: string | null | undefined;
  amount: number;
  hasPendingRequest: boolean;
}) {
  const isCreator = sessionUserId === createdById;
  const isFunded = paymentStatus === 'held' || paymentStatus === 'released';
  const isCancelled = paymentStatus === 'refunded';
  const isUnfunded = paymentStatus !== 'held' && paymentStatus !== null;
  const needsPayment = paymentStatus === 'pending' && isCreator && amount > 0;
  const canRequestCancellation = isCreator && isFunded;
  const hasPendingCancellation = hasPendingRequest;
  const canDelete =
    isCreator && (!isFunded || hasPendingCancellation || isCancelled);

  return {
    isCreator,
    isFunded,
    isCancelled,
    isUnfunded,
    needsPayment,
    canRequestCancellation,
    hasPendingCancellation,
    canDelete,
  };
}

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
  initialBookmarked,
  paymentStatus,
  createdById,
  githubRepoOwner,
  githubRepoName,
  githubIssueNumber,
  repositoryUrl,
  issueUrl,
  organizationId,
  links,
  onEdit,
}: BountyDetailProviderProps) {
  const { session } = useSession();
  const sessionUserId = session?.user?.id;

  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [approvingSubmissionId, setApprovingSubmissionId] = useState<
    string | null
  >(null);
  const [unapprovingSubmissionId, setUnapprovingSubmissionId] = useState<
    string | null
  >(null);
  const [mergingSubmissionId, setMergingSubmissionId] = useState<string | null>(
    null
  );

  const {
    paymentStatusQuery,
    votesQuery,
    submissionsQuery,
    cancellationStatusQuery,
    connectStatusQuery,
  } = useBountyDetailQueries({
    bountyId,
    sessionUserId,
    createdById,
    paymentStatus,
    initialVotes,
  });

  const {
    queryClient,
    voteMutation,
    deleteBountyMutation,
    createPaymentMutation,
    recheckPaymentMutation,
    setupConnectMutation,
    requestCancellationMutation,
    cancelCancellationRequestMutation,
    approveSubmissionMutation,
    unapproveSubmissionMutation,
    mergeSubmissionMutation,
    submitWorkMutation,
  } = useBountyDetailMutations({
    bountyId,
    organizationId,
    setShowCancellationDialog,
    setCancellationReason,
  });

  const {
    isCreator,
    isFunded,
    isCancelled,
    isUnfunded,
    needsPayment,
    canRequestCancellation,
    hasPendingCancellation,
    canDelete,
  } = useBountyDetailComputedState({
    sessionUserId,
    createdById,
    paymentStatus,
    amount,
    hasPendingRequest: cancellationStatusQuery.data?.hasPendingRequest ?? false,
  });

  // Creator needs to set up Stripe Connect (no account or onboarding incomplete)
  const connectData = connectStatusQuery.data?.data;
  const needsConnectSetup =
    isCreator &&
    Boolean(
      connectData &&
        !(connectData.hasConnectAccount && connectData.onboardingComplete)
    );

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
        links,
      },
      votes: votesQuery.data ?? null,
      comments: undefined,
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
      needsConnectSetup,
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
      links,
      votesQuery.data,
      initialBookmarked,
      submissionsQuery.data?.submissions,
      submissionsQuery.isLoading,
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
      needsConnectSetup,
      cancellationStatusQuery.isLoading,
    ]
  );

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
        setShowDeleteDialog(true);
      },
      requestCancellation: (reason?: string) => {
        if (hasPendingCancellation) {
          toast.error(
            'You already have a pending cancellation request for this bounty.'
          );
          return;
        }
        if (reason !== undefined) {
          requestCancellationMutation.mutate({ bountyId, reason });
        } else {
          setShowCancellationDialog(true);
        }
      },
      cancelCancellationRequest: () => {
        cancelCancellationRequestMutation.mutate({ bountyId });
      },
      recheckPayment: () => {
        recheckPaymentMutation.mutate();
      },
      completePayment: () => {
        createPaymentMutation.mutate();
      },
      setupConnect: () => {
        if (connectData?.hasConnectAccount) {
          // Account exists, just needs to finish onboarding
          setupConnectMutation.mutate();
        } else {
          // No account — show modal with country picker
          setShowConnectModal(true);
        }
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
      approveSubmission: (submissionId: string) => {
        if (
          approveSubmissionMutation.isPending ||
          unapproveSubmissionMutation.isPending ||
          mergeSubmissionMutation.isPending
        ) {
          return;
        }
        setApprovingSubmissionId(submissionId);
        // Optimistic update
        const submissionsKey = trpc.bounties.getBountySubmissions.queryKey({
          bountyId,
        });
        const prevSubmissions = queryClient.getQueryData(submissionsKey);
        queryClient.setQueryData(
          submissionsKey,
          (old: typeof prevSubmissions) => {
            if (!old?.submissions) {
              return old;
            }
            return {
              ...old,
              submissions: old.submissions.map((s) =>
                s.id === submissionId
                  ? { ...s, status: 'approved' as const }
                  : s
              ),
            };
          }
        );
        approveSubmissionMutation.mutate(
          { bountyId, submissionId },
          {
            onError: () => {
              queryClient.setQueryData(submissionsKey, prevSubmissions);
            },
            onSettled: () => {
              setApprovingSubmissionId(null);
              queryClient.invalidateQueries({ queryKey: submissionsKey });
            },
          }
        );
      },
      unapproveSubmission: (submissionId: string) => {
        if (
          approveSubmissionMutation.isPending ||
          unapproveSubmissionMutation.isPending ||
          mergeSubmissionMutation.isPending
        ) {
          return;
        }
        setUnapprovingSubmissionId(submissionId);
        // Optimistic update
        const submissionsKey = trpc.bounties.getBountySubmissions.queryKey({
          bountyId,
        });
        const prevSubmissions = queryClient.getQueryData(submissionsKey);
        queryClient.setQueryData(
          submissionsKey,
          (old: typeof prevSubmissions) => {
            if (!old?.submissions) {
              return old;
            }
            return {
              ...old,
              submissions: old.submissions.map((s) =>
                s.id === submissionId ? { ...s, status: 'pending' as const } : s
              ),
            };
          }
        );
        unapproveSubmissionMutation.mutate(
          { bountyId, submissionId },
          {
            onError: () => {
              queryClient.setQueryData(submissionsKey, prevSubmissions);
            },
            onSettled: () => {
              setUnapprovingSubmissionId(null);
              queryClient.invalidateQueries({ queryKey: submissionsKey });
            },
          }
        );
      },
      mergeSubmission: (submissionId: string) => {
        if (
          approveSubmissionMutation.isPending ||
          unapproveSubmissionMutation.isPending ||
          mergeSubmissionMutation.isPending
        ) {
          return;
        }
        setMergingSubmissionId(submissionId);
        mergeSubmissionMutation.mutate(
          { bountyId, submissionId },
          { onSettled: () => setMergingSubmissionId(null) }
        );
      },
      submitWork: (pullRequestUrl: string, description?: string) => {
        if (submitWorkMutation.isPending) {
          return;
        }
        submitWorkMutation.mutate({
          bountyId,
          pullRequestUrl,
          description: description || undefined,
        });
      },
    }),
    [
      bountyId,
      votesQuery.data,
      queryClient,
      voteMutation,
      deleteBountyMutation,
      hasPendingCancellation,
      requestCancellationMutation,
      cancelCancellationRequestMutation,
      recheckPaymentMutation,
      createPaymentMutation,
      setupConnectMutation,
      connectData?.hasConnectAccount,
      approveSubmissionMutation,
      unapproveSubmissionMutation,
      mergeSubmissionMutation,
      submitWorkMutation,
      onEdit,
      title,
      description,
    ]
  );

  const meta: BountyDetailMeta = useMemo(
    () => ({
      bountyId,
      isDeleting: deleteBountyMutation.isPending,
      isRequestingCancellation: requestCancellationMutation.isPending,
      isCancellingCancellationRequest:
        cancelCancellationRequestMutation.isPending,
      isRecheckingPayment: recheckPaymentMutation.isPending,
      isCreatingPayment: createPaymentMutation.isPending,
      isSettingUpConnect: setupConnectMutation.isPending,
      isApprovingSubmission: approveSubmissionMutation.isPending,
      approvingSubmissionId,
      isUnapprovingSubmission: unapproveSubmissionMutation.isPending,
      unapprovingSubmissionId,
      isMergingSubmission: mergeSubmissionMutation.isPending,
      mergingSubmissionId,
      isSubmittingWork: submitWorkMutation.isPending,
    }),
    [
      bountyId,
      deleteBountyMutation.isPending,
      requestCancellationMutation.isPending,
      cancelCancellationRequestMutation.isPending,
      recheckPaymentMutation.isPending,
      createPaymentMutation.isPending,
      setupConnectMutation.isPending,
      approveSubmissionMutation.isPending,
      approvingSubmissionId,
      unapproveSubmissionMutation.isPending,
      unapprovingSubmissionId,
      mergeSubmissionMutation.isPending,
      mergingSubmissionId,
      submitWorkMutation.isPending,
    ]
  );

  const contextValue: BountyDetailContextValue = useMemo(
    () => ({ state, actions, meta }),
    [state, actions, meta]
  );

  return (
    <BountyDetailContext value={contextValue}>
      {children}
      <CancellationDialog
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        onConfirm={() => {
          if (
            !canRequestCancellation ||
            requestCancellationMutation.isPending
          ) {
            return;
          }
          requestCancellationMutation.mutate({
            bountyId,
            reason: cancellationReason || undefined,
          });
        }}
        isPending={requestCancellationMutation.isPending}
      />
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={async () => {
          try {
            await deleteBountyMutation.mutateAsync({ id: bountyId });
          } catch {
            // Error is handled by the mutation's onError callback
          }
        }}
      >
        <AlertDialog.Header>
          <AlertDialog.Title>Delete Bounty</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this bounty? This action cannot be
            undone.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Confirm>Delete</AlertDialog.Confirm>
        </AlertDialog.Footer>
      </AlertDialog>
      <ConnectOnboardingModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        hasConnectAccount={Boolean(connectData?.hasConnectAccount)}
        bountyAmount={amount}
      />
    </BountyDetailContext>
  );
}

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border-subtle bg-surface-1 text-text-secondary">
        <DialogHeader>
          <DialogTitle className="text-foreground mb-2">
            Request Cancellation
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Request to cancel this funded bounty. Our team will review your
            request and process a refund. Note: The platform fee is
            non-refundable.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 px-4">
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onReasonChange(e.target.value)
            }
            className="min-h-[100px] border-border-default bg-background text-foreground placeholder:text-text-muted w-full"
          />
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-white border-none"
          >
            {isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
