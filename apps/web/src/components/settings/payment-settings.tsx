'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
} from '@bounty/ui/components/tabs';
import { Badge } from '@bounty/ui/components/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@bounty/ui/components/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { ConnectOnboardingModal } from '@/components/payment/connect-onboarding-modal';
import { IssuesBlock } from './payment/issues-block';
import { BalanceCard } from './payment/balance-card';
import { StripeDashIcon } from '@bounty/ui/components/icons/huge/stripe';
import { useState, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import Image from 'next/image';
import { cn } from '@bounty/ui/lib/utils';

type ConnectStatus = {
  hasConnectAccount?: boolean;
  onboardingComplete?: boolean;
  cardPaymentsActive?: boolean;
  accountDetails?: {
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
    payoutsEnabled?: boolean;
    requirements?: unknown;
  } | null;
} | null | undefined;

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
          onClick={() => setVisibleCount((prev) => Math.min(prev + CARDS_PER_PAGE, backgrounds.length))}
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          Show {Math.min(CARDS_PER_PAGE, backgrounds.length - visibleCount)} more
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
  }, [onboardingStatus, refreshParam, refetch, setOnboardingStatus, setRefreshParam]);
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
  const [optimisticCardBackground, setOptimisticCardBackground] = useState<string | null>(null);

  const { data: connectStatus, isLoading, refetch } = useQuery(
    trpc.connect.getConnectStatus.queryOptions()
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
      return await trpcClient.user.updateCardBackground.mutate({ cardBackground });
    },
    onMutate: (cardBackground) => {
      // Optimistically update the UI
      setOptimisticCardBackground(cardBackground ?? null);
    },
    onSuccess: () => {
      toast.success('Card background updated');
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: trpc.user.getMe.queryOptions().queryKey });
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
  const selectedCardBackground = optimisticCardBackground ?? user?.cardBackground ?? null;

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
          <Tooltip open={!hasConnectAccount ? undefined : false}>
            <TooltipTrigger>
              <button
                onClick={handleOpenDashboard}
                disabled={!hasConnectAccount || getDashboardLink.isPending}
                className="w-fit h-[31px] rounded-[10px] flex justify-center items-center px-3 py-0 gap-2 shrink-0 overflow-clip bg-[#474747] hover:bg-[#5A5A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <div className="text-[13px] leading-[150%] shrink-0 text-white font-['Inter',system-ui,sans-serif] font-medium size-fit">
                  Manage payments
                </div>
                <div className="shrink-0 opacity-34 bg-cover bg-center origin-center size-6"
                  style={{
                    backgroundImage: 'url(https://workers.paper.design/file-assets/01K3599G7KDJK6C4VY51687XYK/01KDVN9JNWNME81BGYXWDT0HP9.svg)',
                    rotate: '315deg'
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Connect your Stripe account first
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right side - Balance Card */}
        <BalanceCard
          balance={totalBalance}
          backgroundUrl={selectedCardBackground ? `/images/cards/${selectedCardBackground}.jpg` : undefined}
        />
      </div>

      {/* Tabs - Exact Paper values */}
      <Tabs value={tab} onValueChange={(value) => setTab(value)} className="space-y-6">
        <TabsList
          variant="underline"
          className="w-fit h-8 rounded-[10px] flex justify-center items-center pl-0.5 pr-[9px] gap-[13px] shrink-0 overflow-clip bg-surface-1 py-0.5"
        >
          <TabsTab value="activity">Activity</TabsTab>
          <TabsTab value="fees">Fees</TabsTab>
          <TabsTab value="settings">Settings</TabsTab>
        </TabsList>

        {/* Activity Tab */}
        <TabsPanel value="activity" className="space-y-4">
          <div className="shrink-0 flex flex-col justify-center items-start gap-0 w-full h-fit self-stretch p-0">
            <div className="text-[28px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
              Recent activity
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Activity tab coming soon...
          </p>
        </TabsPanel>

        {/* Fees Tab */}
        <TabsPanel value="fees" className="space-y-4">
          <h2 className="text-[28px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-medium size-fit">
            Fees
          </h2>
          <p className="text-muted-foreground text-sm">
            Fee information coming soon...
          </p>
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
                    : 'Connect with Stripe to receive bounty payouts directly to your bank account'
                  }
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0 flex justify-between items-center gap-2 w-full h-fit self-stretch p-0">
              <div className="shrink-0 flex flex-col items-start gap-0 p-0 size-fit">
                {!hasConnectAccount ? (
                  <button
                    onClick={handleConnect}
                    disabled={createAccountLink.isPending}
                    className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-[5px] shrink-0 overflow-clip bg-[#533AFD] hover:bg-[#4B2DB8] disabled:opacity-50 transition-colors"
                  >
                    <StripeDashIcon className="shrink-0 size-4" />
                    <span className="text-[13px] leading-[150%] shrink-0 text-[#F2F2DD] font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                      {createAccountLink.isPending ? 'Connecting...' : 'Connect with Stripe'}
                    </span>
                  </button>
                ) : !status?.onboardingComplete ? (
                  <button
                    onClick={handleConnect}
                    disabled={createAccountLink.isPending}
                    className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-[5px] shrink-0 overflow-clip bg-[#533AFD] hover:bg-[#4B2DB8] disabled:opacity-50 transition-colors"
                  >
                    <StripeDashIcon className="shrink-0 size-6 fill-white text-white" />
                    <span className="text-[13px] leading-[150%] shrink-0 text-[#F2F2DD] font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                      {createAccountLink.isPending ? 'Loading...' : 'Complete Onboarding'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenDashboard}
                    disabled={getDashboardLink.isPending}
                    className="w-fit h-[35px] rounded-[7px] flex justify-center items-center px-[18px] py-0 gap-2 shrink-0 overflow-clip border border-solid border-border bg-transparent hover:bg-surface-1 disabled:opacity-50 transition-colors"
                  >
                    <ExternalLink className="shrink-0 size-4 text-foreground" />
                    <span className="text-[13px] leading-[150%] shrink-0 text-foreground font-['Inter',system-ui,sans-serif] font-semibold size-fit">
                      {getDashboardLink.isPending ? 'Loading...' : 'Open Dashboard'}
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
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {payoutHistoryResponse?.data && payoutHistoryResponse.data.length > 0 ? (
                  <div className="space-y-2">
                    {payoutHistoryResponse.data.map((payout: {
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
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No payouts yet. Complete a bounty to receive your first payout!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Background Selector */}
          <div className="flex flex-col gap-4 px-[18px] py-[18px] border-b border-b-solid border-border">
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

      <ConnectOnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
      />
    </div>
  );
}
