'use client';

import { useQuery, useMutation, useAction } from 'convex/react';
import { useMemo, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/utils/convex';
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
}: {
  bountyId: string;
  sessionUserId: string | undefined;
  createdById: string | undefined;
  paymentStatus: string | null | undefined;
}) {
  const shouldQueryPaymentStatus = Boolean(
    bountyId &&
      sessionUserId &&
      createdById &&
      createdById === sessionUserId &&
      paymentStatus === 'pending'
  );
  const paymentStatusData = useQuery(
    api.functions.bounties.getBountyPaymentStatus,
    shouldQueryPaymentStatus ? { bountyId } : 'skip'
  );

  const votesData = useQuery(api.functions.bounties.getBountyVotes, {
    bountyId,
  });

  const submissionsData = useQuery(
    api.functions.bounties.getBountySubmissions,
    { bountyId }
  );

  const shouldQueryCancellation = Boolean(
    sessionUserId === createdById &&
      (paymentStatus === 'held' || paymentStatus === 'released')
  );
  const cancellationStatusData = useQuery(
    api.functions.bounties.getCancellationStatus,
    shouldQueryCancellation ? { bountyId } : 'skip'
  );

  const shouldQueryConnect = Boolean(
    sessionUserId && createdById && createdById === sessionUserId
  );
  const connectStatusData = useQuery(
    api.functions.connect.getConnectStatus,
    shouldQueryConnect ? {} : 'skip'
  );

  return {
    paymentStatusData,
    votesData,
    submissionsData,
    cancellationStatusData,
    connectStatusData,
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
  const { orgs, switchOrg } = useActiveOrg();

  // DB-only mutations
  const voteBounty = useMutation(api.functions.bounties.voteBounty);
  const deleteBounty = useMutation(api.functions.bounties.deleteBounty);
  const requestCancellation = useMutation(
    api.functions.bounties.requestCancellation
  );
  const cancelCancellationRequest = useMutation(
    api.functions.bounties.cancelCancellationRequest
  );
  const approveSubmission = useMutation(
    api.functions.bounties.approveSubmission
  );
  const unapproveSubmission = useMutation(
    api.functions.bounties.unapproveSubmission
  );
  const submitWorkFromApp = useMutation(
    api.functions.bounties.submitWorkFromApp
  );
  const withdrawSubmission = useMutation(
    api.functions.bounties.withdrawSubmission
  );

  // Actions (external API calls)
  const createPaymentForBounty = useAction(
    api.functions.bounties.createPaymentForBounty
  );
  const recheckPaymentStatus = useAction(
    api.functions.bounties.recheckPaymentStatus
  );
  const mergeSubmission = useAction(api.functions.bounties.mergeSubmission);
  const createConnectAccountLink = useAction(
    api.functions.connect.createConnectAccountLink
  );

  // Pending state tracking
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isRecheckingPayment, setIsRecheckingPayment] = useState(false);
  const [isSettingUpConnect, setIsSettingUpConnect] = useState(false);
  const [isRequestingCancellation, setIsRequestingCancellation] =
    useState(false);
  const [isCancellingCancellationRequest, setIsCancellingCancellationRequest] =
    useState(false);
  const [isApprovingSubmission, setIsApprovingSubmission] = useState(false);
  const [isUnapprovingSubmission, setIsUnapprovingSubmission] = useState(false);
  const [isMergingSubmission, setIsMergingSubmission] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isWithdrawingSubmission, setIsWithdrawingSubmission] = useState(false);

  const handleDeleteBounty = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteBounty({ id });
        toast.success('Bounty deleted successfully');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } catch (error) {
        const err = error as Error;
        const isDifferentOrg = err.message.includes('different organization');
        const bountyOrg =
          isDifferentOrg && organizationId
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
          toast.error(`Failed to delete bounty: ${err.message}`);
        }
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteBounty, organizationId, orgs, switchOrg]
  );

  const handleCreatePayment = useCallback(async () => {
    setIsCreatingPayment(true);
    try {
      const result = await createPaymentForBounty({
        bountyId,
        origin: window.location.origin,
      });
      if (result?.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }
    } catch (error) {
      toast.error(`Failed to create payment: ${(error as Error).message}`);
    } finally {
      setIsCreatingPayment(false);
    }
  }, [createPaymentForBounty, bountyId]);

  const handleRecheckPayment = useCallback(async () => {
    setIsRecheckingPayment(true);
    try {
      const result = await recheckPaymentStatus({ bountyId });
      if (result.success && result.paymentStatus === 'held') {
        toast.success(
          result.message || 'Payment verified! Bounty is now live.'
        );
      } else {
        toast.info(
          result.message || 'Payment status checked. No changes needed.'
        );
      }
    } catch (error) {
      toast.error(`Failed to recheck payment: ${(error as Error).message}`);
    } finally {
      setIsRecheckingPayment(false);
    }
  }, [recheckPaymentStatus, bountyId]);

  const handleSetupConnect = useCallback(async () => {
    setIsSettingUpConnect(true);
    try {
      const result = await createConnectAccountLink({});
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      toast.error(`Failed to start Stripe setup: ${(error as Error).message}`);
    } finally {
      setIsSettingUpConnect(false);
    }
  }, [createConnectAccountLink]);

  const handleRequestCancellation = useCallback(
    async (reason?: string) => {
      setIsRequestingCancellation(true);
      try {
        const result = await requestCancellation({
          bountyId,
          reason,
        });
        toast.success(result.message || 'Cancellation request submitted');
        setShowCancellationDialog(false);
        setCancellationReason('');
      } catch (error) {
        toast.error(
          `Failed to request cancellation: ${(error as Error).message}`
        );
      } finally {
        setIsRequestingCancellation(false);
      }
    },
    [
      requestCancellation,
      bountyId,
      setShowCancellationDialog,
      setCancellationReason,
    ]
  );

  const handleCancelCancellationRequest = useCallback(async () => {
    setIsCancellingCancellationRequest(true);
    try {
      const result = await cancelCancellationRequest({ bountyId });
      toast.success(result.message || 'Cancellation request withdrawn');
    } catch (error) {
      toast.error(
        `Failed to cancel cancellation request: ${(error as Error).message}`
      );
    } finally {
      setIsCancellingCancellationRequest(false);
    }
  }, [cancelCancellationRequest, bountyId]);

  const handleApproveSubmission = useCallback(
    async (submissionId: string) => {
      setIsApprovingSubmission(true);
      try {
        await approveSubmission({ bountyId, submissionId });
        toast.success('Submission approved');
      } catch (error) {
        toast.error(`Failed to approve: ${(error as Error).message}`);
      } finally {
        setIsApprovingSubmission(false);
      }
    },
    [approveSubmission, bountyId]
  );

  const handleUnapproveSubmission = useCallback(
    async (submissionId: string) => {
      setIsUnapprovingSubmission(true);
      try {
        await unapproveSubmission({ bountyId, submissionId });
        toast.success('Approval withdrawn');
      } catch (error) {
        toast.error(`Failed to unapprove: ${(error as Error).message}`);
      } finally {
        setIsUnapprovingSubmission(false);
      }
    },
    [unapproveSubmission, bountyId]
  );

  const handleMergeSubmission = useCallback(
    async (submissionId: string) => {
      setIsMergingSubmission(true);
      try {
        const result = await mergeSubmission({ bountyId, submissionId });
        toast.success(result.message || 'Submission processed');
      } catch (error) {
        toast.error(`Failed to release payout: ${(error as Error).message}`);
      } finally {
        setIsMergingSubmission(false);
      }
    },
    [mergeSubmission, bountyId]
  );

  const handleSubmitWork = useCallback(
    async (pullRequestUrl: string, description?: string) => {
      setIsSubmittingWork(true);
      try {
        const result = await submitWorkFromApp({
          bountyId,
          pullRequestUrl,
          description: description || undefined,
        });
        toast.success(result.message || 'Submission received!');
      } catch (error) {
        toast.error(`Failed to submit: ${(error as Error).message}`);
      } finally {
        setIsSubmittingWork(false);
      }
    },
    [submitWorkFromApp, bountyId]
  );

  const handleWithdrawSubmission = useCallback(
    async (submissionId: string) => {
      setIsWithdrawingSubmission(true);
      try {
        const result = await withdrawSubmission({ bountyId, submissionId });
        toast.success(result.message || 'Submission withdrawn');
      } catch (error) {
        toast.error(`Failed to withdraw: ${(error as Error).message}`);
      } finally {
        setIsWithdrawingSubmission(false);
      }
    },
    [withdrawSubmission, bountyId]
  );

  return {
    voteBounty,
    handleDeleteBounty,
    handleCreatePayment,
    handleRecheckPayment,
    handleSetupConnect,
    handleRequestCancellation,
    handleCancelCancellationRequest,
    handleApproveSubmission,
    handleUnapproveSubmission,
    handleMergeSubmission,
    handleSubmitWork,
    handleWithdrawSubmission,
    isVoting,
    setIsVoting,
    isDeleting,
    isCreatingPayment,
    isRecheckingPayment,
    isSettingUpConnect,
    isRequestingCancellation,
    isCancellingCancellationRequest,
    isApprovingSubmission,
    isUnapprovingSubmission,
    isMergingSubmission,
    isSubmittingWork,
    isWithdrawingSubmission,
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
  const [withdrawingSubmissionId, setWithdrawingSubmissionId] = useState<
    string | null
  >(null);

  const {
    paymentStatusData,
    votesData,
    submissionsData,
    cancellationStatusData,
    connectStatusData,
  } = useBountyDetailQueries({
    bountyId,
    sessionUserId,
    createdById,
    paymentStatus,
  });

  const {
    voteBounty,
    handleDeleteBounty,
    handleCreatePayment,
    handleRecheckPayment,
    handleSetupConnect,
    handleRequestCancellation,
    handleCancelCancellationRequest,
    handleApproveSubmission,
    handleUnapproveSubmission,
    handleMergeSubmission,
    handleSubmitWork,
    handleWithdrawSubmission,
    isVoting,
    setIsVoting,
    isDeleting,
    isCreatingPayment,
    isRecheckingPayment,
    isSettingUpConnect,
    isRequestingCancellation,
    isCancellingCancellationRequest,
    isApprovingSubmission,
    isUnapprovingSubmission,
    isMergingSubmission,
    isSubmittingWork,
    isWithdrawingSubmission,
  } = useBountyDetailMutations({
    bountyId,
    organizationId,
    setShowCancellationDialog,
    setCancellationReason,
  });

  // Use Convex reactive data, fall back to initialVotes
  const votes = votesData ?? initialVotes ?? null;

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
    hasPendingRequest: cancellationStatusData?.hasPendingRequest ?? false,
  });

  // Creator needs to set up Stripe Connect (no account or onboarding incomplete)
  const connectData = connectStatusData?.data;
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
      votes,
      comments: undefined,
      bookmarked: initialBookmarked,
      submissions: submissionsData?.submissions,
      isSubmissionsLoading: submissionsData === undefined,
      isPaymentStatusLoading: paymentStatusData === undefined,
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
      isCancellationStatusLoading: cancellationStatusData === undefined,
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
      votes,
      initialBookmarked,
      submissionsData,
      paymentStatusData,
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
      cancellationStatusData,
    ]
  );

  const actions: BountyDetailActions = useMemo(
    () => ({
      upvote: async () => {
        setIsVoting(true);
        try {
          const currentVoted = votes ? votes.isVoted : false;
          await voteBounty({ bountyId, vote: !currentVoted });
        } catch {
          // Convex will reactively update on success; error is silent
        } finally {
          setIsVoting(false);
        }
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
          handleRequestCancellation(reason);
        } else {
          setShowCancellationDialog(true);
        }
      },
      cancelCancellationRequest: () => {
        handleCancelCancellationRequest();
      },
      recheckPayment: () => {
        handleRecheckPayment();
      },
      completePayment: () => {
        handleCreatePayment();
      },
      setupConnect: () => {
        if (connectData?.hasConnectAccount) {
          handleSetupConnect();
        } else {
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
          isApprovingSubmission ||
          isUnapprovingSubmission ||
          isMergingSubmission
        ) {
          return;
        }
        setApprovingSubmissionId(submissionId);
        handleApproveSubmission(submissionId).finally(() =>
          setApprovingSubmissionId(null)
        );
      },
      unapproveSubmission: (submissionId: string) => {
        if (
          isApprovingSubmission ||
          isUnapprovingSubmission ||
          isMergingSubmission
        ) {
          return;
        }
        setUnapprovingSubmissionId(submissionId);
        handleUnapproveSubmission(submissionId).finally(() =>
          setUnapprovingSubmissionId(null)
        );
      },
      mergeSubmission: (submissionId: string) => {
        if (
          isApprovingSubmission ||
          isUnapprovingSubmission ||
          isMergingSubmission
        ) {
          return;
        }
        setMergingSubmissionId(submissionId);
        handleMergeSubmission(submissionId).finally(() =>
          setMergingSubmissionId(null)
        );
      },
      submitWork: (pullRequestUrl: string, description?: string) => {
        if (isSubmittingWork) {
          return;
        }
        handleSubmitWork(pullRequestUrl, description);
      },
      withdrawSubmission: (submissionId: string) => {
        if (isWithdrawingSubmission) {
          return;
        }
        setWithdrawingSubmissionId(submissionId);
        handleWithdrawSubmission(submissionId).finally(() =>
          setWithdrawingSubmissionId(null)
        );
      },
    }),
    [
      bountyId,
      votes,
      voteBounty,
      setIsVoting,
      hasPendingCancellation,
      handleRequestCancellation,
      handleCancelCancellationRequest,
      handleRecheckPayment,
      handleCreatePayment,
      handleSetupConnect,
      connectData?.hasConnectAccount,
      handleApproveSubmission,
      isApprovingSubmission,
      handleUnapproveSubmission,
      isUnapprovingSubmission,
      handleMergeSubmission,
      isMergingSubmission,
      handleSubmitWork,
      isSubmittingWork,
      handleWithdrawSubmission,
      isWithdrawingSubmission,
      onEdit,
      title,
      description,
    ]
  );

  const meta: BountyDetailMeta = useMemo(
    () => ({
      bountyId,
      isDeleting,
      isRequestingCancellation,
      isCancellingCancellationRequest,
      isRecheckingPayment,
      isCreatingPayment,
      isSettingUpConnect,
      isApprovingSubmission,
      approvingSubmissionId,
      isUnapprovingSubmission,
      unapprovingSubmissionId,
      isMergingSubmission,
      mergingSubmissionId,
      isSubmittingWork,
      isWithdrawingSubmission,
      withdrawingSubmissionId,
    }),
    [
      bountyId,
      isDeleting,
      isRequestingCancellation,
      isCancellingCancellationRequest,
      isRecheckingPayment,
      isCreatingPayment,
      isSettingUpConnect,
      isApprovingSubmission,
      approvingSubmissionId,
      isUnapprovingSubmission,
      unapprovingSubmissionId,
      isMergingSubmission,
      mergingSubmissionId,
      isSubmittingWork,
      isWithdrawingSubmission,
      withdrawingSubmissionId,
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
          if (!canRequestCancellation || isRequestingCancellation) {
            return;
          }
          handleRequestCancellation(cancellationReason || undefined);
        }}
        isPending={isRequestingCancellation}
      />
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={async () => {
          try {
            await handleDeleteBounty(bountyId);
          } catch {
            // Error is handled inside handleDeleteBounty
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
