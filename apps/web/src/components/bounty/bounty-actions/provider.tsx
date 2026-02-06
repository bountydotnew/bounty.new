'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, ReactNode } from 'react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import {
  BountyActionsContext,
  type BountyActionsContextValue,
  type BountyActionsActions,
  type BountyActionsState,
  type BountyActionsMeta,
} from './context';
import type { ActionItem } from '@/types/bounty-actions';

interface BountyActionsProviderProps {
  children: ReactNode;
  /** Bounty ID */
  bountyId: string;
  /** Whether the user can edit this bounty */
  canEdit?: boolean;
  /** Whether the user can delete this bounty */
  canDelete?: boolean;
  /** Whether the current user owns this bounty */
  isOwner?: boolean;
  /** Current vote count */
  voteCount?: number;
  /** Whether the user has upvoted this bounty */
  isVoted?: boolean;
  /** Whether the bounty is bookmarked (controlled) */
  bookmarked?: boolean;
  /** Repository URL if linked */
  repositoryUrl?: string | null;
  /** Issue URL if linked */
  issueUrl?: string | null;
  /** Custom on edit callback */
  onEdit?: () => void;
  /** Custom on delete callback */
  onDelete?: () => void;
  /** Custom on share callback */
  onShare?: () => void;
  /** Custom on toggle bookmark callback (if provided, uses controlled mode) */
  onToggleBookmark?: () => void;
  /** Additional action items to display in dropdown */
  actions?: ActionItem[];
}

/**
 * BountyActions Provider
 *
 * Wraps the actions with state and mutations following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <BountyActionsProvider
 *   bountyId={bountyId}
 *   canEdit={canEdit}
 *   isVoted={isVoted}
 *   voteCount={voteCount}
 * >
 *   <BountyActions.UpvoteButton />
 *   <BountyActions.BookmarkButton />
 *   <BountyActions.Dropdown />
 * </BountyActionsProvider>
 * ```
 */
export function BountyActionsProvider({
  children,
  bountyId,
  canEdit = false,
  canDelete = false,
  isOwner = false,
  voteCount = 0,
  isVoted = false,
  bookmarked: controlledBookmarked,
  repositoryUrl = null,
  issueUrl = null,
  onEdit,
  onDelete,
  onShare,
  onToggleBookmark,
  actions,
}: BountyActionsProviderProps) {
  const queryClient = useQueryClient();

  // Fetch bookmark state if not controlled
  const bookmarkQuery = useQuery({
    ...trpc.bounties.getBountyBookmark.queryOptions({ bountyId }),
    enabled: !onToggleBookmark,
  });

  const bookmarked = onToggleBookmark
    ? controlledBookmarked
    : bookmarkQuery.data?.bookmarked ?? false;

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.bounties.toggleBountyBookmark.mutate({
        bountyId,
      });
    },
    onSuccess: () => {
      // Invalidate query to refetch
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'getBountyBookmark']],
      });
    },
  });

  // Create GitHub issue mutation
  const createGithubIssueMutation = useMutation({
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

  // Check GitHub sync mutation
  const checkGithubSyncMutation = useMutation({
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
              onClick: () => syncToGithubMutation.mutate(),
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
  const syncToGithubMutation = useMutation({
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

  // Actions object
  const actionsValue: BountyActionsActions = useMemo(
    () => ({
      upvote: () => {
        // This is handled by the parent component via props
        // The provider just passes through the callback
      },
      toggleBookmark: () => {
        if (onToggleBookmark) {
          return onToggleBookmark();
        }
        const key = trpc.bounties.getBountyBookmark.queryKey({ bountyId });
        const current = bookmarkQuery.data?.bookmarked ?? false;
        queryClient.setQueryData(key, { bookmarked: !current });
        toggleBookmarkMutation.mutate(undefined, {
          onError: () => queryClient.setQueryData(key, { bookmarked: current }),
          onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
        });
      },
      share: () => {
        if (onShare) {
          return onShare();
        }
        try {
          if (typeof window !== 'undefined' && navigator.share) {
            navigator.share({ url: window.location.href });
          }
        } catch {
          // Silently ignore share errors
        }
      },
      edit: () => {
        onEdit?.();
      },
      delete: () => {
        onDelete?.();
      },
      createGithubIssue: () => {
        createGithubIssueMutation.mutate();
      },
      checkGithubSync: () => {
        checkGithubSyncMutation.mutate();
      },
      syncToGithub: () => {
        syncToGithubMutation.mutate();
      },
    }),
    [
      onToggleBookmark,
      bookmarkQuery,
      bountyId,
      queryClient,
      toggleBookmarkMutation,
      onShare,
      onEdit,
      onDelete,
      createGithubIssueMutation,
      checkGithubSyncMutation,
      syncToGithubMutation,
    ]
  );

  // State object
  const state: BountyActionsState = useMemo(
    () => ({
      isVoted,
      voteCount,
      bookmarked: bookmarked ?? false,
      canEdit,
      canDelete,
      isOwner,
      isBookmarkPending: toggleBookmarkMutation.isPending,
      isCreateGithubIssuePending: createGithubIssueMutation.isPending,
      isCheckGithubSyncPending: checkGithubSyncMutation.isPending,
      isSyncToGithubPending: syncToGithubMutation.isPending,
      repositoryUrl,
      issueUrl,
    }),
    [
      isVoted,
      voteCount,
      bookmarked,
      canEdit,
      canDelete,
      isOwner,
      toggleBookmarkMutation.isPending,
      createGithubIssueMutation.isPending,
      checkGithubSyncMutation.isPending,
      syncToGithubMutation.isPending,
      repositoryUrl,
      issueUrl,
    ]
  );

  // Meta object
  const meta: BountyActionsMeta = useMemo(
    () => ({
      bountyId,
      additionalActions: actions,
      onEdit,
      onDelete,
      onShare,
    }),
    [bountyId, actions, onEdit, onDelete, onShare]
  );

  const contextValue: BountyActionsContextValue = useMemo(
    () => ({
      state,
      actions: actionsValue,
      meta,
    }),
    [state, actionsValue, meta]
  );

  return (
    <BountyActionsContext.Provider value={contextValue}>
      {children}
    </BountyActionsContext.Provider>
  );
}
