'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PricingCards } from '@/components/billing/pricing-cards';
import { BillingToggle } from '@/components/billing/billing-toggle';
import { SpendSlider } from '@/components/billing/spend-slider';
import { useSession } from '@/context/session-context';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import { getRecommendedPlan } from '@bounty/types';

export function PricingPageContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [monthlySpend, setMonthlySpend] = useState(300); // Default to $300
  const searchParams = useSearchParams();
  const { isAuthenticated, isPending } = useSession();
  
  const recommendedPlan = getRecommendedPlan(monthlySpend);

  // Handle checkout callback after login redirect
  useEffect(() => {
    const checkoutPlan = searchParams.get('checkout');
    const shouldProcessCheckout = checkoutPlan && isAuthenticated && !isPending;
    
    if (!shouldProcessCheckout) {
      return;
    }

    // Clear the checkout param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    window.history.replaceState({}, '', url.pathname);

    // Trigger checkout for non-free plans (includes yearly variants)
    if (checkoutPlan === 'free') {
      return;
    }

    const startCheckout = async () => {
      try {
        const result = await trpcClient.billing.createCheckout.mutate({ slug: checkoutPlan });
        if (result?.checkoutUrl) {
          // Redirect to Stripe checkout (first-time payment)
          window.location.href = result.checkoutUrl;
        } else if (result?.preview) {
          // For preview flow, show a toast and let the user click the button again
          // The pricing card will handle the confirmation dialog
          toast.info('Please confirm your purchase on the pricing card');
        } else {
          toast.error('Invalid checkout response. Please try again.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Checkout Error]', error);
        toast.error(`Checkout failed: ${message}`);
      }
    };
    startCheckout();
  }, [searchParams, isAuthenticated, isPending]);

  return (
    <div className="mx-auto max-w-7xl px-8 pt-32 pb-24">
      {/* Header */}
      <h1 className="text-center text-5xl font-light tracking-tight text-[#efefef]">
        Pricing
      </h1>

      {/* Billing Toggle */}
      <div className="mt-8">
        <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
      </div>

      {/* Spend Slider */}
      <div className="mt-12">
        <SpendSlider value={monthlySpend} onChange={setMonthlySpend} />
      </div>

      {/* Plans Section */}
      <section className="mt-8">
        <PricingCards isYearly={billingPeriod === 'yearly'} recommendedPlan={recommendedPlan} />
      </section>
    </div>
  );
}
