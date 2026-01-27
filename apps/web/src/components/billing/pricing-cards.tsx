'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS, type BountyProPlan } from '@bounty/types';
import { cn } from '@bounty/ui';
import { useSession } from '@/context/session-context';
import { useCustomer } from 'autumn-js/react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@bounty/ui/components/tooltip';

const PLAN_ORDER: BountyProPlan[] = [
  'free',
  'tier_1_basic',
  'tier_2_pro',
  'tier_3_pro_plus',
];

const PLAN_FEATURES: Record<BountyProPlan, string[]> = {
  free: [
    '1 concurrent bounty',
    '5% platform fee',
    'Full platform access',
    'Standard support',
  ],
  tier_1_basic: [
    'Unlimited concurrent bounties',
    '$500 fee-free allowance',
    '0% fee over allowance',
    'Priority support',
  ],
  tier_2_pro: [
    'Unlimited concurrent bounties',
    '$5,000 fee-free allowance',
    '2% fee over allowance',
    'Priority support',
    'Advanced analytics',
  ],
  tier_3_pro_plus: [
    'Unlimited concurrent bounties',
    '$12,000 fee-free allowance',
    '4% fee over allowance',
    'Priority support',
    'Advanced analytics',
    'Custom integrations',
  ],
};

// Yearly pricing (typically ~2 months free)
const YEARLY_PRICES: Record<BountyProPlan, number> = {
  free: 0,
  tier_1_basic: 100, // $10/mo * 10 months
  tier_2_pro: 250,   // $25/mo * 10 months
  tier_3_pro_plus: 1500, // $150/mo * 10 months
};

// Get the base URL for success/redirects
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';
};

function PricingCard({
  plan,
  isRecommended,
  isYearly,
}: {
  plan: BountyProPlan;
  isRecommended: boolean;
  isYearly: boolean;
}) {
  const router = useRouter();
  const { session, isAuthenticated } = useSession();
  const { attach } = useCustomer();
  const pricing = PRICING_TIERS[plan];
  const [isLoading, setIsLoading] = useState(false);

  // Check if early access mode is enabled
  const isEarlyAccessEnabled = process.env.NEXT_PUBLIC_EARLY_ACCESS_ENABLED !== 'false';

  // Check if user has early access (early_access or admin role)
  const hasEarlyAccess = session?.user?.role === 'early_access' || session?.user?.role === 'admin';

  // Determine if user can purchase
  const canPurchase = !isEarlyAccessEnabled || hasEarlyAccess;

  const displayPrice = isYearly ? YEARLY_PRICES[plan] : pricing.monthlyPrice;
  const checkoutSlug = plan === 'free'
    ? 'free'
    : isYearly
      ? `${plan}_yearly`
      : plan;

  const handleCheckoutClick = () => {
    // If early access is enabled and user doesn't have access, redirect to early access required
    if (isEarlyAccessEnabled && !hasEarlyAccess) {
      router.push('/early-access-required');
      return;
    }

    if (plan === 'free') {
      router.push('/dashboard');
      return;
    }

    // If not authenticated, redirect to login with callback
    if (!isAuthenticated) {
      const callbackUrl = `/pricing?checkout=${checkoutSlug}`;
      router.push(`/login?callback=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    handleCheckout().catch((error) => {
      console.error('[Checkout Error]', error);
    });
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Use the SDK's attach method with explicit success URL
      // forceCheckout: true ensures users always go through the checkout page
      const result = await attach({
        productId: checkoutSlug,
        successUrl: `${getBaseUrl()}/settings/billing?checkout=success`,
        checkoutSessionParams: {
          cancel_url: `${getBaseUrl()}/pricing`,
        },
        forceCheckout: true,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Checkout failed');
        setIsLoading(false);
        return;
      }

      const data = result.data;
      if (!data) {
        toast.error('Invalid checkout response');
        setIsLoading(false);
        return;
      }

      // Redirect to checkout URL
      if ('checkout_url' in data && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Fallback: if for some reason no checkout URL, show error
      toast.error('Unable to open checkout page. Please try again.');
      setIsLoading(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Checkout Error]', error);
      toast.error(`Checkout failed: ${message}`);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-200',
        'bg-[#1a1a1a]',
        // Recommended card gets highlighted styling
        isRecommended
          ? 'border-white/30 bg-[#1f1f1f]'
          : 'border-[#2a2a2a]'
      )}
    >
      {/* Plan Header */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-medium text-[#efefef]">
            {pricing.name}
          </h3>
          {isRecommended && (
            <span className="text-[#888] text-sm">Recommended</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-0.5">
          <span className="text-2xl font-medium text-[#888]">
            ${displayPrice}
          </span>
          <span className="text-sm text-[#888]">
            /{isYearly ? 'yr.' : 'mo.'}
          </span>
        </div>
        {isYearly && displayPrice > 0 && (
          <p className="mt-1 text-xs text-[#666]">
            ${Math.round(displayPrice / 12)}/mo. billed annually
          </p>
        )}

        {/* Features */}
        <p className="mt-4 text-sm text-[#888]">
          {plan === 'free' ? 'Includes:' : 'Everything in Free, plus:'}
        </p>
        <ul className="mt-3 space-y-2">
          {PLAN_FEATURES[plan].map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-[#efefef]"
            >
              <span className="text-[#888]">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="mt-6">
        {!canPurchase ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'inline-flex w-full items-center justify-center rounded-full text-sm font-medium transition-colors cursor-not-allowed opacity-70',
                  isRecommended
                    ? 'bg-white text-[#0E0E0E]'
                    : 'bg-[#1a1a1a] text-white border border-[#333]'
                )}
                style={{ padding: '.5em 1em .52em' }}
              >
                {plan === 'free' ? 'Get Started' : `Get ${pricing.name}`}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Early Access Required - Join the waitlist to get access</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={handleCheckoutClick}
            disabled={isLoading}
            className={cn(
              'w-full rounded-full text-sm font-medium transition-colors',
              isRecommended
                ? 'bg-white text-[#0E0E0E] hover:bg-[#e5e5e5]'
                : 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#333]',
              isLoading && 'cursor-wait opacity-50'
            )}
            style={{ padding: '.5em 1em .52em' }}
          >
            {isLoading
              ? 'Loading...'
              : plan === 'free'
                ? 'Get Started'
                : `Get ${pricing.name}`}
          </button>
        )}
      </div>
    </div>
  );
}

interface PricingCardsProps {
  isYearly?: boolean;
  recommendedPlan?: BountyProPlan;
}

export function PricingCards({ isYearly = false, recommendedPlan = 'tier_2_pro' }: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {PLAN_ORDER.map((plan) => (
        <PricingCard
          key={plan}
          plan={plan}
          isRecommended={plan === recommendedPlan}
          isYearly={isYearly}
        />
      ))}
    </div>
  );
}
