'use client';

import { useContext } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import { BountyActionsContext } from './context';

export interface UpvoteButtonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * BountyActions UpvoteButton
 *
 * Compound component for displaying and handling upvotes.
 * Must be used within BountyActionsProvider.
 *
 * @example
 * ```tsx
 * <BountyActionsProvider {...props}>
 *   <BountyActions.UpvoteButton />
 * </BountyActionsProvider>
 * ```
 */
export function UpvoteButton({ className = '' }: UpvoteButtonProps) {
  const context = useContext(BountyActionsContext);
  if (!context) {
    throw new Error('UpvoteButton must be used within BountyActionsProvider');
  }

  const { state } = context;
  const { isVoted, voteCount } = state;

  // Note: The actual upvote action is handled by the parent component
  // This component only displays the state
  // The parent should pass an onUpvote prop to handle the action
  return (
    <button
      aria-label="Upvote bounty"
      aria-pressed={isVoted}
      className={`flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-1 text-neutral-300 text-xs hover:bg-neutral-700/40 ${
        isVoted ? 'border-neutral-700/40 bg-[#343333] text-white' : ''
      } ${className}`}
      type="button"
    >
      <ArrowUpIcon className={`h-4 w-4 ${isVoted ? 'text-white' : ''}`} />
      <span>{voteCount}</span>
    </button>
  );
}
