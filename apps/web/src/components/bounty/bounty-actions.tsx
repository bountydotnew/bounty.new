/**
 * BountyActions Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - Explicit components instead of render props
 * - State/actions/meta context interface
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { BountyActions } from '@/components/bounty/bounty-actions';
 *
 * <BountyActions.Provider {...props}>
 *   <BountyActions.UpvoteButton />
 *   <BountyActions.Dropdown />
 * </BountyActions.Provider>
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export { BountyActions, LegacyBountyActions as default } from './bounty-actions/index';
export type {
  BountyActionsContextValue,
  BountyActionsState,
  BountyActionsActions,
  BountyActionsMeta,
  UpvoteButtonProps,
} from './bounty-actions/index';
