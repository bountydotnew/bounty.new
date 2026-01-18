/**
 * Re-export billing types from @bounty/types
 *
 * This file maintains backward compatibility for existing imports
 * while using the centralized Autumn-based types.
 */

export type {
  AutumnCustomer,
  AutumnCustomerCreateParams,
  AutumnCustomerUpdateParams,
  AutumnSubscription,
  AutumnSubscriptionStatus,
  AutumnProduct,
  AutumnFeatureState,
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
} from '@bounty/types/billing';

export type { BountyProPlan } from '@bounty/types/billing';

// Re-export feature IDs constant
export { AUTUMN_FEATURE_IDS } from '@bounty/types/billing';

// Legacy type aliases for backward compatibility
export type {
  CheckoutParams,
  UsageParams,
} from '@bounty/types/billing';
