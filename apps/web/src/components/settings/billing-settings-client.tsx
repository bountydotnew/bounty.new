'use client';

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
import type { BillingSubscription, CustomerState } from '@/types/billing';
import { Loader2 } from 'lucide-react';

interface BillingSettingsClientProps {
  initialCustomerState?: CustomerState | null;
}

export function BillingSettingsClient({
  initialCustomerState,
}: BillingSettingsClientProps) {
  const {
    isPro,
    customer,
    isLoading: billingLoading,
    openBillingPortal,
  } = useBilling({
    enabled: true,
    initialCustomerState,
  });

  const renderLoadingState = () => (
    <div className="flex items-center space-x-2">
      <Loader2 className="animate-spin" size={16} />
      <span className="text-muted-foreground text-sm">
        Loading subscription...
      </span>
    </div>
  );

  const renderPlanBadge = () => (
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
  );

  const renderActiveSubscriptions = () => {
    const subscriptions = customer?.activeSubscriptions ?? [];
    if (!isPro || subscriptions.length === 0) {
      return null;
    }

    return (
      <>
        <Separator />
        <div className="space-y-3">
          <h5 className="font-medium text-muted-foreground text-sm">
            Active Subscriptions
          </h5>
          <div className="space-y-2">
            {subscriptions.map((sub: BillingSubscription) => (
              <div
                className="rounded-lg border p-3"
                key={
                  sub.productId ??
                  sub.product?.id ??
                  sub.product?.slug ??
                  'subscription'
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {sub.product?.name || 'Pro Plan'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Active subscription
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderBillingPortalSection = () => {
    if (!isPro) {
      return null;
    }

    return (
      <>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium">Billing Portal Access</h4>
          <p className="text-muted-foreground text-sm">
            Manage your subscription, payment methods, and billing history
            through the Stripe billing portal.
          </p>
        </div>
      </>
    );
  };

  const renderSubscriptionCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan & Subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {billingLoading ? (
          renderLoadingState()
        ) : (
          <>
            {renderPlanBadge()}
            {renderActiveSubscriptions()}
            {renderBillingPortalSection()}
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
  );

  const proFeatureCards = [
    {
      title: 'Lower Fees',
      description: 'Reduced platform fees on bounties',
      badge: isPro ? 'Enabled' : 'Pro Only',
      badgeVariant: isPro ? 'default' : 'secondary',
      dimWhenFree: true,
    },
    {
      title: 'Unlimited Concurrent Bounties',
      description: 'Create multiple active bounties',
      badge: isPro ? 'Enabled' : 'Pro Only',
      badgeVariant: isPro ? 'default' : 'secondary',
      dimWhenFree: true,
    },
    {
      title: 'Priority Support',
      description: 'Get faster responses from our support team',
      badge: isPro ? 'Enabled' : 'Pro Only',
      badgeVariant: isPro ? 'default' : 'secondary',
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed insights into your bounty performance',
      badge: 'Coming Soon',
      badgeVariant: 'secondary' as const,
    },
  ];

  const renderProFeatures = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pro Features</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {proFeatureCards.map((feature) => {
            const dimmed = !isPro && feature.dimWhenFree;
            return (
              <div
                key={feature.title}
                className={`rounded-lg border p-3 ${dimmed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{feature.title}</span>
                  <Badge
                    variant={
                      feature.badgeVariant as
                        | 'default'
                        | 'secondary'
                        | 'destructive'
                        | 'outline'
                        | null
                        | undefined
                    }
                  >
                    {feature.badge}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
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
  );

  return (
    <div className="space-y-6">
      {renderSubscriptionCard()}
      {renderProFeatures()}
    </div>
  );
}
