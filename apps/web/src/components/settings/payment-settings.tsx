'use client';

import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc, trpcClient } from '@/utils/trpc';
import { ConnectOnboardingModal } from '@/components/payment/connect-onboarding-modal';
import { IssuesBlock } from './payment/issues-block';
import { AccountBalance } from './payment/account-balance';
import { useState, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';

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

function getConnectStatusMessage(status: ConnectStatus, hasConnectAccount: boolean): string {
  if (!hasConnectAccount) {
    return 'Connect your Stripe account to receive bounty payouts directly to your bank account';
  }
  if (status?.onboardingComplete && status?.cardPaymentsActive) {
    return 'Your account is set up and ready to receive payouts. Click "Open Stripe Express Dashboard" to manage your account, view payouts, and update bank details.';
  }
  return 'Complete the verification process to start receiving payouts';
}

function ConnectActionButtons({
  hasConnectAccount,
  onboardingComplete,
  createAccountLinkPending,
  getDashboardLinkPending,
  onConnect,
  onOpenDashboard,
}: {
  hasConnectAccount: boolean;
  onboardingComplete?: boolean;
  createAccountLinkPending: boolean;
  getDashboardLinkPending: boolean;
  onConnect: () => void;
  onOpenDashboard: () => void;
}) {
  if (!hasConnectAccount) {
    return (
      <Button onClick={onConnect} disabled={createAccountLinkPending}>
        {createAccountLinkPending ? 'Loading...' : 'Connect with Stripe'}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {!onboardingComplete && (
        <Button onClick={onConnect} disabled={createAccountLinkPending}>
          {createAccountLinkPending ? 'Loading...' : 'Complete Onboarding'}
        </Button>
      )}
      {onboardingComplete && (
        <Button
          variant="outline"
          onClick={onOpenDashboard}
          disabled={getDashboardLinkPending}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {getDashboardLinkPending ? 'Loading...' : 'Open Stripe Dashboard'}
        </Button>
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
          // Redirect to onboarding if Stripe requires it
          window.location.href = result.data.url;
        } else {
          // Open dashboard in new tab if onboarding is complete
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

  const status = connectStatus?.data;

  const getStatusBadge = () => {
    if (!status?.hasConnectAccount) {
      return <Badge variant="secondary">Not connected</Badge>;
    }
    if (status.onboardingComplete && status.cardPaymentsActive) {
      return <Badge variant="default" className="bg-green-600">Ready to receive payouts</Badge>;
    }
    if (!status.onboardingComplete) {
      return <Badge variant="outline">Pending verification</Badge>;
    }
    return <Badge variant="secondary">Setup incomplete</Badge>;
  };

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
  const statusMessage = getConnectStatusMessage(status, hasConnectAccount);

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-base">Stripe Connect Status</span>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground text-sm">{statusMessage}</p>
            </div>
          </div>

          <ConnectActionButtons
            hasConnectAccount={hasConnectAccount}
            onboardingComplete={status?.onboardingComplete}
            createAccountLinkPending={createAccountLink.isPending}
            getDashboardLinkPending={getDashboardLink.isPending}
            onConnect={handleConnect}
            onOpenDashboard={handleOpenDashboard}
          />

          {/* Account Balance - Only shows for bounty solvers with pending balance */}
          {status?.hasConnectAccount && <AccountBalance />}

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
        </CardContent>
      </Card>

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

      <ConnectOnboardingModal
        open={showOnboardingModal}
        onOpenChange={setShowOnboardingModal}
      />
    </div>
  );
}
