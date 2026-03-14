'use client';

import { useQuery, useMutation, useAction } from 'convex/react';
import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from '@/utils/convex';
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
  // Fetch bookmark state if not controlled
  const bookmarkData = useQuery(
    api.functions.bounties.getBountyBookmark,
    onToggleBookmark ? 'skip' : { bountyId }
  );

  const bookmarked = onToggleBookmark
    ? controlledBookmarked
    : (bookmarkData?.bookmarked ?? false);

  // DB-only mutations
  const toggleBountyBookmark = useMutation(
    api.functions.bounties.toggleBountyBookmark
  );

  // Actions (external API calls — GitHub)
  const createGithubIssue = useAction(api.functions.bounties.createGithubIssue);
  const checkGithubSync = useAction(api.functions.bounties.checkGithubSync);
  const syncToGithub = useAction(api.functions.bounties.syncToGithub);

  // Pending state tracking
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [isCreateGithubIssuePending, setIsCreateGithubIssuePending] =
    useState(false);
  const [isCheckGithubSyncPending, setIsCheckGithubSyncPending] =
    useState(false);
  const [isSyncToGithubPending, setIsSyncToGithubPending] = useState(false);

  const handleSyncToGithub = useCallback(async () => {
    setIsSyncToGithubPending(true);
    try {
      const result = await syncToGithub({ bountyId });
      toast.success('Synced to GitHub', {
        description: result.message,
      });
    } catch (error) {
      toast.error('Failed to sync to GitHub', {
        description: (error as Error).message,
      });
    } finally {
      setIsSyncToGithubPending(false);
    }
  }, [syncToGithub, bountyId]);

  // Actions object
  const actionsValue: BountyActionsActions = useMemo(
    () => ({
      upvote: () => {
        // This is handled by the parent component via props
      },
      toggleBookmark: async () => {
        if (onToggleBookmark) {
          return onToggleBookmark();
        }
        setIsBookmarkPending(true);
        try {
          await toggleBountyBookmark({ bountyId });
        } finally {
          setIsBookmarkPending(false);
        }
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
      createGithubIssue: async () => {
        setIsCreateGithubIssuePending(true);
        try {
          const result = await createGithubIssue({ bountyId });
          toast.success('GitHub issue created', {
            description: result.message,
          });
          window.location.reload();
        } catch (error) {
          toast.error('Failed to create GitHub issue', {
            description: (error as Error).message,
          });
        } finally {
          setIsCreateGithubIssuePending(false);
        }
      },
      checkGithubSync: async () => {
        setIsCheckGithubSyncPending(true);
        try {
          const result = await checkGithubSync({ bountyId });
          if (result.synced) {
            toast.success('GitHub sync check', {
              description: result.message,
            });
          } else if (
            !result.hasComment ||
            result.needsInitialComment === true
          ) {
            toast.error('Not synced to GitHub', {
              description: result.message,
              action: {
                label: 'Sync now',
                onClick: () => handleSyncToGithub(),
              },
            });
          } else {
            toast.warning('GitHub sync check', {
              description: result.message,
            });
          }
        } catch (error) {
          toast.error('Failed to check GitHub sync', {
            description: (error as Error).message,
          });
        } finally {
          setIsCheckGithubSyncPending(false);
        }
      },
      syncToGithub: handleSyncToGithub,
    }),
    [
      onToggleBookmark,
      toggleBountyBookmark,
      bountyId,
      onShare,
      onEdit,
      onDelete,
      createGithubIssue,
      checkGithubSync,
      handleSyncToGithub,
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
      isBookmarkPending,
      isCreateGithubIssuePending,
      isCheckGithubSyncPending,
      isSyncToGithubPending,
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
      isBookmarkPending,
      isCreateGithubIssuePending,
      isCheckGithubSyncPending,
      isSyncToGithubPending,
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
