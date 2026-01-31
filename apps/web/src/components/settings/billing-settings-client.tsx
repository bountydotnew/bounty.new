'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Skeleton } from '@bounty/ui/components/skeleton';
import { Button } from '@bounty/ui/components/button';
import { ExternalLink, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useCustomer } from 'autumn-js/react';
import { useState, useCallback } from 'react';
import { cn } from '@bounty/ui/lib/utils';

type Feature = {
  enabled?: boolean;
  type?: string;
  usage?: number;
  unlimited?: boolean;
  included_usage?: number;
  next_reset_at?: number | null;
  name?: string;
};

const SECTION_PADDING = 'py-[18px]';
const SECTION_TITLE = 'text-[20px] leading-[150%] text-foreground font-medium';

export function BillingSettingsClient() {
  const {
    customer,
    isLoading,
    error,
    refetch,
    openBillingPortal,
  } = useCustomer();

  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const isFreeTier = !customer;
  const products = customer?.products ?? [];
  const activeProducts = products.filter((p) => p.status === 'active' || p.status === 'trialing');
  const hasActiveSubscription = activeProducts.length > 0;
  const activeProduct = activeProducts[0];
  const features = customer?.features ?? {};

  const formatDate = (timestamp: number | null) => {
    if (!timestamp || timestamp === 0) return null;
    const isSeconds = timestamp < 32_503_680_000;
    const date = isSeconds ? new Date(timestamp * 1000) : new Date(timestamp);
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2100) return null;
    return format(date, 'MMM d, yyyy');
  };

  const handleOpenPortal = useCallback(async () => {
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
  }, [openBillingPortal]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-[121px] border-b border-border animate-pulse bg-surface-2" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10 p-8 text-center">
        <Zap className="mx-auto h-12 w-12 text-red-500 opacity-50" />
        <h3 className="mt-4 font-semibold text-red-700 dark:text-red-400">Billing Error</h3>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-start pb-4 border-b border-border">
        <div className="flex flex-col justify-end">
          <h1 className="text-[28px] leading-[150%] text-foreground font-medium">
            Billing
          </h1>
          <p className="text-[16px] leading-[150%] text-text-secondary font-medium">
            Manage your subscription and payment methods
          </p>
        </div>
        {hasActiveSubscription && (
          <button
            onClick={handleOpenPortal}
            disabled={isPortalLoading}
            className="w-fit h-[31px] rounded-[10px] flex items-center px-3 py-0 gap-2 bg-[#474747] hover:bg-[#5A5A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-[13px] leading-[150%] text-white font-medium">
              Manage billing
            </span>
            <ExternalLink className="size-4 text-white" />
          </button>
        )}
      </header>

      {/* Current Plan */}
      <section className={cn('flex flex-col gap-4 border-b border-border', SECTION_PADDING)}>
        <div className="flex items-center justify-between">
          <h2 className={SECTION_TITLE}>Current Plan</h2>
          <button
            onClick={() => refetch()}
            disabled={isPortalLoading}
            className="size-8 flex items-center justify-center rounded-md hover:bg-surface-3 disabled:opacity-50 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('size-4', isPortalLoading && 'animate-spin')} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={hasActiveSubscription ? 'bg-surface-3 text-foreground' : ''}>
            {activeProduct?.name ?? 'Free'}
          </Badge>
          {activeProduct && (
            <Badge variant="outline" className="text-xs uppercase">
              {activeProduct.status}
            </Badge>
          )}
        </div>

        {activeProduct && (
          <div className="flex flex-col gap-3 text-sm">
            {activeProduct.started_at && (
              <div className="text-text-secondary">
                <span className="font-medium text-foreground">Started:</span>{' '}
                {formatDate(activeProduct.started_at)}
              </div>
            )}
            {activeProduct.current_period_end && (
              <div className="text-text-secondary">
                <span className="font-medium text-foreground">Renews:</span>{' '}
                {formatDate(activeProduct.current_period_end)}
              </div>
            )}
          </div>
        )}

        {isFreeTier && (
          <p className="text-text-secondary text-sm">
            You're on the free tier. Upgrade to unlock more features.
          </p>
        )}
      </section>

      {/* Features & Usage */}
      {customer && Object.keys(features).length > 0 && (
        <section className={cn('flex flex-col gap-4 border-b border-border', SECTION_PADDING)}>
          <h2 className={SECTION_TITLE}>Features & Usage</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(features).map(([key, feature]) => {
              const f = feature as unknown as Feature;
              const usagePercent = !f.unlimited && (f.included_usage ?? 0) > 0
                ? Math.min(100, ((f.usage ?? 0) / (f.included_usage ?? 1)) * 100)
                : null;

              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {f.name ?? key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                    <Badge variant={f.enabled ? 'default' : 'secondary'} className="text-xs">
                      {f.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  {f.type !== 'static' && f.type !== 'single_use' && (
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between text-text-secondary">
                        <span>Usage</span>
                        <span className="font-medium text-foreground">
                          {f.usage ?? 0} / {f.unlimited ? '∞' : f.included_usage ?? 'N/A'}
                        </span>
                      </div>

                      {usagePercent !== null && (
                        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            )}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      )}

                      {f.next_reset_at && (
                        <div className="text-text-secondary text-xs">
                          Resets {formatDate(f.next_reset_at)}
                        </div>
                      )}
                    </div>
                  )}

                  {f.type === 'static' && (
                    <p className="text-text-secondary text-sm">
                      {f.enabled ? 'Included in your plan' : 'Not available in your plan'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Account Info */}
      {customer && (
        <section className={cn('flex flex-col gap-4 border-b border-border', SECTION_PADDING)}>
          <h2 className={SECTION_TITLE}>Account Information</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Account ID</dt>
              <dd>
                <code className="rounded bg-surface-3 px-2 py-1 text-xs text-foreground">
                  {customer.id ?? 'N/A'}
                </code>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Email</dt>
              <dd className="text-foreground">{customer.email ?? 'Not set'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Name</dt>
              <dd className="text-foreground">{customer.name ?? 'Not set'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Environment</dt>
              <dd>
                <Badge variant="outline" className="text-xs">
                  {customer.env ?? 'unknown'}
                </Badge>
              </dd>
            </div>
            {customer.created_at && (
              <div className="flex items-center justify-between">
                <dt className="text-text-secondary">Member since</dt>
                <dd className="text-foreground">{formatDate(customer.created_at)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {!hasActiveSubscription && (
        <section className={cn('flex flex-col gap-4', SECTION_PADDING)}>
          <h2 className={SECTION_TITLE}>Upgrade Plan</h2>
          <p className="text-sm text-text-secondary">
            Choose a plan that fits your needs.
          </p>
          <Button asChild>
            <Link href="/pricing">
              View Plans
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      )}

      {/* Testing - dev only */}
      {process.env.NODE_ENV === 'development' && (
        <section className={cn('flex flex-col gap-4 border-b border-dashed border-border', SECTION_PADDING)}>
          <h2 className={cn(SECTION_TITLE, 'text-text-secondary')}>Testing Tools</h2>
          <p className="text-sm text-text-secondary">
            Development tools for testing billing functionality
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/test/billing">
              <RefreshCw className="mr-2 h-4 w-4" />
              Billing Test Dashboard
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
