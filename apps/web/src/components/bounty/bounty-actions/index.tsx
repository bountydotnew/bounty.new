'use client';

import { memo } from 'react';
import BookmarkButtonComponent from '@/components/bounty/bookmark-button';
import { BountyActionsProvider } from './provider';
import { UpvoteButton } from './upvote-button';
import { Dropdown } from './dropdown';
import type { ActionItem } from '@/types/bounty-actions';

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
 * UpvoteButton standalone export for backward compatibility
 */
export { UpvoteButton };

/**
 * BookmarkButton re-export for convenience
 */
export { default as BookmarkButton } from '@/components/bounty/bookmark-button';

/**
 * Backward-compatible BountyActions component
 *
 * Maintains the old API for gradual migration.
 * Use the new compound component API for new code.
 *
 * @deprecated Use BountyActions.Provider with individual components instead
 */
interface LegacyBountyActionsProps {
  bountyId: string;
  canEdit?: boolean;
  canDelete?: boolean;
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  actions?: ActionItem[];
  repositoryUrl?: string | null;
  issueUrl?: string | null;
}

export const LegacyBountyActions = memo(function LegacyBountyActions({
  bountyId,
  canEdit = false,
  canDelete = false,
  isVoted,
  voteCount,
  onUpvote,
  onEdit,
  onDelete,
  onShare,
  bookmarked,
  onToggleBookmark,
  actions,
  repositoryUrl,
  issueUrl,
}: LegacyBountyActionsProps) {
  // Note: This is a minimal wrapper for backward compatibility
  // The upvote action is still handled by the parent component
  // For a full refactor, the upvote logic should move into the provider

  return (
    <div className="flex items-center gap-2">
      {/* Upvote button is kept outside for now since it uses parent's onUpvote */}
      <button
        aria-label="Upvote bounty"
        aria-pressed={isVoted}
        className={`flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-1 text-neutral-300 text-xs hover:bg-neutral-700/40 ${
          isVoted ? 'border-neutral-700/40 bg-[#343333] text-white' : ''
        }`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onUpvote();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        type="button"
      >
        <svg
          className={`h-4 w-4 ${isVoted ? 'text-white' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span>{voteCount}</span>
      </button>

      {/* Provider for other actions */}
      <BountyActionsProvider
        actions={actions}
        bountyId={bountyId}
        canDelete={canDelete}
        canEdit={canEdit}
        issueUrl={issueUrl}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
        onToggleBookmark={onToggleBookmark}
        repositoryUrl={repositoryUrl}
      >
        <BookmarkButtonComponent
          bookmarked={bookmarked}
          bountyId={bountyId}
          onToggle={
            onToggleBookmark ||
            (() => {
              // Handled by provider
            })
          }
        />
        <Dropdown />
      </BountyActionsProvider>
    </div>
  );
});
