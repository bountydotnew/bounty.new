'use client';

import { useMemo, type ReactNode, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSession } from '@/context/session-context';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/utils/convex';
import {
  BountyCardContext,
  type BountyCardContextValue,
  type BountyCardState,
  type BountyCardActions,
  type BountyCardMeta,
} from './context';
import type { Bounty } from '@/types/dashboard';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';

const GITHUB_REPO_REGEX = /github\.com\/([^/]+\/[^/]+)/i;
const GITHUB_ISSUE_REGEX = /github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/i;

function useBountyCardQueries(bounty: Bounty, userId: string | undefined) {
  const isOwner = userId ? bounty.creator.id === userId : false;
  const isFunded =
    bounty.paymentStatus === 'held' || bounty.paymentStatus === 'released';
  const isCancelled = bounty.status === 'cancelled';
  const isRefunded = bounty.paymentStatus === 'refunded';
  const canPin = userId ? bounty.creator.id === userId : false;
  const canRequestCancellation = isOwner && isFunded;

  const cancellationStatusData = useQuery(
    api.functions.bounties.getCancellationStatus,
    canRequestCancellation ? { bountyId: bounty.id } : 'skip'
  );

  const hasPendingCancellation =
    cancellationStatusData?.hasPendingRequest ?? false;

  const canDelete =
    isOwner &&
    (!isFunded || hasPendingCancellation || isCancelled || isRefunded);

  return {
    isOwner,
    isFunded,
    isCancelled,
    isRefunded,
    canPin,
    canRequestCancellation,
    hasPendingCancellation,
    canDelete,
  };
}

function useBountyCardMutations(
  bounty: Bounty,
  canDelete: boolean,
  canRequestCancellation: boolean,
  hasPendingCancellation: boolean,
  onDelete: (() => void) | undefined,
  setShowDeleteDialog: (show: boolean) => void,
  setShowCancellationDialog: (show: boolean) => void,
  setCancellationReason: (reason: string) => void,
  cancellationReason: string
) {
  const toggleBountyPin = useMutation(api.functions.bounties.toggleBountyPin);
  const deleteBountyMut = useMutation(api.functions.bounties.deleteBounty);
  const requestCancellationMut = useMutation(
    api.functions.bounties.requestCancellation
  );
  const cancelCancellationRequestMut = useMutation(
    api.functions.bounties.cancelCancellationRequest
  );

  const [isTogglePinPending, setIsTogglePinPending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isRequestCancellationPending, setIsRequestCancellationPending] =
    useState(false);
  const [
    isCancelCancellationRequestPending,
    setIsCancelCancellationRequestPending,
  ] = useState(false);

  const togglePin = useCallback(async () => {
    if (!bounty.creator.id || isTogglePinPending) return;
    setIsTogglePinPending(true);
    try {
      await toggleBountyPin({ bountyId: bounty.id });
    } finally {
      setIsTogglePinPending(false);
    }
  }, [bounty.id, bounty.creator.id, isTogglePinPending, toggleBountyPin]);

  const confirmDelete = useCallback(async () => {
    if (!canDelete || isDeletePending) return;

    if (onDelete) {
      onDelete();
      setShowDeleteDialog(false);
      return;
    }

    setIsDeletePending(true);
    try {
      await deleteBountyMut({ id: bounty.id });
      toast.success('Bounty deleted');
      setShowDeleteDialog(false);

      if (
        typeof window !== 'undefined' &&
        window.location.pathname.includes('/bounty/')
      ) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    } catch (error) {
      toast.error(`Failed to delete bounty: ${(error as Error).message}`);
    } finally {
      setIsDeletePending(false);
    }
  }, [
    canDelete,
    isDeletePending,
    deleteBountyMut,
    bounty.id,
    onDelete,
    setShowDeleteDialog,
  ]);

  const confirmCancellation = useCallback(async () => {
    if (
      !canRequestCancellation ||
      hasPendingCancellation ||
      isRequestCancellationPending
    )
      return;

    setIsRequestCancellationPending(true);
    try {
      const result = await requestCancellationMut({
        bountyId: bounty.id,
        reason: cancellationReason || undefined,
      });
      toast.success(result.message || 'Cancellation request submitted');
      setShowCancellationDialog(false);
      setCancellationReason('');
    } catch (error) {
      toast.error(
        `Failed to request cancellation: ${(error as Error).message}`
      );
    } finally {
      setIsRequestCancellationPending(false);
    }
  }, [
    canRequestCancellation,
    hasPendingCancellation,
    isRequestCancellationPending,
    requestCancellationMut,
    bounty.id,
    cancellationReason,
    setShowCancellationDialog,
    setCancellationReason,
  ]);

  const cancelCancellationRequest = useCallback(async () => {
    setIsCancelCancellationRequestPending(true);
    try {
      const result = await cancelCancellationRequestMut({
        bountyId: bounty.id,
      });
      toast.success(result.message || 'Cancellation request withdrawn');
    } catch (error) {
      toast.error(
        `Failed to cancel cancellation request: ${(error as Error).message}`
      );
    } finally {
      setIsCancelCancellationRequestPending(false);
    }
  }, [cancelCancellationRequestMut, bounty.id]);

  return {
    togglePin,
    confirmDelete,
    confirmCancellation,
    cancelCancellationRequest,
    isTogglePinPending,
    isDeletePending,
    isRequestCancellationPending,
    isCancelCancellationRequestPending,
  };
}

function useBountyCardComputedValues(
  bounty: Bounty,
  isCancelled: boolean,
  isRefunded: boolean,
  hasPendingCancellation: boolean,
  isFunded: boolean
) {
  const isCompleted = bounty.status === 'completed';

  const getBadgeInfo = useCallback(() => {
    if (isCancelled || isRefunded) {
      return {
        label: 'Cancelled',
        className:
          'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/15',
      };
    }
    if (hasPendingCancellation) {
      return {
        label: 'Cancelling',
        className:
          'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/15',
      };
    }
    if (isCompleted) {
      return {
        label: 'Completed',
        className:
          'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent-muted border border-brand-accent/15',
      };
    }
    if (isFunded) {
      return {
        label: 'Funded',
        className:
          'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent-muted border border-brand-accent/15',
      };
    }
    if (bounty.amount === 0) {
      return {
        label: 'Free',
        className:
          'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/60 border border-foreground/10',
      };
    }
    return {
      label: 'Unfunded',
      className:
        'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/40 border border-foreground/8',
    };
  }, [
    isCancelled,
    isRefunded,
    isCompleted,
    hasPendingCancellation,
    isFunded,
    bounty.amount,
  ]);

  const creatorName = bounty.creator.name || 'User';
  const creatorInitial = creatorName.charAt(0).toLowerCase();

  const colors = [
    { bg: '#E66700', border: '#C95900' },
    { bg: '#0066FF', border: '#0052CC' },
    { bg: '#00B894', border: '#00A085' },
    { bg: '#E84393', border: '#D63031' },
    { bg: '#6C5CE7', border: '#5F4FCF' },
  ];
  const colorIndex = creatorName.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  const repoDisplay = (() => {
    const urlCandidate = bounty.repositoryUrl || bounty.issueUrl;
    if (!urlCandidate) {
      return 'Unknown repo';
    }
    const match = urlCandidate.match(GITHUB_REPO_REGEX);
    return match?.[1] || 'Unknown repo';
  })();

  const issueDisplay = (() => {
    if (!bounty.issueUrl) {
      return null;
    }
    const match = bounty.issueUrl.match(GITHUB_ISSUE_REGEX);
    if (!match) {
      return null;
    }
    const issueNumber = match[1];
    const repoMatch = bounty.issueUrl.match(GITHUB_REPO_REGEX);
    const repoSlug = repoMatch?.[1] || 'unknown';
    return {
      number: issueNumber,
      repo: repoSlug,
      url: bounty.issueUrl,
    };
  })();

  const linearDisplay = (() => {
    if (bounty.linearIssueIdentifier && bounty.linearIssueUrl) {
      return {
        identifier: bounty.linearIssueIdentifier,
        url: bounty.linearIssueUrl,
      };
    }
    return null;
  })();

  const formattedAmount =
    bounty.amount === 0 ? 'Free' : `$${bounty.amount.toLocaleString()}`;

  return {
    getBadgeInfo,
    creatorName,
    creatorInitial,
    avatarColor,
    repoDisplay,
    issueDisplay,
    linearDisplay,
    formattedAmount,
  };
}

interface BountyCardProviderProps {
  children: ReactNode;
  bounty: Bounty;
  stats?: {
    commentCount: number;
    voteCount: number;
    submissionCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
  onDelete?: () => void;
}

export function BountyCardProvider({
  children,
  bounty,
  stats,
  onDelete,
}: BountyCardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSession();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const {
    isOwner,
    isFunded,
    isCancelled,
    isRefunded,
    canPin,
    canRequestCancellation,
    hasPendingCancellation,
    canDelete,
  } = useBountyCardQueries(bounty, session?.user?.id);

  const {
    togglePin,
    confirmDelete,
    confirmCancellation,
    cancelCancellationRequest,
    isTogglePinPending,
    isDeletePending,
    isRequestCancellationPending,
    isCancelCancellationRequestPending,
  } = useBountyCardMutations(
    bounty,
    canDelete,
    canRequestCancellation,
    hasPendingCancellation,
    onDelete,
    setShowDeleteDialog,
    setShowCancellationDialog,
    setCancellationReason,
    cancellationReason
  );

  const {
    getBadgeInfo,
    creatorName,
    creatorInitial,
    avatarColor,
    repoDisplay,
    issueDisplay,
    linearDisplay,
    formattedAmount,
  } = useBountyCardComputedValues(
    bounty,
    isCancelled,
    isRefunded,
    hasPendingCancellation,
    isFunded
  );

  const handleClick = useCallback(() => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  }, [bounty.id, pathname, router]);

  const prefetchBountyDetail = useCallback(() => {
    // Convex queries are reactive — no manual prefetching needed.
    // The data will be fetched when the detail page mounts.
  }, []);

  const openDeleteDialog = useCallback(() => {
    if (canDelete) {
      setShowDeleteDialog(true);
    }
  }, [canDelete]);

  const cancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  const openCancellationDialog = useCallback(() => {
    if (canRequestCancellation && !hasPendingCancellation) {
      setShowCancellationDialog(true);
    }
  }, [canRequestCancellation, hasPendingCancellation]);

  const state: BountyCardState = useMemo(
    () => ({
      bounty,
      stats,
      isOwner,
      isFunded,
      isCancelled,
      isRefunded,
      canPin,
      canDelete,
      canRequestCancellation,
      hasPendingCancellation,
      formattedAmount,
      badgeInfo: getBadgeInfo(),
      creatorName,
      creatorInitial,
      avatarColor,
      repoDisplay,
      issueDisplay,
      linearDisplay,
      isTogglePinPending,
      isDeletePending,
      isRequestCancellationPending,
      isCancelCancellationRequestPending,
    }),
    [
      bounty,
      stats,
      isOwner,
      isFunded,
      isCancelled,
      isRefunded,
      canPin,
      canDelete,
      canRequestCancellation,
      hasPendingCancellation,
      formattedAmount,
      getBadgeInfo,
      creatorName,
      creatorInitial,
      avatarColor,
      repoDisplay,
      issueDisplay,
      linearDisplay,
      isTogglePinPending,
      isDeletePending,
      isRequestCancellationPending,
      isCancelCancellationRequestPending,
    ]
  );

  const actions: BountyCardActions = useMemo(
    () => ({
      handleClick,
      prefetchBountyDetail,
      togglePin,
      openDeleteDialog,
      confirmDelete,
      cancelDelete,
      openCancellationDialog,
      confirmCancellation,
      cancelCancellationRequest,
    }),
    [
      handleClick,
      prefetchBountyDetail,
      togglePin,
      openDeleteDialog,
      confirmDelete,
      cancelDelete,
      openCancellationDialog,
      confirmCancellation,
      cancelCancellationRequest,
    ]
  );

  const meta: BountyCardMeta = useMemo(
    () => ({
      onDelete,
      showDeleteDialog,
      setShowDeleteDialog,
      showCancellationDialog,
      setShowCancellationDialog,
      cancellationReason,
      setCancellationReason,
    }),
    [onDelete, showDeleteDialog, showCancellationDialog, cancellationReason]
  );

  const contextValue: BountyCardContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <BountyCardContext.Provider value={contextValue}>
      {children}
    </BountyCardContext.Provider>
  );
}
