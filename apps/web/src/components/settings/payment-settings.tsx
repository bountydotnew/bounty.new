'use client';

import { Tabs, TabsPanel } from '@bounty/ui/components/tabs';
import { BillingToggle } from '@/components/billing/billing-toggle';
import { Badge } from '@bounty/ui/components/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@bounty/ui/components/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { ConnectOnboardingModal } from '@/components/payment/connect-onboarding-modal';
import { IssuesBlock } from './payment/issues-block';
import { PaymentActivity } from './payment-activity';
import { BalanceCard } from './payment/balance-card';
import { StripeDashIcon } from '@bounty/ui/components/icons/huge/stripe';
import { useState, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import Image from 'next/image';
import { cn } from '@bounty/ui/lib/utils';
import { ChevronDown } from 'lucide-react';
import { PAYMENTS_FAQ_ITEMS } from '@bounty/ui/lib/faqs';
import { useCustomer } from 'autumn-js/react';
import {
  PRICING_TIERS,
  getPlanFeatures,
  type BountyProPlan,
} from '@bounty/types';
import Link from 'next/link';

// Available card background options
const CARD_BACKGROUNDS = [
  { id: 'mountain', label: 'Mountain' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'river-light', label: 'River Light' },
  { id: 'forest', label: 'Forest' },
  { id: 'joshua', label: 'Joshua' },
  { id: 'keelmen', label: 'Keelmen' },
  { id: 'meadow', label: 'Meadow' },
  { id: 'moonlight', label: 'Moonlight' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'northern', label: 'Northern' },
  { id: 'river', label: 'River' },
  { id: 'cathedral', label: 'Cathedral' },
  { id: 'san-trovaso', label: 'San Trovaso' },
  { id: 'footbridge', label: 'Footbridge' },
  { id: 'juniata', label: 'Juniata' },
  { id: 'buffalo', label: 'Buffalo' },
  { id: 'san-marco', label: 'San Marco' },
  { id: 'horse', label: 'White Horse' },
  { id: 'tiger', label: 'Tiger' },
  { id: 'venice', label: 'Venice' },
  { id: 'waterfalls', label: 'Waterfalls' },
  { id: 'wivenhoe', label: 'Wivenhoe' },
  { id: 'parasol', label: 'Parasol' },
  { id: 'woodland', label: 'Woodland' },
];

// Card background option component
function CardBackgroundOption({
  id,
  label,
  isSelected,
  onSelect,
}: {
  id: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className={cn(
          'w-32 aspect-[265/166] rounded-xl overflow-hidden relative transition-all bg-surface-2',
          isSelected
            ? 'ring-2 ring-foreground'
            : 'ring-1 ring-transparent group-hover:ring-border-subtle'
        )}
      >
        <Image
          src={`/images/cards/${id}.jpg`}
          alt={`${label} card preview`}
          fill
          sizes="128px"
          quality={40}
          loading="lazy"
          className="object-cover"
        />
        {isSelected && (
          <div className="absolute top-2 right-2 size-5 rounded-full bg-foreground flex items-center justify-center shadow-lg">
            <Check className="size-3 text-background" />
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

// Card selector with pagination
function CardBackgroundSelector({
  backgrounds,
  selectedBackground,
  onSelect,
}: {
  backgrounds: typeof CARD_BACKGROUNDS;
  selectedBackground: string | null;
  onSelect: (id: string) => void;
}) {
  const CARDS_PER_PAGE = 5;
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const visibleBackgrounds = backgrounds.slice(0, visibleCount);
  const hasMore = visibleCount < backgrounds.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-4">
        {visibleBackgrounds.map((bg) => (
          <CardBackgroundOption
            key={bg.id}
            id={bg.id}
            label={bg.label}
            isSelected={selectedBackground === bg.id}
            onSelect={() => onSelect(bg.id)}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() =>
            setVisibleCount((prev) =>
              Math.min(prev + CARDS_PER_PAGE, backgrounds.length)
            )
          }
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          Show {Math.min(CARDS_PER_PAGE, backgrounds.length - visibleCount)}{' '}
          more
        </button>
      )}
    </div>
  );
}

function useHandleConnectRedirect({
  onboardingStatus,
  refreshParam,
  refetch,
  setOnboardingStatus,
  setRefreshParam,
}: {
  onboardingStatus: string;
  refreshParam: string;
  refetch: () => void;
  setOnboardingStatus: (value: string | null) => void;
  setRefreshParam: (value: string | null) => void;
}) {
  useEffect(() => {
    if (onboardingStatus === 'success') {
      toast.success('Stripe account connected successfully!');
      refetch();
      setOnboardingStatus(null);
      return;
    }
    if (onboardingStatus === 'refresh') {
      toast.info('Please complete the onboarding process');
      refetch();
      setOnboardingStatus(null);
      return;
    }
    if (refreshParam === 'true') {
      refetch();
      setRefreshParam(null);
    }
  }, [
    onboardingStatus,
    refreshParam,
    refetch,
    setOnboardingStatus,
    setRefreshParam,
  ]);
}

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-sm text-foreground">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-sm leading-relaxed text-muted-foreground pr-8">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

// Helper to get plan from product ID
function getPlanFromProductId(productId: string | undefined): BountyProPlan {
  if (!productId) {
    return 'free';
  }
  // Handle yearly variants
  const baseId = productId.replace('_yearly', '');
  if (baseId in PRICING_TIERS) {
    return baseId as BountyProPlan;
  }
  return 'free';
}

// Format date for reset display
function formatResetDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Fees tab content component
function FeesTabContent({
  customer,
  isLoading,
  monthlySpend,
  nextResetDate,
  allTimeSpend,
  allTimeBountyCount,
}: {
  customer:
    | { products?: Array<{ id: string; status: string }> }
    | null
    | undefined;
  isLoading: boolean;
  monthlySpend: number;
  nextResetDate: string | null;
  allTimeSpend: number;
  allTimeBountyCount: number;
}) {
  const { attach, openBillingPortal } = useCustomer();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
    null
  );
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const isYearly = billingPeriod === 'yearly';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 w-full bg-surface-1 rounded-lg" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-56 bg-surface-1 rounded-lg" />
          <div className="h-56 bg-surface-1 rounded-lg" />
          <div className="h-56 bg-surface-1 rounded-lg" />
          <div className="h-56 bg-surface-1 rounded-lg" />
        </div>
      </div>
    );
  }

  const activeProduct = customer?.products?.find(
    (p) => p.status === 'active' || p.status === 'trialing'
  );
  const currentPlanSlug = getPlanFromProductId(activeProduct?.id);
  const currentPlan = PRICING_TIERS[currentPlanSlug];

  // All plans in order
  const allPlans: BountyProPlan[] = [
    'free',
    'tier_1_basic',
    'tier_2_pro',
    'tier_3_pro_plus',
  ];

  // Calculate usage - only show bar if plan has fee-free allowance
  const hasAllowance = currentPlan.feeFreeAllowance > 0;
  const usagePercent = hasAllowance
    ? Math.min(100, (monthlySpend / currentPlan.feeFreeAllowance) * 100)
    : 0;
  const isOverLimit =
    hasAllowance && monthlySpend > currentPlan.feeFreeAllowance;

  // Calculate estimated accumulated fees based on current plan
  // Note: This is an estimate since we don't track which plan was active per transaction
  const estimatedFees = allTimeSpend * (currentPlan.platformFeePercent / 100);

  const handlePlanAction = async (planSlug: BountyProPlan) => {
    if (planSlug === 'free') {
      setIsPortalLoading(true);
      try {
        const result = await openBillingPortal();
        if (result.data?.url) {
          window.location.href = result.data.url;
        }
      } finally {
        setIsPortalLoading(false);
      }
      return;
    }

    setIsCheckoutLoading(planSlug);
    try {
      // Use yearly suffix when yearly billing is selected
      const productId = isYearly ? `${planSlug}_yearly` : planSlug;
      const result = await attach({
        productId,
        successUrl: `${window.location.origin}/settings/payments?tab=fees&checkout=success`,
        forceCheckout: true,
      });
      if (
        result.data &&
        'checkout_url' in result.data &&
        result.data.checkout_url
      ) {
        window.location.href = result.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const result = await openBillingPortal();
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Plan Usage Card */}
      <div className="rounded-lg border border-border-default bg-surface-1 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-foreground">
                {currentPlan.name}
              </h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                Current
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 mt-1">
              <span className="text-2xl font-medium text-text-muted">
                ${currentPlan.monthlyPrice}
              </span>
              <span className="text-sm text-text-muted">/mo.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="rounded-full bg-surface-1 text-foreground hover:bg-surface-2 border border-border-default text-sm font-medium transition-colors disabled:opacity-50"
            style={{ padding: '.5em 1em .52em' }}
          >
            {isPortalLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        </div>

        {/* Usage Section */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-text-muted">
              {hasAllowance
                ? 'Fee-free spending this month'
                : 'Spending this month'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-medium text-foreground">
                ${monthlySpend.toLocaleString()}
              </span>
              {hasAllowance && (
                <span className="text-sm text-text-muted">
                  / ${currentPlan.feeFreeAllowance.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar - only show if plan has allowance */}
          {hasAllowance && (
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isOverLimit ? 'bg-amber-400' : 'bg-white'
                )}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {hasAllowance ? (
                isOverLimit ? (
                  <span className="text-amber-400">
                    {currentPlan.platformFeePercent}% fee on spend over
                    allowance
                  </span>
                ) : monthlySpend === 0 ? (
                  `$${currentPlan.feeFreeAllowance.toLocaleString()} available at 0% fee`
                ) : (
                  `$${(currentPlan.feeFreeAllowance - monthlySpend).toLocaleString()} remaining at 0% fee`
                )
              ) : (
                `${currentPlan.platformFeePercent}% platform fee on all transactions`
              )}
            </span>
            {nextResetDate && (
              <span>Resets {formatResetDate(nextResetDate)}</span>
            )}
          </div>
        </div>

        {/* Accumulated Fees Section */}
        {allTimeBountyCount > 0 && (
          <div className="border-t border-border-default pt-5 mt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-muted">
                Accumulated fees ({allTimeBountyCount} bounties)
              </span>
              <span className="text-base font-medium text-foreground">
                $
                {estimatedFees.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Estimated at {currentPlan.platformFeePercent}% on $
              {allTimeSpend.toLocaleString()} total spend
            </p>
          </div>
        )}
      </div>

      {/* All Plans Grid - matching pricing page style */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-text-muted">All plans</h4>
          <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {allPlans
            .filter((slug) => slug !== currentPlanSlug)
            .map((slug) => {
              const plan = PRICING_TIERS[slug];
              const features = getPlanFeatures(slug, { minimal: true });
              const isCurrent = false; // Never current since we filter out current plan
              const isUpgrade = plan.monthlyPrice > currentPlan.monthlyPrice;
              const isLoading = isCheckoutLoading === slug;

              const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

              return (
                <div
                  key={slug}
                  className={cn(
                    'group relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-200 bg-surface-1',
                    isCurrent ? 'border-white/30' : 'border-border-default'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-medium text-foreground">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-text-muted text-sm">Current</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline gap-0.5">
                      <span className="text-2xl font-medium text-text-muted">
                        ${displayPrice}
                      </span>
                      <span className="text-sm text-text-muted">
                        /{isYearly ? 'yr.' : 'mo.'}
                      </span>
                    </div>
                    {isYearly && displayPrice > 0 && (
                      <p className="mt-1 text-xs text-text-muted">
                        ${Math.round(displayPrice / 12)}/mo. billed annually
                      </p>
                    )}

                    <p className="mt-4 text-sm text-text-muted">
                      {slug === 'free'
                        ? 'Includes:'
                        : 'Everything in Free, plus:'}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <span className="text-text-muted">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    {isCurrent ? (
                      <span
                        className="inline-flex w-full items-center justify-center rounded-full text-sm font-medium bg-surface-1 text-text-muted border border-border-default cursor-default"
                        style={{ padding: '.5em 1em .52em' }}
                      >
                        Current plan
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePlanAction(slug)}
                        disabled={isLoading || isPortalLoading}
                        className={cn(
                          'w-full rounded-full text-sm font-medium transition-colors disabled:opacity-50',
                          isUpgrade
                            ? 'bg-foreground text-background hover:opacity-90'
                            : 'bg-surface-1 text-foreground hover:bg-surface-2 border border-border-default'
                        )}
                        style={{ padding: '.5em 1em .52em' }}
                      >
                        {isLoading
                          ? 'Loading...'
                          : isUpgrade
                            ? `Upgrade to ${plan.name}`
                            : `Switch to ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-text-muted">
        Stripe processing fees (2.9% + 30¢) apply to all transactions.
      </p>
    </div>
  );
}

function PaymentsFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground">
          Frequently Asked Questions
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Common questions about payments and Stripe Connect
        </p>
      </div>
      <div className="border-t border-border">
        {PAYMENTS_FAQ_ITEMS.map((item, index) => (
          <FAQAccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

export function PaymentSettings() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useQueryState(
    'onboarding',
    parseAsString.withDefault('')
  );
  const [refreshParam, setRefreshParam] = useQueryState(
    'refresh',
    parseAsString.withDefault('')
  );
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('activity')
  );

  // Optimistic state for card background
  const [optimisticCardBackground, setOptimisticCardBackground] = useState<
    string | null
  >(null);

  const {
    data: connectStatus,
    isLoading,
    refetch,
  } = useQuery(trpc.connect.getConnectStatus.queryOptions());

  // Get customer billing info for fees tab
  const { customer: billingCustomer, isLoading: isBillingLoading } =
    useCustomer();

  // Get monthly spend data for fees tab
  const { data: monthlySpendData } = useQuery(
    trpc.bounties.getMonthlySpend.queryOptions()
  );

  useHandleConnectRedirect({
    onboardingStatus,
    refreshParam,
    refetch,
    setOnboardingStatus,
    setRefreshParam,
  });

  const createAccountLink = useMutation({
    mutationFn: async () => {
      return await trpcClient.connect.createConnectAccountLink.mutate();
    },
    onSuccess: (result) => {
      if (result?.data?.url) {
        window.location.href = result.data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to start onboarding: ${error.message}`);
    },
  });

  const getDashboardLink = useMutation({
    mutationFn: async () => {
      return await trpcClient.connect.getConnectDashboardLink.mutate();
    },
    onSuccess: (result) => {
      if (result?.data?.url) {
        if (result.data.isOnboarding) {
          window.location.href = result.data.url;
        } else {
          window.open(result.data.url, '_blank');
        }
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to open dashboard: ${error.message}`);
    },
  });

  const { data: payoutHistoryResponse } = useQuery(
    trpc.connect.getPayoutHistory.queryOptions({ page: 1, limit: 10 })
  );

  const { data: balanceResponse } = useQuery(
    trpc.connect.getAccountBalance.queryOptions()
  );

  const { data: user } = useQuery(trpc.user.getMe.queryOptions());

  const queryClient = useQueryClient();

  const updateCardBackground = useMutation({
    mutationFn: async (cardBackground: string | undefined) => {
      return await trpcClient.user.updateCardBackground.mutate({
        cardBackground,
      });
    },
    onMutate: (cardBackground) => {
      // Optimistically update the UI
      setOptimisticCardBackground(cardBackground ?? null);
    },
    onSuccess: () => {
      toast.success('Card background updated');
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: trpc.user.getMe.queryOptions().queryKey,
      });
    },
    onError: (error: Error) => {
      // Revert optimistic update on error
      setOptimisticCardBackground(user?.cardBackground ?? null);
      toast.error(`Failed to update card background: ${error.message}`);
    },
  });

  const status = connectStatus?.data;
  const balance = balanceResponse?.data;
  const totalBalance = balance?.total || 0;
  const selectedCardBackground =
    optimisticCardBackground ?? user?.cardBackground ?? null;

  const handleConnect = () => {
    createAccountLink.mutate();
  };

  const handleOpenDashboard = () => {
    getDashboardLink.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const hasConnectAccount = Boolean(status?.hasConnectAccount);

  return (
    <div className="space-y-6">
      {/* Header - Exact Paper values */}
      <div className="shrink-0 flex justify-between items-start gap-0 w-full h-[121px] self-stretch overflow-clip border-b border-b-solid border-border antialiased p-0">
        {/* Left side - Title, description, badge */}
        <div className="shrink-0 flex flex-col items-start gap-2.5 p-0 size-fit">
          <div className="shrink-0 flex flex-col justify-end items-start gap-0 p-0 size-fit">
            <div className="text-[28px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
              Payments
            </div>
            <div className="text-[16px] leading-[150%] shrink-0 text-text-secondary font-['Inter',system-ui,sans-serif] font-medium size-fit">
              Manage your payment and payout preferences
            </div>
          </div>
          <Tooltip open={hasConnectAccount ? false : undefined}>
            <TooltipTrigger asChild>
              <button
                onClick={handleOpenDashboard}
                disabled={!hasConnectAccount || getDashboardLink.isPending}
                className="w-fit h-[31px] rounded-[10px] flex justify-center items-center px-3 py-0 gap-2 shrink-0 overflow-clip bg-[#474747] hover:bg-[#5A5A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <div className="text-[13px] leading-[150%] shrink-0 text-white font-['Inter',system-ui,sans-serif] font-medium size-fit">
                  Manage payments
                </div>
                <div
                  className="shrink-0 opacity-34 bg-cover bg-center origin-center size-6"
                  style={{
                    backgroundImage:
                      'url(https://workers.paper.design/file-assets/01K3599G7KDJK6C4VY51687XYK/01KDVN9JNWNME81BGYXWDT0HP9.svg)',
                    rotate: '315deg',
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>Connect your Stripe account first</TooltipContent>
          </Tooltip>
        </div>

        {/* Right side - Balance Card */}
        <BalanceCard
          balance={totalBalance}
          backgroundUrl={
            selectedCardBackground
              ? `/images/cards/${selectedCardBackground}.jpg`
              : undefined
          }
        />
      </div>

      {/* Tabs - matching roadmap page style */}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value)}
        className="space-y-6"
      >
        <div className="relative inline-flex w-fit rounded-full bg-surface-1 border border-border-subtle p-1">
          {[
            { value: 'activity', label: 'Activity' },
            { value: 'fees', label: 'Fees' },
            { value: 'settings', label: 'Settings' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                tab === item.value
                  ? 'bg-surface-3 text-foreground'
                  : 'text-text-tertiary hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Activity Tab */}
        <TabsPanel value="activity" className="space-y-6">
          <div className="shrink-0 flex flex-col justify-center items-start gap-0 w-full h-fit self-stretch p-0">
            <div className="text-[28px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
              Recent activity
            </div>
          </div>
          <PaymentActivity />
        </TabsPanel>

        {/* Fees Tab */}
        <TabsPanel value="fees" className="space-y-6">
          <FeesTabContent
            customer={billingCustomer}
            isLoading={isBillingLoading}
            monthlySpend={monthlySpendData?.data?.monthlySpend ?? 0}
            nextResetDate={monthlySpendData?.data?.nextResetDate ?? null}
            allTimeSpend={monthlySpendData?.data?.allTimeSpend ?? 0}
            allTimeBountyCount={monthlySpendData?.data?.allTimeBountyCount ?? 0}
          />
        </TabsPanel>

        {/* Settings Tab */}
        <TabsPanel value="settings" className="space-y-6">
          {/* Payouts Card - Paper design */}
          <div className="shrink-0 w-full h-fit flex flex-col items-start justify-between rounded-none opacity-100 gap-[18px] self-stretch px-[18px] py-[18px] overflow-clip border-b border-b-solid border-border">
            {/* Header */}
            <div className="shrink-0 flex flex-col justify-center items-start gap-0 w-full h-fit self-stretch p-0">
              <div className="text-[20px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
                Payouts
              </div>
            </div>

            {/* Content */}
            <div className="shrink-0 flex flex-col items-start gap-0 p-0 size-fit">
              <div className="shrink-0 flex flex-col justify-center items-start gap-0 size-fit p-0">
                <div className="text-[16px] leading-5 shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                  Stripe
                </div>
                <div className="text-[14px] leading-[150%] shrink-0 text-text-secondary font-['Inter',system-ui,sans-serif] size-fit">
                  {hasConnectAccount
                    ? status?.onboardingComplete && status?.cardPaymentsActive
                      ? 'Your account is connected and ready to receive payouts'
                      : 'Complete the verification process to start receiving payouts'
                    : 'Connect with Stripe to receive bounty payouts directly to your bank account'}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 flex justify-between items-center gap-2 w-full h-fit self-stretch p-0">
              <div className="shrink-0 flex flex-col items-start gap-0 p-0 size-fit">
                {hasConnectAccount ? (
                  status?.onboardingComplete ? (
                    <button
                      type="button"
                      onClick={handleOpenDashboard}
                      disabled={getDashboardLink.isPending}
                      className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-[5px] shrink-0 overflow-clip bg-[#533AFD] hover:bg-[#4B2DB8] disabled:opacity-50 transition-colors"
                    >
                      <ExternalLink className="shrink-0 size-4 text-white" />
                      <span className="text-[13px] leading-[150%] shrink-0 text-[#F2F2DD] font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                        {getDashboardLink.isPending
                          ? 'Loading...'
                          : 'Manage Payments'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={createAccountLink.isPending}
                      className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-[5px] shrink-0 overflow-clip bg-[#533AFD] hover:bg-[#4B2DB8] disabled:opacity-50 transition-colors"
                    >
                      <StripeDashIcon className="shrink-0 size-6 fill-white text-white" />
                      <span className="text-[13px] leading-[150%] shrink-0 text-[#F2F2DD] font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                        {createAccountLink.isPending
                          ? 'Loading...'
                          : 'Complete Onboarding'}
                      </span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={createAccountLink.isPending}
                    className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-[5px] shrink-0 overflow-clip bg-[#533AFD] hover:bg-[#4B2DB8] disabled:opacity-50 transition-colors"
                  >
                    <StripeDashIcon className="shrink-0 size-4" />
                    <span className="text-[13px] leading-[150%] shrink-0 text-[#F2F2DD] font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                      {createAccountLink.isPending
                        ? 'Connecting...'
                        : 'Connect with Stripe'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Issues Block - Only shows when there are problems */}
            {status?.hasConnectAccount && status.accountDetails && (
              <IssuesBlock
                chargesEnabled={status.accountDetails.chargesEnabled}
                detailsSubmitted={status.accountDetails.detailsSubmitted}
                payoutsEnabled={status.accountDetails.payoutsEnabled}
                cardPaymentsActive={status.cardPaymentsActive}
                requirements={status.accountDetails.requirements}
                onCompleteOnboarding={handleConnect}
              />
            )}
          </div>

          {/* Payout History */}
          {status?.hasConnectAccount && status.onboardingComplete && (
            <div className="shrink-0 w-full h-fit flex flex-col items-start justify-between rounded-none opacity-100 gap-[18px] self-stretch px-[18px] py-[18px] overflow-clip border-b border-b-solid border-border">
              <div className="text-[20px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
                Payout History
              </div>
              {payoutHistoryResponse?.data &&
              payoutHistoryResponse.data.length > 0 ? (
                <div className="space-y-2 w-full">
                  {payoutHistoryResponse.data.map(
                    (payout: {
                      id: string;
                      createdAt: string;
                      updatedAt: string;
                      userId: string;
                      status: 'pending' | 'completed' | 'failed' | 'processing';
                      amount: string;
                      stripeTransferId: string | null;
                      bountyId: string;
                    }) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium">
                            ${Number(payout.amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            payout.status === 'completed'
                              ? 'default'
                              : payout.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[14px] leading-[150%] text-text-secondary">
                    No payouts yet
                  </p>
                  <p className="text-[13px] leading-[150%] text-text-secondary">
                    Payouts appear here when you complete bounties and receive
                    payments. Find a bounty to solve and submit your solution to
                    earn your first payout.
                  </p>
                  <Link
                    href="/bounties"
                    className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground hover:opacity-80 transition-opacity"
                  >
                    Browse open bounties
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Card Background Selector */}
          <div className="flex flex-col gap-4 px-[18px] py-[18px]">
            <h3 className="text-[20px] leading-[150%] text-foreground font-['Inter',system-ui,sans-serif] font-medium">
              Card Style
            </h3>
            <p className="text-sm text-text-secondary">
              Choose a background for your payment card
            </p>
            <CardBackgroundSelector
              backgrounds={CARD_BACKGROUNDS}
              selectedBackground={selectedCardBackground}
              onSelect={(id) => updateCardBackground.mutate(id)}
            />
          </div>
        </TabsPanel>
      </Tabs>

      {/* FAQ Section */}
      <PaymentsFAQ />

      <ConnectOnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
      />
    </div>
  );
}
