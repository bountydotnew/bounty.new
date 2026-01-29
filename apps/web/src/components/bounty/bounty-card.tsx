/**
 * BountyCard Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit variants: CompactBountyCard, StandardBountyCard
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * // New API with explicit variants (recommended)
 * import { CompactBountyCard, StandardBountyCard } from '@/components/bounty/bounty-card';
 *
 * <CompactBountyCard bounty={bounty} stats={stats} />
 * <StandardBountyCard bounty={bounty} stats={stats} />
 *
 * // Legacy API (backward compatible)
 * import { BountyCard } from '@/components/bounty/bounty-card';
 *
 * <BountyCard bounty={bounty} stats={stats} compact />
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export {
  BountyCard as BountyCardCompound,
  CompactBountyCard,
  StandardBountyCard,
  BountyCardProvider,
} from './bounty-card/index';

// Backward compatible default export
export { LegacyBountyCard as BountyCard } from './bounty-card/index';

export type {
  BountyCardContextValue,
  BountyCardState,
  BountyCardActions,
  BountyCardMeta,
} from './bounty-card/context';
