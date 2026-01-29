'use client';

import BookmarkButtonComponent from '@/components/bounty/bookmark-button';
import { BountyActionsProvider } from './provider';
import { UpvoteButton } from './upvote-button';
import { Dropdown } from './dropdown';

/**
 * BountyActions Compound Component
 *
 * Provides a flexible, composable API for bounty action buttons.
 * Following Vercel composition patterns with explicit components.
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { BountyActions } from '@/components/bounty/bounty-actions';
 *
 * <BountyActions.Provider
 *   bountyId={bountyId}
 *   canEdit={canEdit}
 *   isVoted={isVoted}
 *   voteCount={voteCount}
 *   onUpvote={handleUpvote}
 * >
 *   <BountyActions.UpvoteButton />
 *   <BountyActions.Dropdown />
 * </BountyActions.Provider>
 * ```
 */
export const BountyActions = {
  /**
   * Provider component that wraps the actions with state and mutations
   */
  Provider: BountyActionsProvider,

  /**
   * Upvote button component
   */
  UpvoteButton,

  /**
   * Dropdown menu with additional actions
   */
  Dropdown,
} as {
  Provider: typeof BountyActionsProvider;
  UpvoteButton: typeof UpvoteButton;
  Dropdown: typeof Dropdown;
  BookmarkButton: typeof BookmarkButtonComponent;
};

// Add BookmarkButton to the compound component
(BountyActions as any).BookmarkButton = BookmarkButtonComponent;

// Re-export types
export type { BountyActionsContextValue, BountyActionsState, BountyActionsActions, BountyActionsMeta } from './context';
export type { UpvoteButtonProps } from './upvote-button';

/**
 * UpvoteButton standalone export
 */
export { UpvoteButton };

/**
 * BookmarkButton re-export for convenience
 */
export { default as BookmarkButton } from '@/components/bounty/bookmark-button';
