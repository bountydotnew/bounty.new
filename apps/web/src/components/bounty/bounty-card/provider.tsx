'use client';

import { useMemo, ReactNode, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/context/session-context';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import {
  BountyCardContext,
  type BountyCardContextValue,
  type BountyCardState,
  type BountyCardActions,
  type BountyCardMeta,
} from './context';
import type { Bounty } from '@/types/dashboard';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';

interface BountyCardProviderProps {
  children: ReactNode;
  /** The bounty data */
  bounty: Bounty;
  /** Stats for the bounty */
  stats?: {
    commentCount: number;
    voteCount: number;
    submissionCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
  /** Optional delete callback from parent */
  onDelete?: () => void;
}

/**
 * BountyCard Provider
 *
 * Wraps the card with state and actions following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <BountyCardProvider bounty={bounty} stats={stats}>
 *   <CompactBountyCard />
 * </BountyCardProvider>
 * ```
 */
export function BountyCardProvider({
  children,
  bounty,
  stats,
  onDelete,
}: BountyCardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSession();
  const queryClient = useQueryClient();

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const isOwner = session?.user?.id
    ? bounty.creator.id === session.user.id
    : false;

  // Determine funding and cancellation status
  const isFunded = bounty.paymentStatus === 'held' || bounty.paymentStatus === 'released';
  const isCancelled = bounty.status === 'cancelled';
  const isRefunded = bounty.paymentStatus === 'refunded';

  const canPin = session?.user?.id
    ? bounty.creator.id === session.user.id
    : false;

  const canRequestCancellation = isOwner && isFunded;

  // Query cancellation status
  const cancellationStatusQuery = useQuery({
    ...trpc.bounties.getCancellationStatus.queryOptions({ bountyId: bounty.id }),
    enabled: canRequestCancellation,
  });

  const hasPendingCancellation = cancellationStatusQuery.data?.hasPendingRequest ?? false;

  const canDelete = isOwner && (!isFunded || hasPendingCancellation || isCancelled || isRefunded);

  // Mutations
  const togglePinMutation = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.toggleBountyPin.mutate(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getHighlights']],
      });
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getBountiesByUserId']],
      });
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getBounties']],
      });
    },
  });

  const deleteBountyMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.deleteBounty.mutate({ id: bounty.id });
    },
    onSuccess: () => {
      toast.success('Bounty deleted');
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getHighlights']],
      });
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getBountiesByUserId']],
      });
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getBounties']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete bounty: ${error.message}`);
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

  // Actions
  const handleClick = useCallback(() => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  }, [bounty.id, pathname, router]);

  const togglePin = useCallback(() => {
    if (canPin && !togglePinMutation.isPending) {
      togglePinMutation.mutate({ bountyId: bounty.id });
    }
  }, [canPin, togglePinMutation.isPending, togglePinMutation, bounty.id]);

  const openDeleteDialog = useCallback(() => {
    if (canDelete) {
      setShowDeleteDialog(true);
    }
  }, [canDelete]);

  const confirmDelete = useCallback(() => {
    if (!canDelete || deleteBountyMutation.isPending) {
      return;
    }

    if (onDelete) {
      onDelete();
      setShowDeleteDialog(false);
      return;
    }

    deleteBountyMutation.mutate(undefined, {
      onSettled: () => setShowDeleteDialog(false),
    });
  }, [canDelete, deleteBountyMutation.isPending, deleteBountyMutation, onDelete]);

  const cancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  const openCancellationDialog = useCallback(() => {
    if (canRequestCancellation && !hasPendingCancellation) {
      setShowCancellationDialog(true);
    }
  }, [canRequestCancellation, hasPendingCancellation]);

  const confirmCancellation = useCallback(() => {
    if (!canRequestCancellation || hasPendingCancellation || requestCancellationMutation.isPending) {
      return;
    }
    requestCancellationMutation.mutate({
      bountyId: bounty.id,
      reason: cancellationReason || undefined,
    });
  }, [canRequestCancellation, hasPendingCancellation, requestCancellationMutation.isPending, requestCancellationMutation, bounty.id, cancellationReason]);

  const cancelCancellationRequest = useCallback(() => {
    cancelCancellationRequestMutation.mutate({ bountyId: bounty.id });
  }, [cancelCancellationRequestMutation, bounty.id]);

  // Computed values
  const getBadgeInfo = useCallback(() => {
    if (isCancelled || isRefunded) {
      return {
        label: 'Cancelled',
        className: 'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-[#FF000015] text-[#FF6B6B] border border-[#FF000020]',
      };
    }
    if (hasPendingCancellation) {
      return {
        label: 'Cancelling',
        className: 'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-[#FFB30015] text-[#FFB300] border border-[#FFB30020]',
      };
    }
    if (isFunded) {
      return {
        label: 'Funded',
        className: 'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-[#6CFF0015] text-[#6CFF0099] border border-[#6CFF0020]',
      };
    }
    return {
      label: 'Unfunded',
      className: 'text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-[#FFFFFF08] text-[#FFFFFF66] border border-[#FFFFFF12]',
    };
  }, [isCancelled, isRefunded, hasPendingCancellation, isFunded]);

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
    const match = urlCandidate.match(/github\.com\/([^/]+\/[^/]+)/i);
    return match?.[1] || 'Unknown repo';
  })();

  const issueDisplay = (() => {
    if (!bounty.issueUrl) {
      return null;
    }
    const match = bounty.issueUrl.match(/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/i);
    if (!match) {
      return null;
    }
    const issueNumber = match[1];
    const repoMatch = bounty.issueUrl.match(/github\.com\/([^/]+\/[^/]+)/i);
    const repoSlug = repoMatch?.[1] || 'unknown';
    return {
      number: issueNumber,
      repo: repoSlug,
      url: bounty.issueUrl,
    };
  })();

  const formattedAmount = `$${bounty.amount.toLocaleString()}`;

  // State object
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
      isTogglePinPending: togglePinMutation.isPending,
      isDeletePending: deleteBountyMutation.isPending,
      isRequestCancellationPending: requestCancellationMutation.isPending,
      isCancelCancellationRequestPending: cancelCancellationRequestMutation.isPending,
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
      togglePinMutation.isPending,
      deleteBountyMutation.isPending,
      requestCancellationMutation.isPending,
      cancelCancellationRequestMutation.isPending,
    ]
  );

  // Actions object
  const actions: BountyCardActions = useMemo(
    () => ({
      handleClick,
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
      togglePin,
      openDeleteDialog,
      confirmDelete,
      cancelDelete,
      openCancellationDialog,
      confirmCancellation,
      cancelCancellationRequest,
    ]
  );

  // Meta object
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
    [onDelete, showDeleteDialog, setShowDeleteDialog, showCancellationDialog, setShowCancellationDialog, cancellationReason, setCancellationReason]
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
