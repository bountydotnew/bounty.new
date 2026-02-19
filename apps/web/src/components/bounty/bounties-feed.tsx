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
 * import { BountiesFeed } from '@/components/bounty/bounties-feed';
 *
 * // List view variant
 * <BountiesFeed.Provider {...props}>
 *   <BountiesFeed.ListView />
 * </BountiesFeed.Provider>
 *
 * // Grid view variant
 * <BountiesFeed.Provider {...props}>
 *   <BountiesFeed.GridView />
 * </BountiesFeed.Provider>
 * ```
 *
 * @module
 */

// Re-export the compound component
export { BountiesFeed } from "./bounties-feed/index";
