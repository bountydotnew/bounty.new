import { createContext } from 'react';
import type { Bounty } from '@/types/dashboard';

/**
 * BountyCard State Interface
 * Contains all data needed by child components
 */
export interface BountyCardState {
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
  /** Whether the user is the owner */
  isOwner: boolean;
  /** Whether the bounty is funded */
  isFunded: boolean;
  /** Whether the bounty is cancelled */
  isCancelled: boolean;
  /** Whether the payment is refunded */
  isRefunded: boolean;
  /** Whether user can pin */
  canPin: boolean;
  /** Whether user can delete */
  canDelete: boolean;
  /** Whether user can request cancellation */
  canRequestCancellation: boolean;
  /** Whether there's a pending cancellation */
  hasPendingCancellation: boolean;
  /** Formatted amount */
  formattedAmount: string;
  /** Badge info */
  badgeInfo: {
    label: string;
    className: string;
  };
  /** Creator display info */
  creatorName: string;
  creatorInitial: string;
  avatarColor: {
    bg: string;
    border: string;
  };
  /** Repository display */
  repoDisplay: string;
  /** Issue display */
  issueDisplay: {
    number: string;
    repo: string;
    url: string;
  } | null;
  /** Linear display */
  linearDisplay: {
    identifier: string;
    url: string;
  } | null;
  /** Mutation states */
  isTogglePinPending: boolean;
  isDeletePending: boolean;
  isRequestCancellationPending: boolean;
  isCancelCancellationRequestPending: boolean;
}

/**
 * BountyCard Actions Interface
 * Contains all actions that can be performed
 */
export interface BountyCardActions {
  /** Handle card click (navigate) */
  handleClick: () => void;
  /** Toggle pin */
  togglePin: () => void;
  /** Show delete dialog */
  openDeleteDialog: () => void;
  /** Confirm delete */
  confirmDelete: () => void;
  /** Cancel delete */
  cancelDelete: () => void;
  /** Show cancellation dialog */
  openCancellationDialog: () => void;
  /** Confirm cancellation */
  confirmCancellation: () => void;
  /** Cancel cancellation request */
  cancelCancellationRequest: () => void;
}

/**
 * BountyCard Meta Interface
 * Contains metadata and configuration
 */
export interface BountyCardMeta {
  /** Optional delete callback from parent */
  onDelete?: () => void;
  /** Dialog states */
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  showCancellationDialog: boolean;
  setShowCancellationDialog: (show: boolean) => void;
  cancellationReason: string;
  setCancellationReason: (reason: string) => void;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface BountyCardContextValue {
  state: BountyCardState;
  actions: BountyCardActions;
  meta: BountyCardMeta;
}

/**
 * Context for BountyCard compound components
 * Null means we're outside the provider
 */
export const BountyCardContext = createContext<BountyCardContextValue | null>(null);
