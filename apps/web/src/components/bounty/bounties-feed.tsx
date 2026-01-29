/**
 * BountiesFeed Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit variants (ListView, GridView) instead of boolean props
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * // New API with explicit variants (recommended)
 * import { BountiesFeed } from '@/components/bounty/bounties-feed';
 *
 * <BountiesFeed.Provider {...props}>
 *   <BountiesFeed.ListView />
 * </BountiesFeed.Provider>
 *
 * // Or use GridView variant
 * <BountiesFeed.Provider {...props}>
 *   <BountiesFeed.GridView />
 * </BountiesFeed.Provider>
 *
 * // Legacy API (backward compatible)
 * import { BountiesFeed as LegacyFeed } from '@/components/bounty/bounties-feed';
 *
 * <LegacyFeed bounties={bounties} isLoading={isLoading} layout="grid" />
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export { BountiesFeed as BountiesFeedCompound, LegacyBountiesFeed as BountiesFeed } from './bounties-feed/index';
export type {
  BountiesFeedContextValue,
  BountiesFeedState,
  BountiesFeedActions,
  BountiesFeedMeta,
} from './bounties-feed/index';
