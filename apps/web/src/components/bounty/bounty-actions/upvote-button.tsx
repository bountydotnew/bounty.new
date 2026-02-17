'use client';

import { useContext } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import { BountyActionsContext } from './context';

interface UpvoteButtonProps {
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
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
        isVoted
          ? 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent'
          : 'border-border-subtle bg-surface-1 text-text-tertiary hover:border-border-default hover:text-foreground'
      } ${className}`}
      type="button"
    >
      <ArrowUpIcon
        className={`h-4 w-4 ${isVoted ? 'text-brand-accent' : ''}`}
      />
      <span>{voteCount}</span>
    </button>
  );
}
