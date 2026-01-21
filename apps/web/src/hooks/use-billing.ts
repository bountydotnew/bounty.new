/**
 * useBilling Hook
 *
 * Client-side billing hook using autumn-js SDK.
 * This hook provides the billing functionality for the web app.
 */

import { useCustomer } from 'autumn-js/react';
import type {
  BillingHookResult,
  FeatureState,
  UsageMetadata,
  BountyProPlan,
} from '@bounty/types';
import { useCallback, useMemo } from 'react';

// Feature IDs matching Autumn configuration
const AUTUMN_FEATURE_IDS = {
  CONCURRENT_BOUNTIES: 'concurrent_bounties',
} as const;

// Default features for non-paying users
const DEFAULT_FEATURES: FeatureState = {
  total: 1,
  remaining: 1,
  unlimited: false,
  enabled: true,
  usage: 0,
  nextResetAt: null,
  interval: '',
  included_usage: 1,
};

// ============================================================================
// Feature Helpers
// ============================================================================

/**
 * Map Autumn SDK feature state to application FeatureState
 */
const mapFeature = (feature?: {
  enabled?: boolean;
  balance?: number | null;
  usage?: number;
  included_usage?: number;
  unlimited?: boolean;
  next_reset_at?: number | null;
  interval?: string | null;
}): FeatureState => {
  if (!feature) {
    return {
      total: 0,
      remaining: 0,
      unlimited: false,
      enabled: false,
      usage: 0,
      nextResetAt: null,
      interval: '',
      included_usage: 0,
    };
  }

  const isUnlimited = feature.unlimited ?? false;
  const includedUsage = feature.included_usage ?? 0;
  const usage = feature.usage ?? 0;
  const remaining = isUnlimited
    ? Number.POSITIVE_INFINITY
    : Math.max(0, includedUsage - usage);

  return {
    total: includedUsage,
    remaining,
    unlimited: isUnlimited,
    enabled: feature.enabled ?? false,
    usage,
    nextResetAt: feature.next_reset_at ? feature.next_reset_at * 1000 : null,
    interval: feature.interval ?? '',
    included_usage: includedUsage,
  };
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Client-side billing hook that integrates with Autumn via autumn-js SDK
 *
 * @example
 * ```tsx
 * function BillingPage() {
 *   const { isPro, concurrentBounties, checkout, isLoading } = useBilling();
 *
 *   return (
 *     <div>
 *       <p>Concurrent Bounties: {concurrentBounties.remaining}</p>
 *       <button onClick={() => checkout('tier_2_pro')}>
 *         Upgrade to Pro
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useBilling = (): BillingHookResult => {
  const { customer, isLoading, refetch, attach, openBillingPortal, track } =
    useCustomer();

  // Helper to check if customer has pro status
  const checkProStatus = useCallback((): boolean => {
    if (!customer) {
      return false;
    }

    // Check if user has any active paid subscription (not free tier)
    const products = customer.products ?? [];
    const hasPaidSubscription = products.some(
      (p) =>
        (p.status === 'active' || p.status === 'trialing') && p.id !== 'free'
    );

    // Debug logging - remove after fixing
    if (process.env.NODE_ENV === 'development') {
      console.log('[useBilling] checkProStatus:', {
        products: products.map((p) => ({ id: p.id, status: p.status })),
        hasPaidSubscription,
      });
    }

    return Boolean(hasPaidSubscription);
  }, [customer]);

  // Compute feature states and pro status
  const billingState = useMemo(() => {
    const isPro = checkProStatus();
    const concurrentBounties = customer?.features?.[
      AUTUMN_FEATURE_IDS.CONCURRENT_BOUNTIES
    ]
      ? mapFeature(customer.features[AUTUMN_FEATURE_IDS.CONCURRENT_BOUNTIES])
      : DEFAULT_FEATURES;

    return { isPro, concurrentBounties };
  }, [customer, checkProStatus]);

  // Track usage event
  // Note: SDK's track() uses 'entityData' not 'metadata'
  const trackUsage = useCallback(
    async (event: string, metadata: UsageMetadata = {}) => {
      const result = await track({
        eventName: event,
        value: 1,
        entityData: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      if (result.error) {
        console.error('Failed to track usage:', result.error);
        // Silently ignore tracking errors
      }
    },
    [track]
  );

  // Start checkout - accepts Autumn product IDs (all except free)
  const checkout = useCallback(
    async (slug: Exclude<BountyProPlan, 'free'>) => {
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new');

      const result = await attach({
        productId: slug,
        successUrl: `${baseUrl}/settings/billing?checkout=success`,
        checkoutSessionParams: {
          cancel_url: `${baseUrl}/pricing`,
        },
        forceCheckout: true,
      });

      if (result.error) {
        throw new Error(result.error.message ?? 'Checkout failed');
      }

      const data = result.data;
      if (data && 'checkout_url' in data && data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    [attach]
  );

  // Wrap openBillingPortal to return Promise<void> for backward compatibility
  const handleOpenBillingPortal = useCallback(async () => {
    const result = await openBillingPortal();
    if (result.error) {
      throw new Error(result.error.message ?? 'Failed to open billing portal');
    }
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  }, [openBillingPortal]);

  return {
    isLoading,
    customer,
    refetch,
    openBillingPortal: handleOpenBillingPortal,
    trackUsage,
    checkout,
    ...billingState,
  };
};
