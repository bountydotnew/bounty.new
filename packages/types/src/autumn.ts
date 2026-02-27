/**
 * Autumn Billing Types
 *
 * Type definitions for Autumn billing integration.
 * Autumn: https://docs.useautumn.com
 *
 * ## Customer Model
 *
 * Autumn customers represent entities that can subscribe to products
 * and have their usage tracked and billed.
 *
 * ## Feature Model
 *
 * Autumn tracks feature usage with configurable limits and reset intervals.
 * Features can be metered (count-based) or graded (tier-based).
 */

// ============================================================================
// Customer Types
// ============================================================================

/**
 * Autumn customer representation
 */
export interface AutumnCustomer {
  id: string;
  external_id: string;
  email: string;
  name?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  env?: string; // Environment: 'dev' or 'prod'
}

/**
 * Parameters for creating an Autumn customer
 */
export interface AutumnCustomerCreateParams {
  external_id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for updating an Autumn customer
 */
export interface AutumnCustomerUpdateParams {
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * Autumn subscription status
 */
export type AutumnSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

/**
 * Autumn subscription representation
 */
export interface AutumnSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: AutumnSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Product associated with a subscription
 */
export interface AutumnProduct {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  env?: string; // Environment: 'dev' or 'prod'
}

// ============================================================================
// Feature Types
// ============================================================================

/**
 * Feature reset interval
 */
export type AutumnFeatureInterval =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'forever';

/**
 * Feature usage state
 */
export interface AutumnFeatureState {
  feature_id: string;
  limit: number | null; // null = unlimited
  usage: number;
  reset_at: string | null; // ISO timestamp
  interval: AutumnFeatureInterval;
  will_reset: boolean;
}

/**
 * Feature state for customer-facing display
 */
export interface FeatureState {
  total: number; // Total limit (0 if unlimited)
  remaining: number; // Remaining usage (Infinity if unlimited)
  unlimited: boolean; // Whether feature is unlimited
  enabled: boolean; // Whether feature is accessible
  usage: number; // Current usage count
  nextResetAt: number | null; // Unix timestamp of next reset
  interval: string; // Reset interval
  included_usage: number; // Included usage per period
}

/**
 * Feature keys used in the Bounty platform
 */
export const AUTUMN_FEATURE_IDS = {
  CONCURRENT_BOUNTIES: 'concurrent_bounties',
} as const;

/**
 * All features exposed to the application
 */
export interface Features {
  concurrentBounties: FeatureState;
}

// ============================================================================
// Customer State (Aggregated View)
// ============================================================================

/**
 * Complete customer state including subscriptions, features, and products
 * This is the primary type returned by Autumn's customer state endpoint
 */
export interface CustomerState {
  customer: AutumnCustomer | null;
  subscriptions: Array<
    AutumnSubscription & {
      product?: AutumnProduct | null;
    }
  >;
  features: Record<string, AutumnFeatureState>;
  products: AutumnProduct[];
  /** Flag indicating customer exists via email lookup but external_id doesn't match user.id */
  _unlinked?: boolean;
}

// ============================================================================
// Billing Types (Application Layer)
// ============================================================================

/**
 * Billing product with optional metadata
 */
export interface BillingProduct {
  id?: string;
  name?: string;
  slug?: string;
}

/**
 * Billing subscription with product details
 */
export interface BillingSubscription {
  id: string;
  customerId: string;
  productId?: string;
  status: AutumnSubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  product?: BillingProduct;
}

/**
 * Billing feature state for application use
 */
export interface BillingFeature {
  included_usage?: number;
  balance?: number;
  unlimited?: boolean;
  usage?: number;
  next_reset_at?: number;
  interval?: string;
}

/**
 * Extended customer state for application use
 */
export interface ExtendedCustomerState {
  customer: AutumnCustomer | null;
  products?: BillingProduct[];
  activeSubscriptions?: BillingSubscription[];
  features?: Record<string, BillingFeature>;
  grantedBenefits?: unknown[];
}

// ============================================================================
// Checkout Types
// ============================================================================

/**
 * Checkout session configuration
 */
export interface AutumnCheckoutParams {
  product_id: string;
  customer_id?: string;
  success_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Checkout preview data (returned when payment method is on file)
 */
export interface AutumnCheckoutPreview {
  total: number;
  currency: string;
  product: {
    id: string;
    name: string;
  };
  // Additional preview fields may be present
  [key: string]: unknown;
}

/**
 * Checkout session response
 * Can return either a URL (first-time payment) or preview data (payment on file)
 * When url is null, the entire response is preview data (upgrade scenario)
 */
export interface AutumnCheckoutSession {
  // URL returned when payment details needed (first-time)
  checkout_url?: string;
  url?: string; // alias used in some responses - when null, entire response is preview data

  // Customer information
  customer_id?: string;

  // Current product (when already attached or in preview)
  current_product?: {
    id: string;
    name: string;
    description?: string | null;
    slug?: string | null;
    env?: string;
  };

  // Preview returned when payment method on file
  preview?: AutumnCheckoutPreview;

  // Additional fields that may be present
  has_prorations?: boolean;
  id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Pricing tier slugs for Bounty platform
 */
export type BountyProPlan =
  | 'free'
  | 'tier_1_basic'
  | 'tier_2_pro'
  | 'tier_3_pro_plus';

/**
 * Pricing plan configuration
 */
export interface PricingPlan {
  slug: BountyProPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // Yearly price (10 months = 2 months free)
  feeFreeAllowance: number; // Monthly fee-free allowance in dollars
  platformFeePercent: number; // Platform fee percentage over allowance
  concurrentBounties: number; // Number of concurrent bounties (null = unlimited)
  popular?: boolean; // Whether to highlight as popular
  badge?: string; // Badge to display
}

/**
 * Pricing tier configurations
 */
export const PRICING_TIERS: Record<BountyProPlan, PricingPlan> = {
  free: {
    slug: 'free',
    name: 'Free',
    description: 'For individuals getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    feeFreeAllowance: 0,
    platformFeePercent: 5,
    concurrentBounties: 1,
  },
  tier_1_basic: {
    slug: 'tier_1_basic',
    name: 'Basic',
    description: 'For developers and small teams',
    monthlyPrice: 10,
    yearlyPrice: 100, // $10/mo * 10 months
    feeFreeAllowance: 500,
    platformFeePercent: 4,
    concurrentBounties: -1, // unlimited
  },
  tier_2_pro: {
    slug: 'tier_2_pro',
    name: 'Pro',
    description: 'For growing teams',
    monthlyPrice: 25,
    yearlyPrice: 250, // $25/mo * 10 months
    feeFreeAllowance: 5000,
    platformFeePercent: 3,
    concurrentBounties: -1, // unlimited
    popular: true,
    badge: 'Most Popular',
  },
  tier_3_pro_plus: {
    slug: 'tier_3_pro_plus',
    name: 'Pro+',
    description: 'For scaling organizations',
    monthlyPrice: 150,
    yearlyPrice: 1500, // $150/mo * 10 months
    feeFreeAllowance: 12_000,
    platformFeePercent: 2,
    concurrentBounties: -1, // unlimited
  },
} as const;

/**
 * Generate feature list for a pricing plan dynamically from config
 * @param plan - The plan to get features for
 * @param options.minimal - If true, only show core fee-related features (for settings page)
 */
export function getPlanFeatures(
  plan: BountyProPlan,
  options?: { minimal?: boolean }
): string[] {
  const tier = PRICING_TIERS[plan];
  const features: string[] = [];
  const minimal = options?.minimal ?? false;

  // Concurrent bounties
  if (tier.concurrentBounties === -1) {
    features.push('Unlimited concurrent bounties');
  } else {
    features.push(
      `${tier.concurrentBounties} concurrent bounty${tier.concurrentBounties !== 1 ? 's' : ''}`
    );
  }

  // Fee structure
  if (tier.feeFreeAllowance > 0) {
    features.push(
      `$${tier.feeFreeAllowance.toLocaleString()}/mo platform fee-free`
    );
    features.push(`${tier.platformFeePercent}% platform fee after`);
  } else {
    features.push(`${tier.platformFeePercent}% platform fee`);
  }

  // Skip extra features for minimal mode
  if (minimal) {
    return features;
  }

  // Plan-specific features
  features.push('Full platform access');

  // if (plan === 'free') {
  //   features.push('Standard support');
  // } else {
  //   features.push('Priority support');
  // }

  // if (plan === 'tier_2_pro' || plan === 'tier_3_pro_plus') {
  //   features.push('Advanced analytics');
  // }

  // if (plan === 'tier_3_pro_plus') {
  //   features.push('Custom integrations');
  // }

  return features;
}

/**
 * Calculate total cost for a given bounty amount under a pricing plan
 * @returns { monthlyFee: number, platformFee: number, total: number }
 */
export const calculateBountyCost = (
  plan: PricingPlan,
  monthlyBountySpend: number
): { monthlyFee: number; platformFee: number; total: number } => {
  const { monthlyPrice, feeFreeAllowance, platformFeePercent } = plan;

  let platformFee = 0;
  if (monthlyBountySpend > feeFreeAllowance) {
    const overAllowance = monthlyBountySpend - feeFreeAllowance;
    platformFee = (overAllowance * platformFeePercent) / 100;
  }

  return {
    monthlyFee: monthlyPrice,
    platformFee,
    total: monthlyPrice + platformFee,
  };
};

/**
 * Get recommended pricing plan based on monthly bounty spend
 *
 * Logic: Recommend the plan where the user benefits most from the fee-free allowance
 * - Free: $0-$200 (5% fee is acceptable for small amounts)
 * - Basic ($10/mo): $201-$500 (0% fee, $500 allowance covers it)
 * - Pro ($25/mo): $501-$5,000 (2% over, but $5k allowance)
 * - Pro+ ($150/mo): $5,001+ (4% over, but $12k allowance)
 */
export const getRecommendedPlan = (
  monthlyBountySpend: number
): BountyProPlan => {
  if (monthlyBountySpend <= 200) {
    return 'free';
  }
  if (monthlyBountySpend <= 500) {
    return 'tier_1_basic';
  }
  if (monthlyBountySpend <= 5000) {
    return 'tier_2_pro';
  }
  return 'tier_3_pro_plus';
};

/**
 * Format fee percentage for display
 */
export const formatFeePercent = (percent: number): string => {
  if (percent === 0) {
    return '0%';
  }
  return `${percent}%`;
};

// ============================================================================
// Portal Types
// ============================================================================

/**
 * Customer portal session
 */
export interface AutumnPortalSession {
  portal_url: string;
  customer_id: string;
}

// ============================================================================
// Usage/Event Types
// ============================================================================

/**
 * Usage event to track
 */
export interface AutumnUsageEvent {
  event_name: string;
  customer_id: string;
  metadata?: Record<string, string | number | boolean>;
  idempotency_key?: string;
}

/**
 * Usage event response
 */
export interface AutumnUsageEventResponse {
  id: string;
  event_name: string;
  customer_id: string;
  processed: boolean;
}

// ============================================================================
// Check & Track Types
// ============================================================================

/**
 * Check feature access request
 */
export interface AutumnCheckParams {
  customerId: string;
  featureId: string;
  requiredBalance?: number;
  sendEvent?: boolean;
}

/**
 * Check feature access response
 */
export interface AutumnCheckResponse {
  allowed: boolean;
  feature_id: string;
  customer_id: string;
  required_balance: number;
  unlimited: boolean;
  interval: string | null;
  balance: number;
  usage: number;
  included_usage: number;
  next_reset_at: number | null;
  overage_allowed: boolean;
}

/**
 * Track usage request
 */
export interface AutumnTrackParams {
  customerId: string;
  featureId: string;
  value: number;
  idempotencyKey?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Track usage response
 */
export interface AutumnTrackResponse {
  customer_id: string;
  feature_id: string;
  value: number;
  balance: number;
  usage: number;
  included_usage: number;
  unlimited: boolean;
  interval: string | null;
  next_reset_at: number | null;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Autumn API error response
 */
export interface AutumnError extends Error {
  status?: number;
  code?: string;
  detail?: string;
  body?: unknown;
}

/**
 * Webhook payload from Autumn
 */
export interface AutumnWebhookPayload {
  id: string;
  event_type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Import ExpandedCustomer from autumn-js SDK for type compatibility
 * We use any here to avoid importing from the SDK directly in the types package
 * The actual implementation will type this correctly from autumn-js
 */
export type SDKExpandedCustomer = any;

/**
 * Return type for useBilling hook
 * Uses SDK's ExpandedCustomer type instead of wrapper CustomerState
 */
export interface BillingHookResult {
  isLoading: boolean;
  customer: SDKExpandedCustomer | null;
  refetch: () => Promise<SDKExpandedCustomer | null>;
  openBillingPortal: () => Promise<void>;
  trackUsage: (event: string, metadata?: UsageMetadata) => Promise<void>;
  checkout: (slug: Exclude<BountyProPlan, 'free'>) => Promise<void>;
  isPro: boolean;
  concurrentBounties: FeatureState;
}

/**
 * Usage metadata format
 */
export interface UsageMetadata {
  [key: string]: string | number | boolean;
}

/**
 * Pending action for customer creation flows
 */
export interface BasePendingAction {
  type: 'portal' | 'usage' | 'checkout';
}

export interface PortalPendingAction extends BasePendingAction {
  type: 'portal';
  params?: undefined;
}

export interface UsagePendingAction extends BasePendingAction {
  type: 'usage';
  params: {
    event: string;
    metadata: UsageMetadata;
  };
}

export interface CheckoutPendingAction extends BasePendingAction {
  type: 'checkout';
  params: {
    slug: Exclude<BountyProPlan, 'free'>;
  };
}

export type PendingAction =
  | PortalPendingAction
  | UsagePendingAction
  | CheckoutPendingAction;
