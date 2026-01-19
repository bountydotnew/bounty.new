'use client';

import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpIcon,
  Bookmark,
  Edit,
  Github,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@bounty/ui/components/tooltip';
import BookmarkButton from '@/components/bounty/bookmark-button';
import type {
  ActionItem,
  ActionsDropdownProps,
  BountyActionsProps,
  UpvoteButtonProps,
} from '@/types/bounty-actions';
import { trpc, trpcClient } from '@/utils/trpc';

export function UpvoteButton({
  isVoted,
  voteCount,
  onUpvote,
  className,
}: UpvoteButtonProps) {
  return (
    <button
      aria-label="Upvote bounty"
      aria-pressed={isVoted}
      className={`flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-1 text-neutral-300 text-xs hover:bg-neutral-700/40 ${isVoted ? 'border-neutral-700/40 bg-[#343333] text-white' : ''} ${className ?? ''}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onUpvote();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <ArrowUpIcon className={`h-4 w-4 ${isVoted ? 'text-white' : ''}`} />
      <span>{voteCount}</span>
    </button>
  );
}

function ActionsDropdown({
  onShare,
  onBookmark,
  actions,
  ariaLabel,
  bookmarked,
  onDelete,
  canDelete,
  bountyId,
  repositoryUrl,
  issueUrl,
}: ActionsDropdownProps & { onDelete?: () => void; canDelete?: boolean; bountyId: string; repositoryUrl?: string | null; issueUrl?: string | null }) {
  // Create GitHub issue mutation
  const createGithubIssue = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.createGithubIssue.mutate({ bountyId });
    },
    onSuccess: (result) => {
      toast.success('GitHub issue created', {
        description: result.message,
      });
      // Refresh the page to show the updated bounty
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error('Failed to create GitHub issue', {
        description: error.message,
      });
    },
  });

  // GitHub sync check mutation
  const checkGithubSync = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.checkGithubSync.mutate({ bountyId });
    },
    onSuccess: (result) => {
      if (result.synced) {
        toast.success('GitHub sync check', {
          description: result.message,
        });
      } else {
        // Show sync button if not linked or needs sync
        if (!result.hasComment || result.needsInitialComment === true) {
          toast.error('Not synced to GitHub', {
            description: result.message,
            action: {
              label: 'Sync now',
              onClick: () => syncToGithub.mutate(),
            },
          });
        } else {
          toast.warning('GitHub sync check', {
            description: result.message,
          });
        }
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to check GitHub sync', {
        description: error.message,
      });
    },
  });

  // Sync to GitHub mutation
  const syncToGithub = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.syncToGithub.mutate({ bountyId });
    },
    onSuccess: (result) => {
      toast.success('Synced to GitHub', {
        description: result.message,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to sync to GitHub', {
        description: error.message,
      });
    },
  });

  const handleShare = () => {
    if (onShare) {
      return onShare();
    }
    try {
      if (typeof window !== 'undefined' && navigator.share) {
        navigator.share({ url: window.location.href });
      }
    } catch {}
  };

  const handleCheckGithubSync = () => {
    checkGithubSync.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={ariaLabel ?? 'Open actions'}
          className="rounded-md border border-neutral-700 bg-neutral-800/40 p-1 text-neutral-300 hover:bg-neutral-700/40"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          size="icon"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-10 w-48 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
        {actions?.map((action) => {
          const menuItem = (
            <DropdownMenuItem
              className={action.className || "text-neutral-200 hover:bg-neutral-800"}
              disabled={action.disabled}
              key={action.key}
              onClick={action.disabled ? undefined : action.onSelect}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          );

          if (action.tooltip && action.disabled) {
            return (
              <TooltipProvider key={action.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>{menuItem}</div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-center">
                    <p>{action.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return menuItem;
        })}
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={onBookmark}
        >
          <Bookmark
            className={`h-3.5 w-3.5 ${bookmarked ? 'fill-white' : ''}`}
          />
          {bookmarked ? 'Remove bookmark' : 'Bookmark'}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={handleCheckGithubSync}
          disabled={checkGithubSync.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checkGithubSync.isPending ? 'animate-spin' : ''}`} />
          Check GitHub sync
        </DropdownMenuItem>
        {repositoryUrl && !issueUrl ? (
          <DropdownMenuItem
            className="text-neutral-200 hover:bg-neutral-800"
            onClick={() => createGithubIssue.mutate()}
            disabled={createGithubIssue.isPending}
          >
            <Github className={`h-3.5 w-3.5 ${createGithubIssue.isPending ? 'animate-pulse' : ''}`} />
            Create GitHub issue
          </DropdownMenuItem>
        ) : issueUrl ? (
          <DropdownMenuItem
            className="text-neutral-200 hover:bg-neutral-800"
            onClick={() => syncToGithub.mutate()}
            disabled={syncToGithub.isPending}
          >
            <Github className={`h-3.5 w-3.5 ${syncToGithub.isPending ? 'animate-pulse' : ''}`} />
            Sync to GitHub
          </DropdownMenuItem>
        ) : null}
        {canDelete && onDelete && (
          <>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete bounty
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function BountyActions({
  bountyId,
  canEdit,
  canDelete = false,
  isVoted,
  voteCount,
  onUpvote,
  onEdit,
  onDelete,
  onShare,
  bookmarked: controlledBookmarked,
  onToggleBookmark,
  actions,
  repositoryUrl,
  issueUrl,
}: BountyActionsProps) {
  const queryClient = useQueryClient();
  const bookmarkQuery = useQuery({
    ...trpc.bounties.getBountyBookmark.queryOptions({ bountyId }),
    enabled: !onToggleBookmark,
  });
  const toggleBookmark = useMutation({
    mutationFn: async (input: { bountyId: string }) => {
      return await trpcClient.bounties.toggleBountyBookmark.mutate(input);
    },
  });
  const baseActions: ActionItem[] = [
    ...(canEdit
      ? [
          {
            key: 'edit',
            label: 'Edit',
            onSelect: onEdit,
            icon: <Edit className="h-3.5 w-3.5" />,
          },
        ]
      : []),
    ...(canDelete && onDelete
      ? [
          {
            key: 'delete',
            label: 'Delete',
            onSelect: onDelete,
            icon: <Trash2 className="h-3.5 w-3.5" />,
          },
        ]
      : []),
  ];
  const mergedActions = [...baseActions, ...(actions ?? [])];
  const handleToggleBookmark = () => {
    if (onToggleBookmark) {
      return onToggleBookmark();
    }
    const key = trpc.bounties.getBountyBookmark.queryKey({ bountyId });
    const current = bookmarkQuery.data?.bookmarked ?? false;
    queryClient.setQueryData(key, { bookmarked: !current });
    toggleBookmark.mutate(
      { bountyId },
      {
        onError: () => queryClient.setQueryData(key, { bookmarked: current }),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };
  return (
    <div className="flex items-center gap-2">
      <UpvoteButton
        isVoted={isVoted}
        onUpvote={onUpvote}
        voteCount={voteCount}
      />
      <BookmarkButton
        bookmarked={
          onToggleBookmark
            ? controlledBookmarked
            : bookmarkQuery.data?.bookmarked
        }
        bountyId={bountyId}
        onToggle={handleToggleBookmark}
      />
      <ActionsDropdown
        actions={mergedActions}
        ariaLabel="Open bounty actions"
        bookmarked={
          onToggleBookmark
            ? controlledBookmarked
            : bookmarkQuery.data?.bookmarked
        }
        bountyId={bountyId}
        canDelete={canDelete}
        onBookmark={handleToggleBookmark}
        onDelete={onDelete}
        onShare={onShare}
        repositoryUrl={repositoryUrl}
        issueUrl={issueUrl}
      />
    </div>
  );
}
