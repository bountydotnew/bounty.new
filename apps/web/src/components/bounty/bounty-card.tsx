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
import { authClient } from '@bounty/auth/client';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import type { Bounty } from '@/types/dashboard';
import { CommentsIcon, GithubIcon, SubmissionsPeopleIcon } from '@bounty/ui';
import { trpcClient } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { toast } from 'sonner';

interface BountyCardProps {
  bounty: Bounty;
  stats?: {
    commentCount: number;
    voteCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
  onDelete?: () => void;
}

export const BountyCard = memo(function BountyCard({
  bounty,
  stats: initialStats,
  onDelete,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const canDelete = session?.user?.id
    ? bounty.creator.id === session.user.id
    : false;

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
  const formattedAmount = `$${bounty.amount.toLocaleString()}`;

  // Extract repo name from repositoryUrl if available, otherwise use hardcoded
  const repoDisplay = bounty.repositoryUrl
    ? bounty.repositoryUrl
        .replace('https://github.com/', '')
        .replace('http://github.com/', '')
    : 'ripgrim/bountydotnew';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          aria-label={`View bounty: ${bounty.title}`}
          className="flex w-full cursor-pointer flex-col gap-2.5 rounded-xl border border-[#232323] bg-[#191919] p-4 sm:p-5 shadow-[0px_2px_3px_#00000033] transition duration-100 ease-out active:scale-[.98] min-w-0 text-left"
          onClick={handleClick}
          type="button"
        >
          {/* Top row: Creator + Amount */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[5px]">
              {bounty.creator.image ? (
                <Avatar className="h-4 w-4">
                  <AvatarImage alt={creatorName} src={bounty.creator.image} />
                  <AvatarFallback className="h-4 w-4 text-[8px]">
                    {creatorInitial}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div
                  className="flex h-4 w-4 items-center justify-center rounded-[6px] text-[8px] leading-[150%] text-white shadow-[inset_0px_2px_3px_#00000033]"
                  style={{
                    backgroundColor: avatarColor.bg,
                    outline: `1px solid ${avatarColor.border}`,
                    outlineOffset: '-1px',
                  }}
                >
                  {creatorInitial}
                </div>
              )}
              <span className="text-[13px] font-normal leading-[150%] text-[#FFFFFF99]">
                {creatorName}
              </span>
            </div>
            <div className="flex h-5 items-center gap-[5px] px-[3px]">
              <span className="text-[13px] font-semibold leading-[150%] text-[#6CFF0099]">
                {formattedAmount}
              </span>
            </div>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between min-w-0">
            <div className="flex h-[19.5px] items-center gap-[5px] min-w-0 flex-1">
              <span className="text-[13px] font-medium leading-[150%] text-white whitespace-normal wrap-break-word min-w-0">
                {bounty.title}
              </span>
            </div>
          </div>

          {/* Bottom row: Stats + Timestamp */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-[6px] sm:gap-[10px] min-w-0 flex-1">
              {/* Comments */}
              <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
                <div className="flex h-fit items-center opacity-30">
                  <CommentsIcon className="h-4 w-4" />
                </div>
                <span className="lg:text-[13px] text-[11px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </div>

              {/* Submissions (hardcoded) */}
              <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
                <div className="flex h-fit items-center opacity-100">
                  <SubmissionsPeopleIcon className="h-4 w-4" />
                </div>
                <span className="text-[11px] sm:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
                  10 submissions
                </span>
              </div>

              {/* GitHub repo */}
              <div className="flex h-fit items-center gap-[5px] px-[3px] min-w-0 flex-1 sm:flex-initial">
                <div className="flex h-fit items-center opacity-100 shrink-0">
                  <GithubIcon className="h-3 w-3" />
                </div>
                <span className="h-5 text-[11px] flex items-center md:text-[13px] lg:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] truncate min-w-0">
                  {repoDisplay}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex h-fit items-center gap-[5px] px-[3px] shrink-0">
              <span className="h-5 text-[11px] sm:text-[13px] font-normal leading-[150%] text-[#FFFFFF99] whitespace-nowrap">
                {formatDistanceToNow(new Date(bounty.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      {(canDelete || canPin) && (
        <ContextMenuContent className="w-48 rounded-md border border-[#232323] bg-[#191919] text-[#CFCFCF] shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]">
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
          {canDelete && (
            <ContextMenuItem
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={openDeleteDialog}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete bounty
            </ContextMenuItem>
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
    </ContextMenu>
  );
});
