'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@bounty/ui/components/context-menu';
import { addNavigationContext } from '@bounty/ui/hooks/use-navigation-context';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '@/context/session-context';
import { AlertTriangle, Pin, PinOff, Trash2, XCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import type { Bounty } from '@/types/dashboard';
import { CommentsIcon, GithubIcon, SubmissionsPeopleIcon } from '@bounty/ui';
import { trpc, trpcClient } from '@/utils/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { Textarea } from '@bounty/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@bounty/ui/components/tooltip';
import { toast } from 'sonner';

interface BountyCardProps {
  bounty: Bounty;
  stats?: {
    commentCount: number;
    voteCount: number;
    submissionCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
  onDelete?: () => void;
  compact?: boolean;
}

export const BountyCard = memo(function BountyCard({
  bounty,
  stats: initialStats,
  onDelete,
  compact = false,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSession();
  const queryClient = useQueryClient();

  const isOwner = session?.user?.id
    ? bounty.creator.id === session.user.id
    : false;

  // Determine funding and cancellation status
  // Include 'released' so completed bounties still show as funded
  const isFunded = bounty.paymentStatus === 'held' || bounty.paymentStatus === 'released';
  const isCancelled = bounty.status === 'cancelled';
  const isRefunded = bounty.paymentStatus === 'refunded';

  const canPin = session?.user?.id
    ? bounty.creator.id === session.user.id
    : false;

  const togglePinMutation = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.toggleBountyPin.mutate(input);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
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

  const handleTogglePin = () => {
    if (canPin && !togglePinMutation.isPending) {
      togglePinMutation.mutate({ bountyId: bounty.id });
    }
  };

  const handleClick = () => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const openDeleteDialog = () => {
    if (canDelete) {
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = () => {
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
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  // Cancellation request for funded bounties
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Query cancellation status - shared cache with bounty-detail page
  const canRequestCancellation = isOwner && isFunded;
  const cancellationStatusQuery = useQuery({
    ...trpc.bounties.getCancellationStatus.queryOptions({ bountyId: bounty.id }),
    enabled: canRequestCancellation,
  });

  const hasPendingCancellation = cancellationStatusQuery.data?.hasPendingRequest ?? false;

  // Owner can delete if:
  // 1. Bounty is not funded, OR
  // 2. Bounty has a pending cancellation request (safe to delete), OR
  // 3. Bounty is already cancelled/refunded
  const canDelete = isOwner && (!isFunded || hasPendingCancellation || isCancelled || isRefunded);
  const showDeleteOption = isOwner;

  // Determine badge status
  const getBadgeInfo = () => {
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
  };

  const badgeInfo = getBadgeInfo();

  const requestCancellationMutation = useMutation({
    mutationFn: async (input: { bountyId: string; reason?: string }) => {
      return await trpcClient.bounties.requestCancellation.mutate(input);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Cancellation request submitted');
      setShowCancellationDialog(false);
      setCancellationReason('');
      // Invalidate the shared cache so both card and detail page update
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
      // Invalidate the shared cache so both card and detail page update
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getCancellationStatus']],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel cancellation request: ${error.message}`);
    },
  });

  const openCancellationDialog = () => {
    if (canRequestCancellation && !hasPendingCancellation) {
      setShowCancellationDialog(true);
    }
  };

  const handleConfirmCancellation = () => {
    if (!canRequestCancellation || hasPendingCancellation || requestCancellationMutation.isPending) {
      return;
    }
    requestCancellationMutation.mutate({
      bountyId: bounty.id,
      reason: cancellationReason || undefined,
    });
  };

  // Show name or fallback - never "Anonymous" for private profiles
  // Private profiles still show name, only profile details are hidden
  const creatorName = bounty.creator.name || 'User';
  const creatorInitial = creatorName.charAt(0).toLowerCase();

  // Generate color from creator name (simple hash-based approach)
  const colors = [
    { bg: '#E66700', border: '#C95900' },
    { bg: '#0066FF', border: '#0052CC' },
    { bg: '#00B894', border: '#00A085' },
    { bg: '#E84393', border: '#D63031' },
    { bg: '#6C5CE7', border: '#5F4FCF' },
  ];
  const colorIndex = creatorName.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  const commentCount = initialStats?.commentCount ?? 0;
  const submissionCount = initialStats?.submissionCount ?? 0;
  const formattedAmount = `$${bounty.amount.toLocaleString()}`;

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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          aria-label={`View bounty: ${bounty.title}`}
          className={`flex w-full cursor-pointer flex-col rounded-xl border border-[#232323] bg-[#191919] shadow-[0px_2px_3px_#00000033] transition duration-100 ease-out active:scale-[.98] min-w-0 text-left ${compact ? 'gap-1.5 p-2' : 'gap-2.5 p-4 sm:p-5'}`}
          onClick={handleClick}
          type="button"
        >
          {/* Top row: Creator + Amount */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${compact ? 'gap-1' : 'gap-[5px]'}`}>
              {bounty.creator.image ? (
                <Avatar className={compact ? 'h-3 w-3' : 'h-4 w-4'}>
                  <AvatarImage alt={creatorName} src={bounty.creator.image} />
                  <AvatarFallback className={compact ? 'h-3 w-3 text-[6px]' : 'h-4 w-4 text-[8px]'}>
                    {creatorInitial}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className={`flex items-center justify-center rounded-[6px] leading-[150%] text-white shadow-[inset_0px_2px_3px_#00000033] ${compact ? 'h-3 w-3 text-[6px]' : 'h-4 w-4 text-[8px]'}`}
                  style={{
                    backgroundColor: avatarColor.bg,
                    outline: `1px solid ${avatarColor.border}`,
                    outlineOffset: '-1px',
                  }}
                >
                  {creatorInitial}
                </div>
              )}
              <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99]`}>
                {creatorName}
              </span>
            </div>
            <div className={`flex items-center ${compact ? 'gap-1 px-1' : 'h-5 gap-[5px] px-[3px]'}`}>
              <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-semibold leading-[150%] text-[#6CFF0099]`}>
                {formattedAmount}
              </span>
              <span className={badgeInfo.className}>
                {badgeInfo.label}
              </span>
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between min-w-0">
            <div className={`flex items-center gap-[5px] min-w-0 flex-1 ${compact ? 'h-4' : 'h-[19.5px]'}`}>
              <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-medium leading-[150%] text-white whitespace-normal wrap-break-word min-w-0`}>
                {bounty.title}
              </span>
            </div>
          </div>

          {/* Bottom row: Stats + Timestamp */}
          <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 min-w-0 ${compact ? '' : 'gap-2'}`}>
            <div className={`flex flex-wrap items-center min-w-0 flex-1 ${compact ? 'gap-1' : 'gap-[6px] sm:gap-[10px]'}`}>
              {/* Comments - commented out */}
              {/* <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
                <div className="flex h-fit items-center opacity-30">
                  <CommentsIcon className="h-4 w-4" />
                </div>
                <span className="text-[11px] sm:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </div> */}

              {/* Submissions */}
              <div className={`flex h-fit items-center shrink-0 ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}>
                <div className="flex h-fit items-center opacity-30">
                  <SubmissionsPeopleIcon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                </div>
                <span className={`${compact ? 'text-[9px]' : 'text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap`}>
                  {submissionCount} {submissionCount === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {/* GitHub repo */}
              {issueDisplay ? (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center min-w-0 flex-1 sm:flex-initial hover:bg-[#2A2A28] rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <GithubIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span className={`flex items-center font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}>
                    {issueDisplay.repo}
                  </span>
                </a>
              ) : (
                <div className={`flex h-fit items-center gap-[5px] px-[3px] min-w-0 flex-1 sm:flex-initial`}>
                  <div className="flex h-fit items-center opacity-30 shrink-0">
                    <GithubIcon className={compact ? 'h-2 w-2' : 'h-3 w-3'} />
                  </div>
                  <span className={`flex items-center font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0 ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}>
                    {repoDisplay}
                  </span>
                </div>
              )}

              {/* GitHub issue link */}
              {issueDisplay && (
                <a
                  href={issueDisplay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-fit items-center shrink-0 hover:bg-[#2A2A28] rounded-md transition-colors ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className={`flex items-center font-normal leading-[150%] text-[#6CFF0099] whitespace-nowrap ${compact ? 'text-[9px]' : 'h-5 text-[11px] md:text-[13px] lg:text-[13px]'}`}>
                    #{issueDisplay.number}
                  </span>
                </a>
              )}
            </div>

            {/* Timestamp */}
            <div className={`flex h-fit items-center shrink-0 ${compact ? 'gap-1 px-1' : 'gap-[5px] px-[3px]'}`}>
              <span className={`${compact ? 'text-[9px]' : 'h-5 text-[11px] sm:text-[13px]'} font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap`}>
                {formatDistanceToNow(new Date(bounty.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      {(showDeleteOption || canPin) && (
        <ContextMenuContent className="w-56 rounded-md border border-[#232323] bg-[#191919] text-[#CFCFCF] shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]">
          {canPin && (
            <ContextMenuItem
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
              onClick={handleTogglePin}
              disabled={togglePinMutation.isPending}
            >
              {bounty.isFeatured ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  Unpin bounty
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  Pin bounty
                </>
              )}
            </ContextMenuItem>
          )}
          {/* Show delete for deletable bounties (unfunded, pending cancellation, or cancelled) */}
          {canDelete && (
            <ContextMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={openDeleteDialog}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete bounty
            </ContextMenuItem>
          )}
          {/* Show cancellation options for funded bounties */}
          {canRequestCancellation && !isCancelled && !isRefunded && (
            <>
              {!hasPendingCancellation ? (
                <ContextMenuItem
                  className="cursor-pointer text-yellow-500 focus:text-yellow-500 focus:bg-yellow-500/10"
                  onClick={openCancellationDialog}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Request cancellation
                </ContextMenuItem>
              ) : (
                <ContextMenuItem
                  className="cursor-pointer text-green-500 focus:text-green-500 focus:bg-green-500/10"
                  onClick={() => cancelCancellationRequestMutation.mutate({ bountyId: bounty.id })}
                  disabled={cancelCancellationRequestMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel cancellation request
                </ContextMenuItem>
              )}
            </>
          )}
        </ContextMenuContent>
      )}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="border border-[#232323] bg-[#191919] text-[#CFCFCF]">
          <DialogHeader>
            <DialogTitle className="text-white mb-6">
              Delete bounty?
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              This action cannot be undone. Are you sure you want to delete this
              bounty?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!canDelete || deleteBountyMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent className="border border-[#232323] bg-[#191919] text-[#CFCFCF]">
          <DialogHeader>
            <DialogTitle className="text-white mb-2">
              Request Cancellation
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              Request to cancel this funded bounty. Our team will review your request
              and process a refund. Note: The platform fee is non-refundable.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px] border-[#333] bg-[#0a0a0a] text-white placeholder:text-[#666]"
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowCancellationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancellation}
              disabled={requestCancellationMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {requestCancellationMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
});
