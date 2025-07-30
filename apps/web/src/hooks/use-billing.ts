import { authClient } from "@bounty/auth/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

type PolarError = Error & {
  body$?: string;
  detail?: string;
  status?: number;
};

type FeatureState = {
  total: number;
  remaining: number;
  unlimited: boolean;
  enabled: boolean;
  usage: number;
  nextResetAt: number | null;
  interval: string;
  included_usage: number;
};

type Features = {
  lowerFees: FeatureState;
  concurrentBounties: FeatureState;
};

const DEFAULT_FEATURES: Features = {
  lowerFees: {
    total: 0,
    remaining: 0,
    unlimited: true,
    enabled: false,
    usage: 0,
    nextResetAt: null,
    interval: "",
    included_usage: 0,
  },
  concurrentBounties: {
    total: 0,
    remaining: 0,
    unlimited: false,
    enabled: false,
    usage: 0,
    nextResetAt: null,
    interval: "",
    included_usage: 0,
  },
};

const FEATURE_IDS = {
  LOWER_FEES: "lower-fees",
  CONCURRENT_BOUNTIES: "concurrent-bounties",
} as const;

const PRO_PLANS = ["pro-monthly", "pro-annual"] as const;

export const useBilling = () => {
  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ["billing"],
    queryFn: async () => {
      try {
        const { data: customerState } = await authClient.customer.state();
        console.log("Customer state:", customerState); // Debug log
        return customerState;
      } catch (error: any) {
        // Handle Polar's specific error types
        const polarError = error as PolarError;
        const errorMessage = String(polarError?.message || polarError?.body$ || "");
        const errorDetail = String(polarError?.detail || "");
        
        // 404 - Customer doesn't exist (expected for new users)
        if (errorMessage.includes("ResourceNotFound") || 
            errorDetail.includes("Customer does not exist") ||
            polarError?.status === 404) {
          console.warn("Customer not found in Polar (expected for new users):", error);
          return null;
        }
        
        // 403 - Permission denied (auth issues)
        if (errorMessage.includes("NotPermitted") || polarError?.status === 403) {
          console.error("Polar permission denied:", error);
          return null;
        }
        
        // 422 - Validation errors
        if (polarError?.status === 422) {
          console.error("Polar validation error:", error);
          return null;
        }
        
        // 409 - Resource conflicts
        if (polarError?.status === 409) {
          console.error("Polar resource conflict:", error);
          return null;
        }
        
        console.warn("Unexpected Polar error:", error);
        return null;
      }
    },
  });

  useEffect(() => {
    if (error) {
      const polarError = error as PolarError;
      const errorMessage = String(polarError?.message || polarError?.body$ || "");
      const errorDetail = String(polarError?.detail || "");
      
      // Only sign out for auth/permission errors, not missing customers
      if (errorMessage.includes("NotPermitted") || 
          polarError?.status === 403 ||
          polarError?.status === 401) {
        console.error("Polar authentication error:", error);
        authClient.signOut();
      } else {
        console.error("Polar error (non-auth):", error);
      }
    }
  }, [error]);

  const { isPro, ...customerFeatures } = useMemo(() => {
    const customerState = customer as any;
    
    // If still loading, don't show Pro status yet
    if (isLoading) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }
    
    // If no customer state (new user or error), they're not Pro
    if (!customerState) {
      return { isPro: false, ...DEFAULT_FEATURES };
    }
    
    // Check if they have any Pro products, subscriptions, or granted benefits
    const hasProProducts = customerState?.products && Array.isArray(customerState.products)
      ? customerState.products.some((product: any) =>
          PRO_PLANS.some((plan) => 
            product.id?.includes(plan) || 
            product.name?.includes(plan) ||
            product.slug?.includes(plan)
          )
        )
      : false;
      
    const hasProSubscriptions = customerState?.activeSubscriptions && Array.isArray(customerState.activeSubscriptions)
      ? customerState.activeSubscriptions.some((subscription: any) =>
          PRO_PLANS.some((plan) => 
            subscription.product?.id?.includes(plan) || 
            subscription.product?.name?.includes(plan) ||
            subscription.product?.slug?.includes(plan)
          )
        )
      : false;
      
    const hasProBenefits = customerState?.grantedBenefits && Array.isArray(customerState.grantedBenefits)
      ? customerState.grantedBenefits.some((benefit: any) => {
          // If they have any granted benefits, consider them Pro
          return true;
        })
      : false;
      
    const isPro = hasProProducts || hasProSubscriptions || hasProBenefits;

    if (!customerState?.features) return { isPro, ...DEFAULT_FEATURES };

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
        interval: feature.interval || "",
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
        interval: feature.interval || "",
        included_usage: feature.included_usage || 0,
      };
    }

    return { isPro, ...features };
  }, [customer]);

  const openBillingPortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (error: any) {
      const polarError = error as PolarError;
      const errorMessage = String(polarError?.message || polarError?.body$ || "");
      const errorDetail = String(polarError?.detail || "");
      
      // 404 - Customer doesn't exist (expected for new users)
      if (errorMessage.includes("ResourceNotFound") || 
          errorDetail.includes("Customer does not exist") ||
          polarError?.status === 404) {
        console.warn("Customer not found in Polar. Creating customer...");
        return;
      }
      
      // 403 - Permission denied (auth issues)
      if (errorMessage.includes("NotPermitted") || polarError?.status === 403) {
        console.error("Polar permission denied:", error);
        return;
      }
      
      console.error("Failed to open billing portal:", error);
    }
  };

  const trackUsage = async (event: string, metadata: Record<string, string | number | boolean> = {}) => {
    try {
      await authClient.usage.ingest({
        event,
        metadata,
      });
    } catch (error) {
      console.error("Failed to track usage:", error);
    }
  };

  const checkout = async (slug: "pro-monthly" | "pro-annual") => {
    try {
      await authClient.checkout({ slug });
    } catch (error) {
      console.error("Checkout failed:", error);
      throw error;
    }
  };

  return {
    isLoading,
    customer,
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


