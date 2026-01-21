'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { PhantomIcon } from '@bounty/ui/components/icons/huge/phantom';
import { Spinner } from '@bounty/ui/components/spinner';
import { Logo } from '@/components/landing/logo';
import { useBilling } from '@/hooks/use-billing';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import bs58 from 'bs58';

interface PhantomProvider {
  isPhantom: boolean;
  publicKey: { toString: () => string } | null;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    display: string
  ) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}

interface SolClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ClaimStep =
  | 'loading'
  | 'already_pro'
  | 'connect'
  | 'insufficient'
  | 'ready'
  | 'claimed';

// Shared wallet info display
function WalletInfo({
  walletAddress,
  tokenBalanceFormatted,
  tokenValueUsd,
}: {
  walletAddress?: string;
  tokenBalanceFormatted?: string;
  tokenValueUsd?: string;
}) {
  const truncateAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-[#666]">Wallet</span>
        <span className="text-[#888] font-mono">
          {walletAddress ? truncateAddress(walletAddress) : '-'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#666]">Balance</span>
        <span className="text-white">
          {tokenBalanceFormatted || '0'} $BOUNTY
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#666]">Value</span>
        <span className="text-white">${tokenValueUsd || '0.00'}</span>
      </div>
    </div>
  );
}

// Pro badge component
function ProBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414]">
      <Logo className="h-4 w-4" />
      <span className="text-sm font-medium text-white">Bounty Pro</span>
      <span className="text-xs text-[#666]">{label}</span>
    </div>
  );
}

// Step: Loading
function LoadingStep() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="size-5 text-[#444]" />
    </div>
  );
}

// Step: Already Pro
function AlreadyProStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-3">
          <ProBadge label="Active" />
        </div>
        <p className="text-sm text-[#888]">
          You already have an active Pro subscription.
        </p>
      </div>
      <Button
        onClick={onClose}
        className="w-full bg-white text-black hover:bg-[#e5e5e5] rounded-full"
      >
        Close
      </Button>
    </div>
  );
}

// Step: Connect Wallet
function ConnectStep({
  isConnecting,
  phantomInstalled,
  threshold,
  onConnect,
}: {
  isConnecting: boolean;
  phantomInstalled: boolean | null;
  threshold: number;
  onConnect: () => void;
}) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onConnect}
        disabled={isConnecting}
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#111] hover:bg-[#161616] transition-colors text-left"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1a1a1a]">
          <PhantomIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {isConnecting ? 'Connecting...' : 'Connect Phantom'}
          </p>
          <p className="text-xs text-[#666]">Verify token holdings</p>
        </div>
        {isConnecting && <Spinner className="size-4 text-[#444]" />}
      </button>

      {phantomInstalled === false && (
        <a
          href="https://phantom.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-[#666] hover:text-white transition-colors"
        >
          Install Phantom
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <p className="text-xs text-center text-[#555]">
        Hold ${threshold}+ in $BOUNTY to qualify
      </p>
    </div>
  );
}

// Step: Insufficient Balance
function InsufficientStep({
  walletAddress,
  tokenBalanceFormatted,
  tokenValueUsd,
  threshold,
  isRefreshing,
  onRefresh,
}: {
  walletAddress?: string;
  tokenBalanceFormatted?: string;
  tokenValueUsd?: string;
  threshold: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-5">
      <WalletInfo
        walletAddress={walletAddress}
        tokenBalanceFormatted={tokenBalanceFormatted}
        tokenValueUsd={tokenValueUsd}
      />

      <div className="py-3 px-4 rounded-lg bg-[#111] text-center">
        <p className="text-sm text-[#888]">
          Need <span className="text-white">${threshold}+</span> to qualify
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="flex-1 border-[#222] bg-transparent hover:bg-[#111] rounded-full text-sm"
        >
          {isRefreshing ? 'Checking...' : 'Refresh'}
        </Button>
        <a
          href="https://phantom.com/tokens/solana/GZj4qMQFtwPpStknSaisn7shPJJ7Dv7wsuksEborBAGS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button className="w-full bg-white text-black hover:bg-[#e5e5e5] rounded-full text-sm">
            Buy $BOUNTY
          </Button>
        </a>
      </div>
    </div>
  );
}

// Step: Ready to Claim
function ReadyStep({
  walletAddress,
  tokenBalanceFormatted,
  tokenValueUsd,
  isClaiming,
  onClaim,
}: {
  walletAddress?: string;
  tokenBalanceFormatted?: string;
  tokenValueUsd?: string;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  return (
    <div className="space-y-5">
      <WalletInfo
        walletAddress={walletAddress}
        tokenBalanceFormatted={tokenBalanceFormatted}
        tokenValueUsd={tokenValueUsd}
      />

      <div className="flex items-center gap-3 py-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#111]">
          <Logo className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Bounty Pro</p>
          <p className="text-xs text-[#666]">1 month free</p>
        </div>
        <span className="text-sm text-[#888]">$25 value</span>
      </div>

      <Button
        onClick={onClaim}
        disabled={isClaiming}
        className="w-full bg-white text-black hover:bg-[#e5e5e5] rounded-full"
      >
        {isClaiming ? (
          <>
            <Spinner className="size-4 mr-2" />
            Claiming...
          </>
        ) : (
          'Claim Pro Access'
        )}
      </Button>
    </div>
  );
}

// Step: Claimed (benefit already used)
function ClaimedStep({
  onClose,
  isPro,
  onReset,
  isResetting,
}: {
  onClose: () => void;
  isPro: boolean;
  onReset?: () => void;
  isResetting?: boolean;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isPro) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-3">
            <ProBadge label="Active" />
          </div>
          <p className="text-sm text-[#888]">Your free month is now active.</p>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-white text-black hover:bg-[#e5e5e5] rounded-full"
        >
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-3">
          <ProBadge label="Expired" />
        </div>
        <p className="text-sm text-[#888]">
          You&apos;ve already claimed your free month.
        </p>
        <p className="text-xs text-[#555] mt-1">
          This benefit can only be used once per account.
        </p>
      </div>

      <Button
        onClick={onClose}
        className="w-full bg-white text-black hover:bg-[#e5e5e5] rounded-full"
      >
        Close
      </Button>

      {isDev && onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="w-full text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          {isResetting ? 'Resetting...' : '[Dev] Reset Claim'}
        </button>
      )}
    </div>
  );
}

export function SolClaimDialog({ open, onOpenChange }: SolClaimDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ClaimStep>('loading');
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState<boolean | null>(
    null
  );

  const {
    isPro,
    isLoading: isBillingLoading,
    refetch: refetchBilling,
  } = useBilling();

  useEffect(() => {
    if (open) {
      refetchBilling();
    }
  }, [open, refetchBilling]);

  useEffect(() => {
    const checkPhantom = () => {
      const provider = window.phantom?.solana;
      setPhantomInstalled(!!provider?.isPhantom);
    };
    checkPhantom();
    const timeout = setTimeout(checkPhantom, 500);
    return () => clearTimeout(timeout);
  }, []);

  const { data: connectionStatus, isLoading: isLoadingStatus } = useQuery({
    ...trpc.phantom.getConnectionStatus.queryOptions(),
    enabled: open,
  });

  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery({
    ...trpc.phantom.checkEligibility.queryOptions(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isBillingLoading || isLoadingStatus || isLoadingEligibility) {
      setStep('loading');
      return;
    }

    if (isPro) {
      setStep('already_pro');
      return;
    }

    const isConnected = connectionStatus?.data?.connected;
    const qualifies = eligibility?.data?.eligible;
    const alreadyClaimed = eligibility?.data?.alreadyClaimed;

    if (alreadyClaimed) {
      setStep('claimed');
      return;
    }

    if (isConnected && qualifies) {
      setStep('ready');
    } else if (isConnected) {
      setStep('insufficient');
    } else {
      setStep('connect');
    }
  }, [
    open,
    isBillingLoading,
    isLoadingStatus,
    isLoadingEligibility,
    isPro,
    connectionStatus,
    eligibility,
  ]);

  const generateMessage = useMutation({
    mutationFn: (walletAddress: string) =>
      trpcClient.phantom.generateVerificationMessage.mutate({
        walletAddress,
      }),
  });

  const connectWallet = useMutation({
    mutationFn: (params: {
      walletAddress: string;
      signature: string;
      message: string;
    }) => trpcClient.phantom.connectWallet.mutate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: ['phantom.checkEligibility'],
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to connect wallet');
    },
  });

  const refreshBalance = useMutation({
    mutationFn: () => trpcClient.phantom.refreshBalance.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });
    },
  });

  const claimFreeMonth = useMutation({
    mutationFn: () =>
      trpcClient.phantom.claimFreeMonth.mutate({
        origin: window.location.origin,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });

      if ('checkoutUrl' in data && data.checkoutUrl) {
        toast.success('Redirecting to complete your free subscription...');
        window.location.href = data.checkoutUrl;
        return;
      }

      setStep('claimed');
      toast.success('Pro activated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to claim');
    },
  });

  const resetClaim = useMutation({
    mutationFn: () => trpcClient.phantom.resetFreeMonthClaim.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });
      refetchBilling();
      setStep('loading');
      toast.success('Claim reset - you can claim again');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset claim');
    },
  });

  const handleConnect = useCallback(async () => {
    const provider = window.phantom?.solana;

    if (!provider?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      const { publicKey } = await provider.connect();
      const walletAddress = publicKey.toString();

      const messageResult = await generateMessage.mutateAsync(walletAddress);
      const message = messageResult.data.message;

      const messageBytes = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(messageBytes, 'utf8');
      const signatureBase58 = bs58.encode(signature);

      await connectWallet.mutateAsync({
        walletAddress,
        signature: signatureBase58,
        message,
      });

      await refreshBalance.mutateAsync();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect wallet';
      if (!errorMessage.includes('User rejected')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [generateMessage, connectWallet, refreshBalance]);

  const walletAddress =
    connectionStatus?.data?.wallets?.[0]?.walletAddress ?? undefined;
  const tokenValueUsd =
    connectionStatus?.data?.wallets?.[0]?.tokenValueUsd ?? undefined;
  const tokenBalanceFormatted =
    connectionStatus?.data?.wallets?.[0]?.tokenBalanceFormatted ?? undefined;
  const threshold = eligibility?.data?.threshold ?? 20;

  const handleClose = () => onOpenChange(false);

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return <LoadingStep />;
      case 'already_pro':
        return <AlreadyProStep onClose={handleClose} />;
      case 'connect':
        return (
          <ConnectStep
            isConnecting={isConnecting}
            phantomInstalled={phantomInstalled}
            threshold={threshold}
            onConnect={handleConnect}
          />
        );
      case 'insufficient':
        return (
          <InsufficientStep
            walletAddress={walletAddress}
            tokenBalanceFormatted={tokenBalanceFormatted}
            tokenValueUsd={tokenValueUsd}
            threshold={threshold}
            isRefreshing={refreshBalance.isPending}
            onRefresh={() => refreshBalance.mutate()}
          />
        );
      case 'ready':
        return (
          <ReadyStep
            walletAddress={walletAddress}
            tokenBalanceFormatted={tokenBalanceFormatted}
            tokenValueUsd={tokenValueUsd}
            isClaiming={claimFreeMonth.isPending}
            onClaim={() => claimFreeMonth.mutate()}
          />
        );
      case 'claimed':
        return (
          <ClaimedStep
            onClose={handleClose}
            isPro={isPro}
            onReset={() => resetClaim.mutate()}
            isResetting={resetClaim.isPending}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm !border-0 !border-none bg-[#0a0a0a] !p-0 gap-0 shadow-2xl">
        <div className="p-6 pb-2 text-center">
          <p className="text-xs text-[#666] mb-1 uppercase tracking-wide">
            Token Holder Benefit
          </p>
          <h2 className="text-lg font-medium text-white">
            Claim Free Pro Month
          </h2>
        </div>

        <div className="p-6 pt-4">{renderContent()}</div>

        {(step === 'connect' || step === 'ready') && (
          <div className="px-6 pb-5">
            <p className="text-[11px] text-center text-[#444]">
              No gas fees. Just sign to verify ownership.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
