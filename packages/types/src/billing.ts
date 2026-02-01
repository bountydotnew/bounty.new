/**
 * Billing Types
 *
 * Application-layer billing types that integrate with Autumn.
 * Re-exports common types from autumn.ts for convenience.
 */

// Import Autumn types for re-export and legacy aliases
import type {
  AutumnCustomer,
  AutumnCustomerCreateParams,
  AutumnCustomerUpdateParams,
  AutumnSubscription,
  AutumnSubscriptionStatus,
  AutumnProduct,
  AutumnFeatureState,
  AutumnFeatureInterval,
  AutumnCheckoutParams,
  AutumnCheckoutSession,
  AutumnPortalSession,
  AutumnUsageEvent,
  AutumnUsageEventResponse,
  AutumnError,
  AutumnWebhookPayload,
  CustomerState,
  ExtendedCustomerState,
  BillingSubscription,
  BillingProduct,
  BillingFeature,
  BillingHookResult,
  FeatureState,
  Features,
  UsageMetadata,
  PendingAction,
  BasePendingAction,
  PortalPendingAction,
  UsagePendingAction,
  CheckoutPendingAction,
} from './autumn';

// Re-export Autumn types as the primary billing types
export type {
  AutumnCustomer,
  AutumnCustomerCreateParams,
  AutumnCustomerUpdateParams,
  AutumnSubscription,
  AutumnSubscriptionStatus,
  AutumnProduct,
  AutumnFeatureState,
  AutumnFeatureInterval,
  AutumnCheckoutParams,
  AutumnCheckoutSession,
  AutumnPortalSession,
  AutumnUsageEvent,
  AutumnUsageEventResponse,
  AutumnError,
  AutumnWebhookPayload,
  CustomerState,
  ExtendedCustomerState,
  BillingSubscription,
  BillingProduct,
  BillingFeature,
  BillingHookResult,
  FeatureState,
  Features,
  UsageMetadata,
  PendingAction,
  BasePendingAction,
  PortalPendingAction,
  UsagePendingAction,
  CheckoutPendingAction,
  BountyProPlan,
  PricingPlan,
} from './autumn';

// Re-export feature ID constants
export { AUTUMN_FEATURE_IDS } from './autumn';

// Re-export pricing utilities
export {
  PRICING_TIERS,
  getPlanFeatures,
  calculateBountyCost,
  getRecommendedPlan,
  formatFeePercent,
} from './autumn';

// ============================================================================
// Legacy Type Aliases (for gradual migration)
// ============================================================================

/**
 * @deprecated Use AutumnCustomer instead
 */
export type PolarCustomer = AutumnCustomer;

/**
 * @deprecated Use AutumnCustomerCreateParams instead
 */
export type PolarCustomerCreateParams = AutumnCustomerCreateParams;

/**
 * @deprecated Use AutumnError instead
 */
export type PolarError = AutumnError;

/**
 * @deprecated Use AutumnWebhookPayload instead
 */
export type PolarWebhookPayload = AutumnWebhookPayload;

// ============================================================================
// Checkout & Usage Params (Convenience Types)
// ============================================================================

/**
 * Checkout parameters for Bounty Pro plans
 */
export interface CheckoutParams {
  slug: 'tier_1_basic' | 'tier_2_pro' | 'tier_3_pro_plus';
}

/**
 * Usage tracking parameters
 */
export interface UsageParams {
  event: string;
  metadata: UsageMetadata;
}
