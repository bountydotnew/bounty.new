'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PricingCards } from '@/components/billing/pricing-cards';
import { BillingToggle } from '@/components/billing/billing-toggle';
import { SpendSlider } from '@/components/billing/spend-slider';
import { useSession } from '@/context/session-context';
import { useCustomer } from 'autumn-js/react';
import { toast } from 'sonner';
import { getRecommendedPlan } from '@bounty/types';
import { useActiveOrg } from '@/hooks/use-active-org';

function PricingPageContentInner() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const [monthlySpend, setMonthlySpend] = useState(300); // Default to $300
  const searchParams = useSearchParams();
  const { isAuthenticated, isPending } = useSession();
  const { attach } = useCustomer();
  const { activeOrgSlug } = useActiveOrg();

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
        const baseUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new');

        const result = await attach({
          productId: checkoutPlan,
          successUrl: activeOrgSlug
            ? `${baseUrl}/${activeOrgSlug}/settings/billing?checkout=success`
            : `${baseUrl}/settings/billing?checkout=success`,
          checkoutSessionParams: {
            cancel_url: `${baseUrl}/pricing`,
          },
          forceCheckout: true,
        });

        if (result.error) {
          toast.error(result.error.message ?? 'Checkout failed');
          return;
        }

        const data = result.data;
        if (data && 'checkout_url' in data && data.checkout_url) {
          // Redirect to Stripe checkout
          window.location.href = data.checkout_url;
        } else {
          toast.error('Invalid checkout response. Please try again.');
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('[Checkout Error]', error);
        toast.error(`Checkout failed: ${message}`);
      }
    };
    startCheckout();
  }, [searchParams, isAuthenticated, isPending, attach]);

  return (
    <div className="mx-auto max-w-7xl px-8 pt-32 pb-24">
      {/* Header */}
      <h1 className="text-center text-5xl font-medium tracking-tight text-foreground">
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
        <PricingCards
          isYearly={billingPeriod === 'yearly'}
          recommendedPlan={recommendedPlan}
          estimatedMonthlySpend={monthlySpend}
        />
      </section>
    </div>
  );
}

export function PricingPageContent() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-8 pt-32 pb-24">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <PricingPageContentInner />
    </Suspense>
  );
}
