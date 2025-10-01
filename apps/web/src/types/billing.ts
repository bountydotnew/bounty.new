import type { CustomerState as PolarCustomerState } from '@polar-sh/sdk/models/components/customerstate'; 

export interface PolarError extends Error {
  body$?: string;
  detail?: string;
  status?: number;
}

export interface FeatureState {
  total: number;
  remaining: number;
  unlimited: boolean;
  enabled: boolean;
  usage: number;
  nextResetAt: number | null;
  interval: string;
  included_usage: number;
}

export interface Features {
  lowerFees: FeatureState;
  concurrentBounties: FeatureState;
}

export interface BillingProduct {
  id?: string;
  name?: string;
  slug?: string;
}

export interface BillingSubscription {
  product?: BillingProduct;
}

export interface BillingFeature {
  included_usage?: number;
  balance?: number;
  unlimited?: boolean;
  usage?: number;
  next_reset_at?: number;
  interval?: string;
}


export type CustomerState = Partial<PolarCustomerState> & {
  products?: BillingProduct[];
  activeSubscriptions?: BillingSubscription[];
  grantedBenefits?: unknown[];
  features?: Record<string, BillingFeature>;
};

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
    metadata: Record<string, string | number | boolean>;
  };
}

export interface CheckoutPendingAction extends BasePendingAction {
  type: 'checkout';
  params: {
    slug: 'pro-monthly' | 'pro-annual';
  };
}

export type PendingAction =
  | PortalPendingAction
  | UsagePendingAction
  | CheckoutPendingAction;

export interface UsageMetadata {
  [key: string]: string | number | boolean;
}

export interface CheckoutParams {
  slug: 'pro-monthly' | 'pro-annual';
}

export interface UsageParams {
  event: string;
  metadata: UsageMetadata;
}

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
