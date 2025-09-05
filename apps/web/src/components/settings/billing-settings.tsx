'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@bounty/ui/components/card';
import { Separator } from '@bounty/ui/components/separator';
import { useBilling } from '@bounty/ui/hooks/use-billing';

export function BillingSettings() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const {
    isPro,
    customer,
    isLoading: billingLoading,
    openBillingPortal,
  } = useBilling({ enabled: true });

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Don't render until client is mounted to prevent hydration issues
  if (!isClientMounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loader2 className="animate-spin" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan & Subscription Details - Merged */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan & Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {billingLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-muted-foreground text-sm">
                Loading subscription...
              </span>
            </div>
          ) : (
            <>
              {/* Plan Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      isPro
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : ''
                    }
                    variant={isPro ? 'default' : 'secondary'}
                  >
                    {isPro ? 'Pro' : 'Free'}
                  </Badge>
                  {isPro && (
                    <span className="text-muted-foreground text-sm">
                      Active subscription
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">
                  {isPro
                    ? 'You have access to all Pro features'
                    : 'Upgrade to unlock all features'}
                </p>
              </div>

              {/* Active Subscriptions - Only show if Pro */}
              {customer &&
                isPro &&
                customer.activeSubscriptions &&
                customer.activeSubscriptions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h5 className="font-medium text-muted-foreground text-sm">
                        Active Subscriptions
                      </h5>
                      <div className="space-y-2">
                        {customer.activeSubscriptions.map(
                          (subscription, index) => (
                            <div className="rounded-lg border p-3" key={index}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">
                                    {subscription.product?.name || 'Pro Plan'}
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    Active subscription
                                  </p>
                                </div>
                                <Badge variant="outline">Active</Badge>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}

              {/* Billing Portal Info - Only show if Pro */}
              {isPro && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Billing Portal Access</h4>
                    <p className="text-muted-foreground text-sm">
                      Manage your subscription, payment methods, and billing
                      history through the Stripe billing portal.
                    </p>
                  </div>
                </>
              )}

              {/* Single Action Button */}
              <Separator />
              <div className="flex justify-end">
                <Button onClick={openBillingPortal} variant="outline">
                  {isPro ? 'Manage Billing' : 'Upgrade to Pro'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pro Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pro Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              className={`rounded-lg border p-3 ${isPro ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Lower Fees</span>
                <Badge variant={isPro ? 'default' : 'secondary'}>
                  {isPro ? 'Enabled' : 'Pro Only'}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Reduced platform fees on bounties
              </p>
            </div>
            <div
              className={`rounded-lg border p-3 ${isPro ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Unlimited Concurrent Bounties
                </span>
                <Badge variant={isPro ? 'default' : 'secondary'}>
                  {isPro ? 'Enabled' : 'Pro Only'}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Create multiple active bounties
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Priority Support</span>
                <Badge variant={isPro ? 'default' : 'secondary'}>
                  {isPro ? 'Enabled' : 'Pro Only'}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Get faster responses from our support team
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Advanced Analytics</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Detailed insights into your bounty performance
              </p>
            </div>
          </div>

          {!isPro && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3 text-center">
                <h4 className="font-medium">Upgrade to Pro</h4>
                <p className="text-muted-foreground text-sm">
                  Get access to lower fees, unlimited concurrent bounties, and
                  more features.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
