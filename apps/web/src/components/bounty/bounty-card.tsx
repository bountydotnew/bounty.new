/**
 * BountyCard Component
 *
 * Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit variants: CompactBountyCard, StandardBountyCard
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * import { CompactBountyCard, StandardBountyCard, BountyCard } from '@/components/bounty/bounty-card';
 *
 * <CompactBountyCard bounty={bounty} stats={stats} />
 * <StandardBountyCard bounty={bounty} stats={stats} />
 *
 * // Or use the compound API
 * <BountyCard.Provider bounty={bounty} stats={stats}>
 *   <BountyCard.Base />
 * </BountyCard.Provider>
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export {
  CompactBountyCard,
  StandardBountyCard,
} from './bounty-card/index';
