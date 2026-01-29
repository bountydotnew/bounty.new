'use client';

import { memo } from 'react';
import { BountyCardProvider } from './provider';
import { BaseBountyCard } from './base-card';
import type { Bounty } from '@/types/dashboard';

/**
 * BountyCard Compound Component
 *
 * Provides a flexible, composable API for bounty cards following Vercel
 * composition patterns with explicit variants.
 *
 * @example
 * ```tsx
 * // Compact variant
 * <CompactBountyCard bounty={bounty} stats={stats} />
 *
 * // Standard variant
 * <StandardBountyCard bounty={bounty} stats={stats} />
 *
 * // With delete callback
 * <CompactBountyCard bounty={bounty} stats={stats} onDelete={handleDelete} />
 * ```
 */

interface BountyCardProps {
  bounty: Bounty;
  stats?: {
    commentCount: number;
    voteCount: number;
    submissionCount: number;
    isVoted: boolean;
    bookmarked: boolean;
  };
  onDelete?: () => void;
}

/**
 * Compact variant of the bounty card with smaller spacing and text.
 * Ideal for dense layouts and grid views.
 */
export const CompactBountyCard = memo(function CompactBountyCard({
  bounty,
  stats,
  onDelete,
}: BountyCardProps) {
  return (
    <BountyCardProvider bounty={bounty} stats={stats} onDelete={onDelete}>
      <BaseBountyCard compact={true} />
    </BountyCardProvider>
  );
});

/**
 * Standard variant of the bounty card with more generous spacing.
 * Ideal for list views and featured bounties.
 */
export const StandardBountyCard = memo(function StandardBountyCard({
  bounty,
  stats,
  onDelete,
}: BountyCardProps) {
  return (
    <BountyCardProvider bounty={bounty} stats={stats} onDelete={onDelete}>
      <BaseBountyCard compact={false} />
    </BountyCardProvider>
  );
});

/**
 * BountyCard compound component exports
 */
export const BountyCard = {
  Provider: BountyCardProvider,
  Base: BaseBountyCard,
  Compact: CompactBountyCard,
  Standard: StandardBountyCard,
};

/**
 * Backward-compatible BountyCard component
 *
 * Maintains the old API for gradual migration.
 * Use the new explicit variants (CompactBountyCard/StandardBountyCard) for new code.
 *
 * @deprecated Use CompactBountyCard or StandardBountyCard instead
 */
interface LegacyBountyCardProps extends BountyCardProps {
  compact?: boolean;
}

export const LegacyBountyCard = memo(function LegacyBountyCard({
  bounty,
  stats,
  onDelete,
  compact = false,
}: LegacyBountyCardProps) {
  return (
    <BountyCardProvider bounty={bounty} stats={stats} onDelete={onDelete}>
      <BaseBountyCard compact={compact} />
    </BountyCardProvider>
  );
});

// Re-export types
export type {
  BountyCardContextValue,
  BountyCardState,
  BountyCardActions,
  BountyCardMeta,
} from './context';

// Named export for the provider (used by compound component pattern)
export { BountyCardProvider } from './provider';
