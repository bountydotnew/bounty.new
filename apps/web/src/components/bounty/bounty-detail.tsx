/**
 * BountyDetail Component
 *
 * Refactored to use Vercel composition patterns:
 * - Compound components with shared context
 * - State/actions/meta context interface
 * - Explicit components for each section
 *
 * @example
 * ```tsx
 * // New API with compound components (recommended)
 * import { BountyDetail } from '@/components/bounty/bounty-detail';
 *
 * <BountyDetail.Provider {...props}>
 *   <BountyDetail.Header />
 *   <BountyDetail.PaymentAlert />
 *   <BountyDetail.Content />
 *   <BountyDetail.Submissions />
 * </BountyDetail.Provider>
 *
 * // Legacy API (backward compatible)
 * import { LegacyBountyDetailPage } from '@/components/bounty/bounty-detail';
 *
 * <LegacyBountyDetailPage {...props} />
 * ```
 *
 * @module
 */

// Re-export everything from the index file
export {
  BountyDetail as BountyDetailCompound,
  BountyDetailProvider,
  LegacyBountyDetailPage,
} from './bounty-detail/index';

export type {
  BountyDetailContextValue,
  BountyDetailState,
  BountyDetailActions,
  BountyDetailMeta,
  SubmissionData,
  SubmissionsData,
} from './bounty-detail/context';

// Default export for backward compatibility
export { LegacyBountyDetailPage as default } from './bounty-detail/index';
