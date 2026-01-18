'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Separator } from '@bounty/ui/components/separator';
import { useBilling } from '@/hooks/use-billing';
import { ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/dual-sidebar';
import Bounty from '@/components/icons/bounty';
import { useConfetti } from '@/context/confetti-context';
import { PRICING_TIERS } from '@bounty/types';

export function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get('checkout_id');
  const { refetch, customer } = useBilling();
  const { data: session } = authClient.useSession();
  const { celebrate } = useConfetti();

  useEffect(() => {
    celebrate();
  }, [celebrate]);

  useEffect(() => {
    if (!checkoutId) {
      router.push('/dashboard');
      return;
    }

    refetch();
  }, [checkoutId, refetch, router]);

  if (!checkoutId) {
    return null;
  }

  // Get plan details from the customer's subscription
  const subscription = customer?.subscriptions?.[0];
  const productId = subscription?.product_id;

  // Find matching pricing tier
  const planTier = productId
    ? Object.values(PRICING_TIERS).find((tier) => tier.slug === productId)
    : null;

  const planName = planTier?.name ?? 'Pro Plan';
  const planPrice = planTier
    ? `$${planTier.monthlyPrice}/month`
    : 'Pro Pricing';

  return (
    <Sidebar>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="pb-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-none">
                  <Bounty className="h-20 w-20 text-foreground" />
                </div>
              </div>

              <CardTitle className="font-bold text-2xl text-foreground">
                Welcome to Pro!
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <Card className="border-border bg-[#191919]">
                <CardHeader>
                  <CardTitle className="font-semibold text-xl">
                    Purchase Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {planName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Bounty Pro Subscription
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {planPrice}
                      </p>
                      <Badge className="mt-1" variant="secondary">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">
                        Pro Features Unlocked:
                      </h4>
                      <ul className="space-y-1 text-muted-foreground text-sm">
                        <li>Lower fees on bounty transactions</li>
                        <li>Create multiple concurrent bounties</li>
                        <li>Priority support</li>
                        <li>Early access to new features</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">
                        Order Details:
                      </h4>
                      <div className="space-y-1 text-muted-foreground text-sm">
                        <p>
                          Checkout ID:{' '}
                          <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                            {checkoutId}
                          </span>
                        </p>
                        <p>Account: {session?.user?.email}</p>
                        <p>
                          Status:{' '}
                          <span className="font-medium text-foreground">
                            Active
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  className="flex-1"
                  onClick={() => router.push('/bounties')}
                  variant="outline"
                >
                  Browse Bounties
                </Button>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Need help? Contact our support team or check out our
                  documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}
