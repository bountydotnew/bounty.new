/**
 * useBilling Hook
 *
 * Client-side billing hook using Autumn billing via tRPC.
 * This hook provides the billing functionality for the web app.
 */

import { trpc, trpcClient } from '@/utils/trpc';
import type {
  BillingHookResult,
  CustomerState,
  FeatureState,
  PendingAction,
  UsageMetadata,
  AutumnError,
  BountyProPlan,
} from '@bounty/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Feature IDs matching Autumn configuration
const AUTUMN_FEATURE_IDS = {
  CONCURRENT_BOUNTIES: 'concurrent_bounties',
} as const;

// Default features for non-paying users
const DEFAULT_FEATURES = {
  concurrentBounties: {
    total: 1,
    remaining: 1,
    unlimited: false,
    enabled: true,
    usage: 0,
    nextResetAt: null,
    interval: '',
    included_usage: 1,
  },
} as const;

// ============================================================================
// Error Helpers
// ============================================================================

const isCustomerNotFoundError = (error: unknown): boolean => {
  const autumnError = error as AutumnError;
  const errorMessage = String(autumnError?.message ?? '').toLowerCase();
  return (
    autumnError?.status === 404 ||
    errorMessage.includes('not found') ||
    errorMessage.includes('customer does not exist')
  );
};

// ============================================================================
// Feature Helpers
// ============================================================================

/**
 * Map Autumn feature state to application FeatureState
 */
const mapFeature = (feature?: {
  feature_id: string;
  limit: number | null;
  usage: number;
  reset_at: string | null;
  interval: string;
  will_reset: boolean;
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

  const limit = feature.limit ?? 0;
  const isUnlimited = feature.limit === null;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - feature.usage);

  return {
    total: limit,
    remaining,
    unlimited: isUnlimited,
    enabled: isUnlimited || remaining > 0,
    usage: feature.usage,
    nextResetAt: feature.reset_at ? new Date(feature.reset_at).getTime() : null,
    interval: feature.interval,
    included_usage: limit,
  };
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Client-side billing hook that integrates with Autumn via tRPC
 *
 * @example
 * ```tsx
 * function BillingPage() {
 *   const { isPro, concurrentBounties, checkout, isLoading } = useBilling();
 *
 *   return (
 *     <div>
 *       <p>Concurrent Bounties: {concurrentBounties.remaining}</p>
 *       <button onClick={() => checkout('pro-monthly')}>
 *         Upgrade to Pro
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useBilling = (): BillingHookResult => {
  const [needsCustomerCreation, setNeedsCustomerCreation] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // tRPC query for customer state
  const customerStateQuery = useQuery({
    ...trpc.billing.getCustomerState.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 300_000, // 5 minutes
  });

  // tRPC mutation for customer creation
  const ensureCustomerMutation = useMutation(
    trpc.billing.ensureCustomer.mutationOptions()
  );

  // Handle pending action after customer creation
  const executePendingAction = useCallback(async (action: PendingAction) => {
    if (action.type === 'portal') {
      const result = await trpcClient.billing.createPortal.mutate(undefined);
      if (result?.portalUrl) {
        window.location.href = result.portalUrl;
      }
    } else if (action.type === 'usage' && action.params) {
      await trpcClient.billing.trackUsage.mutate({
        event: action.params.event,
        metadata: action.params.metadata,
      });
    } else if (action.type === 'checkout' && action.params) {
      const result = await trpcClient.billing.createCheckout.mutate({ slug: action.params.slug });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    }
  }, []);

  // Handle customer creation when needed
  useEffect(() => {
    if (!needsCustomerCreation || ensureCustomerMutation.isPending) {
      return;
    }

    const createCustomer = async () => {
      try {
        await ensureCustomerMutation.mutateAsync(undefined);
        setNeedsCustomerCreation(false);
        await customerStateQuery.refetch();

        if (pendingAction) {
          const action = pendingAction;
          setPendingAction(null);
          await executePendingAction(action);
        }
      } catch {
        setNeedsCustomerCreation(false);
        setPendingAction(null);
      }
    };

    createCustomer();
  }, [
    needsCustomerCreation,
    ensureCustomerMutation,
    customerStateQuery,
    pendingAction,
    executePendingAction,
  ]);

  // Helper to check if customer has pro status
  const checkProStatus = useCallback(
    (customerState: CustomerState | null | undefined): boolean => {
      if (!customerState) {
        return false;
      }

      // Check if user has any paid subscription (not the free tier)
      const subscriptions = customerState.subscriptions ?? [];
      const hasPaidSubscription = subscriptions.some(
        (sub) => sub.product_id && sub.product_id !== 'free'
      );

      return Boolean(hasPaidSubscription);
    },
    []
  );

  // Compute feature states and pro status
  const { isPro, ...customerFeatures } = useMemo((): {
    isPro: boolean;
    concurrentBounties: FeatureState;
  } => {
    if (customerStateQuery.isLoading || !customerStateQuery.data) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }

    const hasProStatus = checkProStatus(customerStateQuery.data);

    if (!customerStateQuery.data.features) {
      return { isPro: hasProStatus, ...DEFAULT_FEATURES };
    }

    const concurrentBounties = mapFeature(
      customerStateQuery.data.features[AUTUMN_FEATURE_IDS.CONCURRENT_BOUNTIES]
    );

    return { isPro: hasProStatus, concurrentBounties };
  }, [customerStateQuery.data, customerStateQuery.isLoading, checkProStatus]);

  // Open billing portal
  const openBillingPortal = useCallback(async () => {
    try {
      const result = await trpcClient.billing.createPortal.mutate(undefined);
      if (result?.portalUrl) {
        window.location.href = result.portalUrl;
      }
    } catch (error: unknown) {
      if (isCustomerNotFoundError(error)) {
        setPendingAction({ type: 'portal' });
        setNeedsCustomerCreation(true);
        return;
      }
      // Silently ignore other errors
    }
  }, []);

  // Track usage event
  const trackUsageEvent = useCallback(
    async (event: string, metadata: UsageMetadata = {}) => {
      try {
        await trpcClient.billing.trackUsage.mutate({ event, metadata });
      } catch (error: unknown) {
        if (isCustomerNotFoundError(error)) {
          setPendingAction({ type: 'usage', params: { event, metadata } });
          setNeedsCustomerCreation(true);
          return;
        }
        // Silently ignore other errors
      }
    },
    []
  );

  // Start checkout - accepts Autumn product IDs (all except free)
  const checkout = useCallback(async (slug: Exclude<BountyProPlan, 'free'>) => {
    try {
      const result = await trpcClient.billing.createCheckout.mutate({ slug });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: unknown) {
      if (isCustomerNotFoundError(error)) {
        setPendingAction({ type: 'checkout', params: { slug } });
        setNeedsCustomerCreation(true);
        return;
      }
      throw error;
    }
  }, []);

  return {
    isLoading: customerStateQuery.isLoading,
    customer: customerStateQuery.data as CustomerState | null | undefined,
    refetch: customerStateQuery.refetch,
    openBillingPortal,
    trackUsage: trackUsageEvent,
    checkout,
    isPro,
    ...customerFeatures,
  };
};
