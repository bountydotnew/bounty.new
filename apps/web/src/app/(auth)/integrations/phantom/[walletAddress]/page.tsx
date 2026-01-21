'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { PhantomIcon } from '@bounty/ui/components/icons/huge/phantom';
import { ExternalLink, RefreshCw, ArrowLeft, Loader2, MoreVertical, Check } from 'lucide-react';
import { trpcClient } from '@/utils/trpc';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { toast } from 'sonner';

export default function PhantomWalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.walletAddress as string;
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');

  const { data: walletData, isLoading, error } = useQuery({
    queryKey: ['phantom.getWallet', walletAddress],
    queryFn: () => trpcClient.phantom.getWallet.query({ walletAddress }),
  });

  const syncMutation = useMutation({
    mutationFn: () => trpcClient.phantom.syncWallet.mutate({ walletAddress }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phantom.getWallet', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['phantom.getConnectionStatus'] });
      toast.success(`Balance updated: ${data.data.tokenBalanceFormatted || data.data.tokenBalance || '0'} $BOUNTY`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync wallet');
    },
  });

  const updateDisplayNameMutation = useMutation({
    mutationFn: (displayName: string) => {
      return trpcClient.phantom.updateDisplayName.mutate({ walletAddress, displayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom.getWallet', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['phantom.getConnectionStatus'] });
      toast.success('Display name updated');
      setIsEditingName(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update display name');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => trpcClient.phantom.disconnectSpecificWallet.mutate({ walletAddress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom.getConnectionStatus'] });
      toast.success('Wallet disconnected');
      router.push('/integrations');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect wallet');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#5A5A5A]" />
      </div>
    );
  }

  if (error || !walletData?.data) {
    return (
      <div className="space-y-4">
        <Link href="/integrations" className="inline-flex items-center gap-1.5 text-sm text-[#5A5A5A] hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          Integrations
        </Link>
        <p className="text-sm text-[#5A5A5A]">Wallet not found.</p>
      </div>
    );
  }

  const wallet = walletData.data;
  const qualifies = wallet.qualifiesForBenefits;
  const displayName = wallet.displayName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PhantomIcon className="h-5 w-5 text-white" />
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDisplayName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                placeholder="Wallet name"
                className="bg-[#232323] border border-[#2A2A2A] rounded px-2 py-1 text-sm text-white placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#3A3A3A] w-32"
                maxLength={50}
                autoFocus
              />
              <button
                onClick={handleSaveDisplayName}
                disabled={updateDisplayNameMutation.isPending || !displayNameInput.trim()}
                className="text-[#5A5A5A] hover:text-white disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="text-[#5A5A5A] hover:text-white"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium">
                {displayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </span>
              <button
                onClick={handleStartEditingName}
                className="text-xs text-[#5A5A5A] hover:text-white"
              >
                {displayName ? 'Edit' : 'Name'}
              </button>
            </>
          )}
          {qualifies && (
            <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400">
              Qualifies
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="h-7 px-2 rounded hover:bg-[#232323] text-[#5A5A5A] hover:text-white transition-colors"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            className="h-7 px-2 rounded hover:bg-[#232323] text-[#5A5A5A] hover:text-white transition-colors"
            onClick={() => window.open(`https://solscan.io/account/${walletAddress}`, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 px-2 rounded hover:bg-[#232323] text-[#5A5A5A] hover:text-white transition-colors">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#191919] border-[#232323] min-w-[140px]">
              <DropdownMenuItem
                className="text-xs text-red-400 focus:text-red-400 focus:bg-[#232323]"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Balance Card */}
      <div className="relative rounded-2xl border border-[#2E2E2E] bg-[#191919] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A] mb-1">
                Current balance
              </p>
              <p className="text-2xl font-semibold tracking-tight text-white">
                {wallet.tokenBalanceFormatted || wallet.tokenBalance || '0'}
                <span className="text-base text-[#5A5A5A] ml-1 font-normal">$BOUNTY</span>
              </p>
              {wallet.tokenValueUsd && (
                <p className="text-sm text-[#5A5A5A] mt-0.5">
                  ${wallet.tokenValueUsd} USD
                </p>
              )}
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#232323]">
              <PhantomIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#5A5A5A]">Status</p>
          <p className="text-sm">
            {qualifies ? 'Eligible for benefits' : 'Below threshold'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#5A5A5A]">Last synced</p>
          <p className="text-sm">
            {wallet.lastVerifiedAt ? new Date(wallet.lastVerifiedAt).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}
