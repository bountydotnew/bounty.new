'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PhantomIcon } from '@bounty/ui/components/icons/huge/phantom';
import { Button } from '@bounty/ui/components/button';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { trpc, trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import {
  IntegrationDetailPage,
  IntegrationHeader,
  IntegrationTable,
  type Column,
} from '@/components/integrations';

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface Wallet {
  walletAddress: string;
  displayName: string | null;
  tokenBalance: string | null;
  tokenBalanceFormatted: string | null;
  tokenValueUsd: string | null;
  qualifiesForBenefits: boolean;
}

export default function PhantomAllWalletsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: connectionStatus, isLoading } = useQuery(
    trpc.phantom.getConnectionStatus.queryOptions()
  );

  const disconnectMutation = useMutation({
    mutationFn: (walletAddress: string) =>
      trpcClient.phantom.disconnectSpecificWallet.mutate({ walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: [['phantom', 'getConnectionStatus']],
      });
      toast.success('Wallet disconnected');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to disconnect wallet');
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: () => trpcClient.phantom.syncAllWallets.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: [['phantom', 'getConnectionStatus']],
      });
      toast.success('All wallets synced');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to sync wallets');
    },
  });

  const syncWalletMutation = useMutation({
    mutationFn: (walletAddress: string) =>
      trpcClient.phantom.syncWallet.mutate({ walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: [['phantom', 'getConnectionStatus']],
      });
      toast.success('Wallet synced');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to sync wallet');
    },
  });

  const handleDisconnect = (walletAddress: string) => {
    if (confirm('Disconnect this wallet?')) {
      disconnectMutation.mutate(walletAddress);
    }
  };

  const wallets = (connectionStatus?.data?.wallets || []) as Wallet[];

  const columns: Column<Wallet>[] = [
    {
      key: 'name',
      header: 'Wallet',
      width: '1fr',
      render: (wallet) => (
        <Link
          href={`/integrations/phantom/${wallet.walletAddress}`}
          className="flex items-center gap-3 min-w-0 hover:opacity-80"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#232323] shrink-0">
            <PhantomIcon className="w-4 h-4 text-white" />
          </div>
          <span className="truncate text-white">
            {wallet.displayName || truncateAddress(wallet.walletAddress)}
          </span>
        </Link>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      width: '150px',
      render: (wallet) => (
        <div className="text-[#888]">
          {wallet.tokenBalanceFormatted || wallet.tokenBalance || '0'} $BOUNTY
          {wallet.tokenValueUsd && (
            <span className="text-[#555]"> (${wallet.tokenValueUsd})</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (wallet) =>
        wallet.qualifiesForBenefits ? (
          <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400">
            Qualifies
          </span>
        ) : (
          <span className="text-[#555]">-</span>
        ),
    },
  ];

  return (
    <IntegrationDetailPage isLoading={isLoading}>
      <IntegrationHeader
        icon={<PhantomIcon className="h-8 w-8 text-white" />}
        title="Phantom Wallets"
        description="Manage your connected Solana wallets"
        actions={
          wallets.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncAllMutation.isPending ? 'animate-spin' : ''}`}
              />
              {syncAllMutation.isPending ? 'Syncing...' : 'Sync All'}
            </Button>
          ) : undefined
        }
      />

      {wallets.length === 0 ? (
        <div className="rounded-lg border border-[#2a2a2a] p-6 text-center">
          <p className="text-sm text-[#888]">No wallets connected</p>
          <Link
            href="/integrations"
            className="inline-block mt-4 text-sm text-white hover:underline"
          >
            Connect a wallet
          </Link>
        </div>
      ) : (
        <IntegrationTable
          columns={columns}
          data={wallets}
          keyExtractor={(wallet) => wallet.walletAddress}
          rowActions={[
            {
              label: 'View details',
              onClick: (wallet) =>
                router.push(`/integrations/phantom/${wallet.walletAddress}`),
            },
            {
              label: 'Sync balance',
              onClick: (wallet) =>
                syncWalletMutation.mutate(wallet.walletAddress),
              disabled: syncWalletMutation.isPending,
            },
            {
              label: 'Unlink wallet',
              variant: 'danger',
              onClick: (wallet) => handleDisconnect(wallet.walletAddress),
              disabled: disconnectMutation.isPending,
            },
          ]}
        />
      )}
    </IntegrationDetailPage>
  );
}
