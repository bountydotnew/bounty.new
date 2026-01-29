'use client';

import { memo } from 'react';
import { BountiesFeedProvider } from './provider';
import { ListView } from './list-view';
import { GridView } from './grid-view';
import type { Bounty } from '@/types/dashboard';

/**
 * BountiesFeed Compound Component
 *
 * Provides a flexible, composable API for displaying bounty feeds.
 * Following Vercel composition patterns with explicit variants instead of boolean props.
 *
 * @example
 * ```tsx
 * // New API with explicit variants
 * <BountiesFeed.Provider {...props}>
 *   <BountiesFeed.ListView />
 * </BountiesFeed.Provider>
 *
 * // Or use GridView variant
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

/**
 * Backward-compatible BountiesFeed component
 *
 * Maintains the old API for gradual migration.
 * Use the new compound component API for new code.
 *
 * @deprecated Use BountiesFeed.Provider with ListView or GridView instead
 */
interface LegacyBountiesFeedProps {
  title?: string;
  bounties?: Bounty[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  layout?: 'grid' | 'list';
  onBountyClick?: (bounty: Bounty) => void;
  className?: string;
}

export const LegacyBountiesFeed = memo(function LegacyBountiesFeed({
  title = '',
  bounties,
  isLoading,
  isError,
  error,
  layout = 'list',
  className = '',
}: LegacyBountiesFeedProps) {
  // Wrap in provider and use the appropriate view
  const ViewComponent = layout === 'grid' ? GridView : ListView;

  return (
    <BountiesFeedProvider
      bounties={bounties}
      isLoading={isLoading}
      isError={isError}
      error={error}
      title={title}
      className={className}
    >
      <ViewComponent />
    </BountiesFeedProvider>
  );
});

// Re-export types
export type { BountiesFeedContextValue, BountiesFeedState, BountiesFeedActions, BountiesFeedMeta } from './context';
