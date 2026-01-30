'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Separator } from '@bounty/ui/components/separator';
import { Skeleton } from '@bounty/ui/components/skeleton';
import { Loader2, ExternalLink, CreditCard, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useCustomer } from 'autumn-js/react';
import { useState } from 'react';

export function BillingSettingsClient() {
  // Use the autumn-js SDK hooks
  const {
    customer,
    isLoading,
    error,
    refetch,
    openBillingPortal,
  } = useCustomer();

  // Local state for portal loading
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // If no customer, user is on free tier (no Autumn customer yet)
  const isFreeTier = !customer;
  const products = customer?.products ?? [];

  // Get active products (status: active or trialing)
  const activeProducts = products.filter((p) => p.status === 'active' || p.status === 'trialing');
  const hasActiveSubscription = activeProducts.length > 0;

  // Get the first active subscription (primary product)
  const activeProduct = activeProducts[0];

  // Features from customer
  const features = customer?.features ?? {};

  // Format date helper - handles Unix timestamps (seconds) and invalid values
  const formatDate = (timestamp: number | null) => {
    if (!timestamp || timestamp === 0) {
      return null;
    }
    // Check if timestamp is in seconds (less than year 3000 in seconds)
    const isSeconds = timestamp < 32_503_680_000; // 32503680000 = year 3000 in seconds
    const date = isSeconds ? new Date(timestamp * 1000) : new Date(timestamp);
    // Verify date is valid and reasonable (between 2000 and 2100)
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) {
      return null;
    }
    return format(date, 'MMM d, yyyy');
  };

  // Handle portal opening
  const handleOpenPortal = async () => {
    setIsPortalLoading(true);
    try {
      const result = await openBillingPortal();
      if (result.error) {
        console.error('Portal error:', result.error);
        alert(`Failed to open billing portal: ${result.error.message}`);
      } else if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10 p-4 text-center">
              <Zap className="mx-auto h-12 w-12 text-red-500 opacity-50" />
              <h3 className="mt-4 font-semibold text-red-700 dark:text-red-400">Billing Error</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                {error.message}
              </p>
            </div>
          ) : isFreeTier ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 font-semibold">Free Tier</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                You're on the free tier. Upgrade to unlock more features.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button asChild>
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={hasActiveSubscription ? 'default' : 'secondary'}
                    className={hasActiveSubscription ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-foreground' : ''}
                  >
                    {activeProduct?.name ?? 'Free'}
                  </Badge>
                  {hasActiveSubscription && (
                    <span className="text-muted-foreground text-sm">
                      Active subscription
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isPortalLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="ml-1">Sync</span>
                  </Button>
                  {hasActiveSubscription && (
                    <Button
                      size="sm"
                      onClick={handleOpenPortal}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Manage Billing
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Subscription Details */}
              {activeProduct && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activeProduct.name}</p>
                      <p className="text-muted-foreground text-sm capitalize">
                        {activeProduct.status === 'trialing'
                          ? 'Trial period'
                          : activeProduct.status === 'active'
                            ? 'Active subscription'
                            : `${activeProduct.status.replace('_', ' ')}`}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {activeProduct.status}
                    </Badge>
                  </div>

                  {activeProduct.started_at && (
                    <div className="text-muted-foreground text-sm">
                      <span className="font-medium text-foreground">Started:</span>{' '}
                      {formatDate(activeProduct.started_at)}
                    </div>
                  )}

                  {activeProduct.current_period_end && (
                    <div className="text-muted-foreground text-sm">
                      <span className="font-medium text-foreground">Renews:</span>{' '}
                      {formatDate(activeProduct.current_period_end)}
                    </div>
                  )}

                  {activeProduct.is_add_on && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-2 text-blue-800 dark:text-blue-200 text-sm">
                      This is an add-on product
                    </div>
                  )}
                </div>
              )}

              {!hasActiveSubscription && (
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    You are on the free tier. Upgrade to unlock more features.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Features & Usage */}
      {customer && Object.keys(features).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Features & Usage</CardTitle>
            <CardDescription>Your current feature access and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(features).map(([key, feature]) => {
                const f = feature as unknown as {
                  enabled?: boolean;
                  type?: string;
                  balance?: number | null;
                  usage?: number;
                  unlimited?: boolean;
                  included_usage?: number;
                  next_reset_at?: number | null;
                  name?: string;
                };
                return (
                  <div key={key} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{f.name ?? key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                      <Badge variant={f.enabled ? 'default' : 'secondary'}>
                        {f.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Show usage for metered features */}
                    {f.type !== 'static' && f.type !== 'single_use' && (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Usage:</span>
                          <span className="font-medium">
                            {f.usage ?? 0} / {f.unlimited ? '∞' : f.included_usage ?? 'N/A'}
                          </span>
                        </div>

                        {/* Progress bar for metered features */}
                        {!f.unlimited && (f.included_usage ?? 0) > 0 && (
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${Math.min(100, ((f.usage ?? 0) / (f.included_usage ?? 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        )}

                        {f.next_reset_at && (
                          <div className="text-muted-foreground">
                            Resets {formatDate(f.next_reset_at)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Boolean/static feature */}
                    {f.type === 'static' && (
                      <p className="text-muted-foreground text-sm">
                        {f.enabled ? 'Included in your plan' : 'Not available in your plan'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your billing account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account ID:</span>
              <code className="rounded bg-muted px-2 py-1 text-xs">{customer.id ?? 'N/A'}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{customer.email ?? 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{customer.name ?? 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <Badge variant="outline" className="text-xs">
                {customer.env ?? 'unknown'}
              </Badge>
            </div>
            {customer.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since:</span>
                <span>{formatDate(customer.created_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
          <CardDescription>Manage your subscription and payment methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {hasActiveSubscription ? (
              <Button
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
                className="flex-1"
              >
                {isPortalLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Manage Billing
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                className="flex-1"
              >
                <Link href="/pricing">
                  Upgrade Plan
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          <Separator />

          <div className="text-muted-foreground text-sm">
            <p>
              {hasActiveSubscription
                ? 'View and update your payment methods, download invoices, and manage your subscription through the billing portal.'
                : 'Choose a plan that fits your needs. You can manage your subscription and payment methods after upgrading.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Testing Link (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Testing Tools</CardTitle>
            <CardDescription className="text-xs">
              Development tools for testing billing functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/test/billing">
                <RefreshCw className="mr-2 h-4 w-4" />
                Open Billing Test Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
