'use client';

/**
 * BountyActions Component
 *
 * Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit components instead of render props
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * import { BountyActions } from '@/components/bounty/bounty-actions';
 *
 * // Compound component API
 * <BountyActions.Provider {...props}>
 *   <BountyActions.UpvoteButton />
 *   <BountyActions.Dropdown />
 * </BountyActions.Provider>
 * ```
 *
 * @module
 */

import { useCallback } from 'react';
import { BountyActions as CompoundBountyActions } from './bounty-actions/index';
import type { ActionItem } from '@/types/bounty-actions';

interface BountyActionsProps {
  bookmarked?: boolean;
  bountyId: string;
  canDelete?: boolean;
  canEdit?: boolean;
  isVoted?: boolean;
  voteCount?: number;
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onUpvote?: () => void;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
  actions?: ActionItem[];
}

/**
 * BountyActions default export - convenience wrapper for the compound component.
 * Renders both UpvoteButton and Dropdown with proper state management.
 */
export default function BountyActions({
  bookmarked,
  bountyId,
  canDelete = false,
  canEdit = false,
  isVoted = false,
  voteCount = 0,
  onDelete,
  onEdit,
  onShare,
  onUpvote,
  repositoryUrl = null,
  issueUrl = null,
  actions,
}: BountyActionsProps) {
  const handleUpvoteClick = useCallback(() => {
    onUpvote?.();
  }, [onUpvote]);

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Upvote bounty"
        aria-pressed={isVoted}
        className="flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-1 text-neutral-300 text-xs hover:bg-neutral-700/40"
        onClick={handleUpvoteClick}
        type="button"
      >
        <svg
          className={`h-4 w-4 ${isVoted ? 'text-foreground' : ''}`}
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
        <span>{voteCount}</span>
      </button>
      <CompoundBountyActions.Provider
        actions={actions}
        bountyId={bountyId}
        canDelete={canDelete}
        canEdit={canEdit}
        bookmarked={bookmarked}
        isVoted={isVoted}
        voteCount={voteCount}
        repositoryUrl={repositoryUrl}
        issueUrl={issueUrl}
        onDelete={onDelete}
        onEdit={onEdit}
        onShare={onShare}
      >
        <CompoundBountyActions.Dropdown />
      </CompoundBountyActions.Provider>
    </div>
  );
}

// Re-export everything from the index file
export { BountyActions } from './bounty-actions/index';
export type {
  BountyActionsContextValue,
  BountyActionsState,
  BountyActionsActions,
  BountyActionsMeta,
  UpvoteButtonProps,
} from './bounty-actions/index';
