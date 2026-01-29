'use client';

import { BountyListProvider } from './provider';

/**
 * BountyList Compound Component
 *
 * Provides a provider for bounty list page state management including filters.
 *
 * @example
 * ```tsx
 * import { BountyList } from '@/components/bounty/bounty-list';
 *
 * <BountyList.Provider>
 *   <YourBountyListContent />
 * </BountyList.Provider>
 * ```
 */
export const BountyList = {
  /**
   * Provider component that wraps the bounty list page with state and actions
   */
  Provider: BountyListProvider,
};

// Re-export types
export type {
  BountyListContextValue,
  BountyListState,
  BountyListActions,
  BountyListMeta,
  SortByOption,
  SortOrderOption,
} from './context';

// Re-export provider and context for direct usage
export { BountyListProvider, BountyListContext } from './provider';
