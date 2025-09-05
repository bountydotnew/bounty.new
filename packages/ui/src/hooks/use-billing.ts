import { authClient } from '@bounty/auth/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BillingHookResult,
  CustomerState,
  FeatureState,
  Features,
  PendingAction,
  PolarError,
  UsageMetadata,
} from '@/types/billing';
import { trpc } from '@/utils/trpc';

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

export const useBilling = (): BillingHookResult => {
  const [needsCustomerCreation, setNeedsCustomerCreation] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  const ensurePolarCustomerMutation = useMutation({
    ...trpc.billing.ensurePolarCustomer.mutationOptions(),
  });

  const {
    data: customer,
    isLoading,
    // error,
    refetch,
  } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      try {
        const { data: customerState } = await authClient.customer.state();
        return customerState;
      } catch (error: unknown) {
        const polarError = error as PolarError;
        const errorMessage = String(
          polarError?.message || polarError?.body$ || ''
        );
        const errorDetail = String(polarError?.detail || '');
        const notFound =
          errorMessage.includes('ResourceNotFound') ||
          errorDetail.includes('Customer does not exist') ||
          polarError?.status === 404;
        if (notFound) {
          // Instead of calling mutation here, set flag to trigger customer creation
          setNeedsCustomerCreation(true);
          return null;
        }
        if (
          errorMessage.includes('NotPermitted') ||
          polarError?.status === 403
        ) {
          return null;
        }
        if (polarError?.status === 422) {
          return null;
        }
        if (polarError?.status === 409) {
          return null;
        }
        return null;
      }
    },
  });

  // Handle customer creation when needed
  useEffect(() => {
    if (needsCustomerCreation && !ensurePolarCustomerMutation.isPending) {
      const createCustomer = async () => {
        try {
          await ensurePolarCustomerMutation.mutateAsync();
          setNeedsCustomerCreation(false);
          // Refetch the customer data after creation
          await refetch();

          // If there was a pending action, execute it now
          if (pendingAction) {
            const action = pendingAction;
            setPendingAction(null);

            if (action.type === 'portal') {
              await authClient.customer.portal();
            } else if (action.type === 'usage' && action.params) {
              await authClient.usage.ingest(action.params);
            } else if (action.type === 'checkout' && action.params) {
              await authClient.checkout(action.params);
            }
          }
        } catch (_e) {
          setNeedsCustomerCreation(false);
          setPendingAction(null);
        }
      };

      createCustomer();
    }
  }, [
    needsCustomerCreation,
    ensurePolarCustomerMutation,
    refetch,
    pendingAction,
  ]);

  const { isPro, ...customerFeatures } = useMemo(() => {
    const customerState = customer as CustomerState;

    // If still loading, don't show Pro status yet
    if (isLoading) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }

    // If no customer state (new user or error), they're not Pro
    if (!customerState) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }

    // Check if they have any Pro products, subscriptions, or granted benefits
    const hasProProducts =
      customerState?.products && Array.isArray(customerState.products)
        ? customerState.products.some((product) =>
            PRO_PLANS.some(
              (plan) =>
                product.id?.includes(plan) ||
                product.name?.includes(plan) ||
                product.slug?.includes(plan)
            )
          )
        : false;

    const hasProSubscriptions =
      customerState?.activeSubscriptions &&
      Array.isArray(customerState.activeSubscriptions)
        ? customerState.activeSubscriptions.some((subscription) =>
            PRO_PLANS.some(
              (plan) =>
                subscription.product?.id?.includes(plan) ||
                subscription.product?.name?.includes(plan) ||
                subscription.product?.slug?.includes(plan)
            )
          )
        : false;

    const hasProBenefits =
      customerState?.grantedBenefits &&
      Array.isArray(customerState.grantedBenefits)
        ? customerState.grantedBenefits.some(() => {
            // If they have any granted benefits, consider them Pro
            return true;
          })
        : false;

    const isPro = hasProProducts || hasProSubscriptions || hasProBenefits;

    if (!customerState?.features) {
      return { isPro, ...DEFAULT_FEATURES };
    }

    const features = { ...DEFAULT_FEATURES };

    if (customerState.features[FEATURE_IDS.LOWER_FEES]) {
      const feature = customerState.features[FEATURE_IDS.LOWER_FEES];
      features.lowerFees = {
        total: feature.included_usage || 0,
        remaining: feature.balance || 0,
        unlimited: feature.unlimited ?? false,
        enabled: (feature.unlimited ?? false) || Number(feature.balance) > 0,
        usage: feature.usage || 0,
        nextResetAt: feature.next_reset_at ?? null,
        interval: feature.interval || '',
        included_usage: feature.included_usage || 0,
      };
    }

    if (customerState.features[FEATURE_IDS.CONCURRENT_BOUNTIES]) {
      const feature = customerState.features[FEATURE_IDS.CONCURRENT_BOUNTIES];
      features.concurrentBounties = {
        total: feature.included_usage || 0,
        remaining: feature.balance || 0,
        unlimited: feature.unlimited ?? false,
        enabled: (feature.unlimited ?? false) || Number(feature.balance) > 0,
        usage: feature.usage || 0,
        nextResetAt: feature.next_reset_at ?? null,
        interval: feature.interval || '',
        included_usage: feature.included_usage || 0,
      };
    }

    return { isPro, ...features };
  }, [customer, isLoading]);

  const openBillingPortal = useCallback(async () => {
    try {
      try {
        await authClient.customer.portal();
      } catch (error: unknown) {
        const polarError = error as PolarError;
        const errorMessage = String(
          polarError?.message || polarError?.body$ || ''
        );
        const errorDetail = String(polarError.detail || '');
        const notFound =
          errorMessage.includes('ResourceNotFound') ||
          errorDetail.includes('Customer does not exist') ||
          polarError?.status === 404;
        if (notFound) {
          // Set pending action and trigger customer creation
          setPendingAction({ type: 'portal' });
          setNeedsCustomerCreation(true);
          return;
        }
        throw error;
      }
    } catch (error: unknown) {
      const polarError = error as PolarError;
      const errorMessage = String(
        polarError?.message || polarError?.body$ || ''
      );
      // const errorDetail = String(polarError.detail || "");
      if (errorMessage.includes('NotPermitted') || polarError?.status === 403) {
        return;
      }
    }
  }, []);

  const trackUsage = useCallback(
    async (event: string, metadata: UsageMetadata = {}) => {
      try {
        try {
          await authClient.usage.ingest({ event, metadata });
        } catch (error: unknown) {
          const polarError = error as PolarError;
          const errorMessage = String(
            polarError?.message || polarError?.body$ || ''
          );
          const errorDetail = String(polarError.detail || '');
          const notFound =
            errorMessage.includes('ResourceNotFound') ||
            errorDetail.includes('Customer does not exist') ||
            polarError?.status === 404;
          if (notFound) {
            // Set pending action and trigger customer creation
            setPendingAction({ type: 'usage', params: { event, metadata } });
            setNeedsCustomerCreation(true);
            return;
          }
          throw error;
        }
      } catch (_error) {}
    },
    []
  );

  const checkout = useCallback(async (slug: 'pro-monthly' | 'pro-annual') => {
    try {
      await authClient.checkout({ slug });
    } catch (error: unknown) {
      const polarError = error as PolarError;
      const errorMessage = String(
        polarError?.message || polarError?.body$ || ''
      );
      const errorDetail = String(polarError.detail || '');
      const notFound =
        errorMessage.includes('ResourceNotFound') ||
        errorDetail.includes('Customer does not exist') ||
        polarError?.status === 404;
      if (notFound) {
        // Set pending action and trigger customer creation
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

export { DEFAULT_FEATURES, FEATURE_IDS, PRO_PLANS };
export type { Features, FeatureState };
