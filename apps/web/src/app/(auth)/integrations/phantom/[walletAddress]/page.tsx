'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { PhantomIcon } from '@bounty/ui/components/icons/huge/phantom';
import { ExternalLink, RefreshCw, Plus, Copy } from 'lucide-react';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import {
  IntegrationDetailPage,
  IntegrationHeader,
  IntegrationTable,
  ActionButton,
  ActionButtonGroup,
  SectionHeader,
  type Column,
} from '@/components/integrations';

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface WalletRow {
  walletAddress: string;
  tokenBalance: string | null;
  tokenBalanceFormatted: string | null;
  tokenValueUsd: string | null;
  lastVerifiedAt: string | null;
}

export default function PhantomWalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.walletAddress as string;
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');

  const {
    data: walletData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['phantom.getWallet', walletAddress],
    queryFn: () => trpcClient.phantom.getWallet.query({ walletAddress }),
  });

  const syncMutation = useMutation({
    mutationFn: () => trpcClient.phantom.syncWallet.mutate({ walletAddress }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getWallet', walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      toast.success(
        `Balance updated: ${data.data.tokenBalanceFormatted || data.data.tokenBalance || '0'} $BOUNTY`
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to sync wallet');
    },
  });

  const updateDisplayNameMutation = useMutation({
    mutationFn: (displayName: string) => {
      return trpcClient.phantom.updateDisplayName.mutate({
        walletAddress,
        displayName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getWallet', walletAddress],
      });
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      toast.success('Display name updated');
      setIsEditingName(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update display name');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      trpcClient.phantom.disconnectSpecificWallet.mutate({ walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      toast.success('Wallet disconnected');
      router.push('/integrations');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to disconnect wallet');
    },
  });

  const handleDisconnect = () => {
    if (confirm('Disconnect this wallet?')) {
      disconnectMutation.mutate();
    }
  };

  const handleSaveDisplayName = useCallback(() => {
    if (displayNameInput.trim()) {
      updateDisplayNameMutation.mutate(displayNameInput.trim());
    }
  }, [displayNameInput, updateDisplayNameMutation]);

  const handleStartEditingName = useCallback(() => {
    setDisplayNameInput(walletData?.data?.displayName || '');
    setIsEditingName(true);
  }, [walletData?.data?.displayName]);

  const wallet = walletData?.data;
  const qualifies = wallet?.qualifiesForBenefits;
  const displayName = wallet?.displayName;

  const columns: Column<WalletRow>[] = [
    {
      key: 'address',
      header: 'Address',
      width: '1fr',
      render: (w) => (
        <div className="flex items-center gap-2 min-w-0">
          <PhantomIcon className="h-4 w-4 text-[#888] shrink-0" />
          <span className="truncate font-mono text-[#888]">
            {truncateAddress(w.walletAddress)}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(w.walletAddress);
              toast.success('Copied to clipboard');
            }}
            className="text-[#555] hover:text-white shrink-0"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      width: '120px',
      render: (w) => (
        <div className="text-white">
          {w.tokenBalanceFormatted || w.tokenBalance || '0'}
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      width: '100px',
      render: (w) => (
        <div className="text-white">${w.tokenValueUsd || '0.00'}</div>
      ),
    },
    {
      key: 'lastSynced',
      header: 'Last synced',
      width: '100px',
      render: (w) => (
        <div className="text-[#888]">
          {w.lastVerifiedAt
            ? new Date(w.lastVerifiedAt).toLocaleDateString()
            : 'Never'}
        </div>
      ),
    },
  ];

  const walletRows: WalletRow[] = wallet
    ? [
        {
          walletAddress,
          tokenBalance: wallet.tokenBalance,
          tokenBalanceFormatted: wallet.tokenBalanceFormatted,
          tokenValueUsd: wallet.tokenValueUsd,
          lastVerifiedAt: wallet.lastVerifiedAt,
        },
      ]
    : [];

  // Build title component with editing capability
  const titleContent = isEditingName ? (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={displayNameInput}
        onChange={(e) => setDisplayNameInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSaveDisplayName();
          }
          if (e.key === 'Escape') {
            setIsEditingName(false);
          }
        }}
        placeholder="Wallet name"
        className="bg-transparent border-b border-[#444] px-0 py-1 text-3xl font-semibold text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-white w-48"
        maxLength={50}
        autoFocus
      />
      <button
        type="button"
        onClick={handleSaveDisplayName}
        disabled={
          updateDisplayNameMutation.isPending || !displayNameInput.trim()
        }
        className="text-sm text-[#888] hover:text-white disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setIsEditingName(false)}
        className="text-sm text-[#888] hover:text-white"
      >
        Cancel
      </button>
    </div>
  ) : (
    displayName || truncateAddress(walletAddress)
  );

  return (
    <IntegrationDetailPage
      isLoading={isLoading}
      error={error as Error | null}
      errorMessage="Wallet not found."
    >
      {wallet && (
        <>
          <IntegrationHeader
            icon={<PhantomIcon className="h-8 w-8 text-white" />}
            title={titleContent}
            description="Verify your BOUNTY token holdings to unlock exclusive benefits"
            badges={
              qualifies ? [{ label: 'Qualifies', variant: 'success' }] : []
            }
          />

          <ActionButtonGroup
            dropdownActions={[
              {
                label: displayName ? 'Edit name' : 'Add name',
                onClick: handleStartEditingName,
              },
              {
                label: 'Disconnect wallet',
                variant: 'danger',
                onClick: handleDisconnect,
                disabled: disconnectMutation.isPending,
              },
            ]}
          >
            <ActionButton
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              loading={syncMutation.isPending}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Sync
            </ActionButton>
            <ActionButton
              onClick={() =>
                window.open(
                  `https://solscan.io/account/${walletAddress}`,
                  '_blank'
                )
              }
              icon={<ExternalLink className="h-4 w-4" />}
            >
              View on Solscan
            </ActionButton>
          </ActionButtonGroup>

          <div className="pt-4">
            <SectionHeader title="Wallet details" />
            <IntegrationTable
              columns={columns}
              data={walletRows}
              keyExtractor={(w) => w.walletAddress}
            />
          </div>

          <div className="pt-2">
            <SectionHeader
              title="Benefits status"
              badge={{
                label: qualifies ? 'Eligible' : 'Not eligible',
                variant: qualifies ? 'success' : 'default',
              }}
            />
            <p className="text-sm text-[#888]">
              {(() => {
                const balance = Number.parseFloat(wallet.tokenBalance || '0');
                const valueUsd = Number.parseFloat(wallet.tokenValueUsd || '0');
                const pricePerToken = balance > 0 ? valueUsd / balance : 0;
                const tokensNeeded =
                  pricePerToken > 0 ? Math.ceil(20 / pricePerToken) : null;
                const tokensNeededFormatted = tokensNeeded
                  ? tokensNeeded.toLocaleString()
                  : '~';

                if (qualifies) {
                  return `You qualify for token holder benefits! Hold $20+ in BOUNTY tokens (roughly ${tokensNeededFormatted} tokens) to maintain eligibility.`;
                }
                return `Hold $20+ in BOUNTY tokens (roughly ${tokensNeededFormatted} tokens) to unlock 1 free month of Pro and other exclusive benefits.`;
              })()}
            </p>
          </div>

          <ActionButton
            onClick={() => router.push('/integrations')}
            icon={<Plus className="h-4 w-4" />}
          >
            Add another wallet
          </ActionButton>
        </>
      )}
    </IntegrationDetailPage>
  );
}
