'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS, type BountyProPlan } from '@bounty/types';
import { cn } from '@bounty/ui';
import { useSession } from '@/context/session-context';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';

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
  const { isAuthenticated } = useSession();
  const pricing = PRICING_TIERS[plan];
  const [isLoading, setIsLoading] = useState(false);

  const displayPrice = isYearly ? YEARLY_PRICES[plan] : pricing.monthlyPrice;
  const checkoutSlug = plan === 'free' 
    ? 'free' 
    : isYearly 
      ? `${plan}_yearly` 
      : plan;

  const handleCheckout = async () => {
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

    setIsLoading(true);
    try {
      const result = await trpcClient.billing.createCheckout.mutate({ slug: checkoutSlug });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
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
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isLoading}
          className={cn(
            'w-full rounded-full text-sm font-medium transition-colors',
            isRecommended
              ? 'bg-white text-[#0E0E0E] hover:bg-[#e5e5e5]'
              : 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#333]',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
          style={{ padding: '.5em 1em .52em' }}
        >
          {isLoading
            ? 'Loading...'
            : plan === 'free'
              ? 'Get Started'
              : `Get ${pricing.name}`}
        </button>
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
