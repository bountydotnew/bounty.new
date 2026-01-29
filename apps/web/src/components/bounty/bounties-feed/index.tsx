'use client';

import { BountiesFeedProvider } from './provider';
import { ListView } from './list-view';
import { GridView } from './grid-view';

/**
 * BountiesFeed Compound Component
 *
 * Provides a flexible, composable API for displaying bounty feeds.
 * Following Vercel composition patterns with explicit variants instead of boolean props.
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
 */
export const BountiesFeed = {
  /**
   * Provider component that wraps the feed with state and actions
   */
  Provider: BountiesFeedProvider,

  /**
   * List view variant - displays bounties in a vertical list
   */
  ListView,

  /**
   * Grid view variant - displays bounties in a responsive grid
   */
  GridView,
};

// Re-export types and provider
export type { BountiesFeedContextValue, BountiesFeedState, BountiesFeedActions, BountiesFeedMeta } from './context';
export { BountiesFeedProvider } from './provider';
