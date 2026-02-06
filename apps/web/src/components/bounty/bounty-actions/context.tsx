import { createContext } from 'react';
import type { ActionItem } from '@/types/bounty-actions';

/**
 * BountyActions State Interface
 * Contains all data needed by child components
 */
export interface BountyActionsState {
  /** Whether the current user has upvoted this bounty */
  isVoted: boolean;
  /** Current vote count */
  voteCount: number;
  /** Whether the bounty is bookmarked */
  bookmarked: boolean;
  /** Whether the user can edit this bounty */
  canEdit: boolean;
  /** Whether the user can delete this bounty */
  canDelete: boolean;
  /** Whether the current user owns this bounty */
  isOwner: boolean;
  /** Whether mutations are in progress */
  isBookmarkPending: boolean;
  isCreateGithubIssuePending: boolean;
  isCheckGithubSyncPending: boolean;
  isSyncToGithubPending: boolean;
  /** Repository URL if linked */
  repositoryUrl: string | null;
  /** Issue URL if linked */
  issueUrl: string | null;
}

/**
 * BountyActions Actions Interface
 * Contains all actions that can be performed
 */
export interface BountyActionsActions {
  /** Toggle upvote on the bounty */
  upvote: () => void;
  /** Toggle bookmark status */
  toggleBookmark: () => void;
  /** Share the bounty */
  share: () => void;
  /** Open edit dialog */
  edit: () => void;
  /** Delete the bounty */
  delete: () => void;
  /** Create GitHub issue */
  createGithubIssue: () => void;
  /** Check GitHub sync status */
  checkGithubSync: () => void;
  /** Sync to GitHub */
  syncToGithub: () => void;
  /** Request cancellation (for funded bounties) */
  requestCancellation?: (reason?: string) => void;
  /** Cancel cancellation request */
  cancelCancellationRequest?: () => void;
}

/**
 * BountyActions Meta Interface
 * Contains metadata and configuration
 */
export interface BountyActionsMeta {
  /** Bounty ID */
  bountyId: string;
  /** Additional action items to display in dropdown */
  additionalActions?: ActionItem[];
  /** Custom on edit callback */
  onEdit?: () => void;
  /** Custom on delete callback */
  onDelete?: () => void;
  /** Custom on share callback */
  onShare?: () => void;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface BountyActionsContextValue {
  state: BountyActionsState;
  actions: BountyActionsActions;
  meta: BountyActionsMeta;
}

/**
 * Context for BountyActions compound components
 * Null means we're outside the provider
 */
export const BountyActionsContext = createContext<BountyActionsContextValue | null>(null);
