import { authClient } from '@bounty/auth/client';
import type {
  CustomerState,
  FeatureState,
  Features,
  PendingAction,
  PolarError,
  UsageMetadata,
} from '@bounty/types/billing';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_FEATURES: Features = {
  lowerFees: {
    total: 0,
    remaining: 0,
    unlimited: true,
    enabled: false,
    usage: 0,
    nextResetAt: null,
    interval: '',
    included_usage: 0,
  },
  concurrentBounties: {
    total: 0,
    remaining: 0,
    unlimited: false,
    enabled: false,
    usage: 0,
    nextResetAt: null,
    interval: '',
    included_usage: 0,
  },
};

const FEATURE_IDS = {
  LOWER_FEES: 'lower-fees',
  CONCURRENT_BOUNTIES: 'concurrent-bounties',
} as const;

const PRO_PLANS = ['pro-monthly', 'pro-annual'] as const;

// Helper function to check if error indicates customer not found
const isCustomerNotFoundError = (error: unknown): boolean => {
  const polarError = error as PolarError;
  const errorMessage = String(polarError?.message || polarError?.body$ || '');
  const errorDetail = String(polarError?.detail || '');
  return (
    errorMessage.includes('ResourceNotFound') ||
    errorDetail.includes('Customer does not exist') ||
    polarError?.status === 404
  );
};

// Helper function to check if error is permission denied
const isPermissionDeniedError = (error: unknown): boolean => {
  const polarError = error as PolarError;
  const errorMessage = String(polarError?.message || polarError?.body$ || '');
  return errorMessage.includes('NotPermitted') || polarError?.status === 403;
};

// Helper to check if product/subscription has pro plan
const hasProPlan = (item: {
  id?: string;
  name?: string;
  slug?: string;
}): boolean => {
  return PRO_PLANS.some(
    (plan) =>
      item.id?.includes(plan) ||
      item.name?.includes(plan) ||
      item.slug?.includes(plan)
  );
};

export interface BillingHookResult {
  isLoading: boolean;
  customer: CustomerState | null | undefined;
  refetch: () => Promise<unknown>;
  openBillingPortal: () => Promise<void>;
  trackUsage: (event: string, metadata?: UsageMetadata) => Promise<void>;
  checkout: (slug: 'pro-monthly' | 'pro-annual') => Promise<void>;
  isPro: boolean;
  lowerFees: FeatureState;
  concurrentBounties: FeatureState;
}

/**
 * Client-side billing hook that can accept server-provided initial data
 * This allows for better server/client separation and reduces hydration mismatches
 */
export const useBilling = (options?: {
  enabled?: boolean;
  initialCustomerState?: CustomerState | null;
  ensurePolarCustomer?: () => Promise<void>;
}): BillingHookResult => {
  const [needsCustomerCreation, setNeedsCustomerCreation] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  const ensurePolarCustomerMutation = useMutation({
    mutationFn: async () => {
      if (options?.ensurePolarCustomer) {
        await options.ensurePolarCustomer();
      }
    },
  });

  const {
    data: customer,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['billing'],
    queryFn: async (): Promise<CustomerState | null> => {
      try {
        console.log('authClient.customer.state() called');
        return null;
      } catch (error: unknown) {
        if (isCustomerNotFoundError(error)) {
          setNeedsCustomerCreation(true);
          return null;
        }
        if (isPermissionDeniedError(error)) {
          return null;
        }
        const polarError = error as PolarError;
        if (polarError?.status === 422 || polarError?.status === 409) {
          return null;
        }
        return null;
      }
    },
    // Use initial data from server if provided
    ...(options?.initialCustomerState !== undefined && {
      initialData: options.initialCustomerState as CustomerState | null,
    }),
    enabled: Boolean(options?.enabled),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Handle pending action after customer creation
  const executePendingAction = useCallback(async (action: PendingAction) => {
    if (action.type === 'portal') {
      console.log('authClient.customer.portal() called');
    } else if (action.type === 'usage' && action.params) {
      console.log('authClient.usage.ingest() called', action.params);
    } else if (action.type === 'checkout' && action.params) {
      console.log('authClient.checkout() called', action.params);
    }
  }, []);

  // Handle customer creation when needed
  useEffect(() => {
    if (!needsCustomerCreation || ensurePolarCustomerMutation.isPending) {
      return;
    }

    const createCustomer = async () => {
      try {
        await ensurePolarCustomerMutation.mutateAsync();
        setNeedsCustomerCreation(false);
        await refetch();

        if (pendingAction) {
          const action = pendingAction;
          setPendingAction(null);
          await executePendingAction(action);
        }
      } catch (_e) {
        setNeedsCustomerCreation(false);
        setPendingAction(null);
      }
    };

    createCustomer();
  }, [
    needsCustomerCreation,
    ensurePolarCustomerMutation,
    refetch,
    pendingAction,
    executePendingAction,
  ]);

  // Helper to check if customer has pro status
  const checkProStatus = useCallback(
    (customerState: CustomerState | null | undefined): boolean => {
      if (!customerState) {
        return false;
      }

      const hasProProducts =
        customerState?.products && Array.isArray(customerState.products)
          ? customerState.products.some(hasProPlan)
          : false;

      const hasProSubscriptions =
        customerState?.activeSubscriptions &&
        Array.isArray(customerState.activeSubscriptions)
          ? customerState.activeSubscriptions.some(
              // biome-ignore lint/suspicious/noExplicitAny: SDK type mismatch with custom type
              (sub: any) => sub.product && hasProPlan(sub.product)
            )
          : false;

      const hasProBenefits = Boolean(
        customerState?.grantedBenefits &&
          Array.isArray(customerState.grantedBenefits) &&
          customerState.grantedBenefits.length > 0
      );

      return hasProProducts || hasProSubscriptions || hasProBenefits;
    },
    []
  );

  // Helper to map feature from customer state
  const mapFeature = useCallback(
    (
      feature:
        | {
            included_usage?: number;
            balance?: number;
            unlimited?: boolean;
            usage?: number;
            next_reset_at?: number;
            interval?: string;
          }
        | undefined
    ): FeatureState => {
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

      return {
        total: feature.included_usage || 0,
        remaining: feature.balance || 0,
        unlimited: feature.unlimited ?? false,
        enabled: (feature.unlimited ?? false) || Number(feature.balance) > 0,
        usage: feature.usage || 0,
        nextResetAt: feature.next_reset_at ?? null,
        interval: feature.interval || '',
        included_usage: feature.included_usage || 0,
      };
    },
    []
  );

  const { isPro, ...customerFeatures } = useMemo((): {
    isPro: boolean;
    lowerFees: FeatureState;
    concurrentBounties: FeatureState;
  } => {
    const customerState = customer as CustomerState;

    if (isLoading || !customerState) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }

    const hasProStatus = checkProStatus(customerState);

    if (!customerState?.features) {
      return { isPro: hasProStatus, ...DEFAULT_FEATURES };
    }

    const lowerFees = mapFeature(
      customerState.features[FEATURE_IDS.LOWER_FEES]
    );
    const concurrentBounties = mapFeature(
      customerState.features[FEATURE_IDS.CONCURRENT_BOUNTIES]
    );

    return { isPro: hasProStatus, lowerFees, concurrentBounties };
  }, [customer, isLoading, checkProStatus, mapFeature]);

  const openBillingPortal = useCallback(async () => {
    try {
      console.log('authClient.customer.portal() called');
    } catch (error: unknown) {
      if (isCustomerNotFoundError(error)) {
        setPendingAction({ type: 'portal' });
        setNeedsCustomerCreation(true);
        return;
      }
      if (isPermissionDeniedError(error)) {
        return;
      }
      // Silently ignore other errors
    }
  }, []);

  const trackUsage = useCallback(
    async (event: string, metadata: UsageMetadata = {}) => {
      try {
        console.log('authClient.usage.ingest() called', { event, metadata });
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

  const checkout = useCallback(async (slug: 'pro-monthly' | 'pro-annual') => {
    try {
      console.log('authClient.checkout() called', { slug });
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
    isLoading,
    customer: customer as CustomerState | null | undefined,
    refetch,
    openBillingPortal,
    trackUsage,
    checkout,
    isPro,
    ...customerFeatures,
  };
};
