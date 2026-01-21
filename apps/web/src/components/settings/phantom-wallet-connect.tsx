'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { Button } from '@bounty/ui/components/button';
import { PhantomIcon } from '@bounty/ui/components/icons/huge/phantom';
import { Spinner } from '@bounty/ui/components/spinner';
import { toast } from 'sonner';
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

// Base58 encoding for signature
const encodeBase58 = (bytes: Uint8Array): string => {
  return bs58.encode(bytes);
};

export function PhantomWalletConnect() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState<boolean | null>(
    null
  );

  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantom = () => {
      const provider = window.phantom?.solana;
      setPhantomInstalled(!!provider?.isPhantom);
    };

    // Check immediately
    checkPhantom();

    // Also check after a short delay for slow loads
    const timeout = setTimeout(checkPhantom, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Get connection status
  const { data: connectionStatus, isLoading: isLoadingStatus } = useQuery(
    trpc.phantom.getConnectionStatus.queryOptions()
  );

  // Get eligibility status
  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery(
    trpc.phantom.checkEligibility.queryOptions()
  );

  // Generate verification message mutation
  const generateMessage = useMutation({
    mutationFn: async () => (walletAddress: string) => {
      return trpcClient.phantom.generateVerificationMessage.mutate({
        walletAddress,
      });
    },
  });

  // Connect wallet mutation
  const connectWallet = useMutation({
    mutationFn:
      async () =>
      (params: {
        walletAddress: string;
        signature: string;
        message: string;
      }) => {
        return trpcClient.phantom.connectWallet.mutate(params);
      },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: ['phantom.checkEligibility'],
      });
      toast.success('Wallet connected successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to connect wallet');
    },
  });

  // Disconnect wallet mutation
  const disconnectWallet = useMutation({
    mutationFn: async () => () => {
      return trpcClient.phantom.disconnectWallet.mutate();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });
      toast.success('Wallet disconnected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disconnect wallet');
    },
  });

  // Refresh balance mutation
  const refreshBalance = useMutation({
    mutationFn: async () => () => {
      return trpcClient.phantom.refreshBalance.mutate();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });
      toast.success(
        `Balance refreshed: $${data.data.tokenValueUsd} in BOUNTY tokens`
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to refresh balance');
    },
  });

  // Claim free month mutation
  const claimFreeMonth = useMutation({
    mutationFn: async () => () => {
      return trpcClient.phantom.claimFreeMonth.mutate();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phantom'] });
      toast.success('Free month of Pro activated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to claim free month');
    },
  });

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    const provider = window.phantom?.solana;

    if (!provider?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // Connect to Phantom
      const { publicKey } = await provider.connect();
      const walletAddress = publicKey.toString();

      // Generate verification message
      const messageResult = await generateMessage.mutateAsync(walletAddress);
      const message = messageResult.data.message;

      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(messageBytes, 'utf8');

      // Convert signature to base58
      const signatureBase58 = encodeBase58(signature);

      // Connect wallet with signature
      await connectWallet.mutateAsync({
        walletAddress,
        signature: signatureBase58,
        message,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect wallet';
      // Don't show error if user rejected the connection
      if (!errorMessage.includes('User rejected')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [generateMessage, connectWallet]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(async () => {
    const provider = window.phantom?.solana;

    try {
      // Disconnect from Phantom
      if (provider?.isPhantom) {
        await provider.disconnect();
      }

      // Disconnect from our backend
      await disconnectWallet.mutateAsync();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to disconnect wallet';
      toast.error(errorMessage);
    }
  }, [disconnectWallet]);

  const isLoading = isLoadingStatus || isLoadingEligibility;
  const isConnected = connectionStatus?.data?.connected;
  const walletAddress = connectionStatus?.data?.wallets?.[0]?.walletAddress;
  const tokenValueUsd = connectionStatus?.data?.wallets?.[0]?.tokenValueUsd;
  const qualifiesForBenefits = eligibility?.data?.eligible;
  const alreadyClaimed = eligibility?.data?.alreadyClaimed;
  const threshold = eligibility?.data?.threshold ?? 20;

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {isConnected && walletAddress ? (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#191919] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#232323]">
                <PhantomIcon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {truncateAddress(walletAddress)}
                </p>
                <p className="text-xs text-[#929292]">Connected</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectWallet.isPending}
              className="text-[#929292] hover:text-white"
            >
              {disconnectWallet.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </div>

          {/* Token Balance */}
          <div className="rounded-lg bg-[#232323] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#929292]">BOUNTY Token Value</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshBalance.mutate()}
                disabled={refreshBalance.isPending}
                className="text-xs text-[#929292] hover:text-white h-auto py-1 px-2"
              >
                {refreshBalance.isPending ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
            <p className="text-2xl font-bold text-white">
              ${tokenValueUsd || '0.00'}
            </p>
            <p className="text-xs text-[#929292]">
              {qualifiesForBenefits
                ? 'You qualify for token holder benefits!'
                : `Hold $${threshold}+ to qualify for 1 free month of Pro`}
            </p>
          </div>

          {/* Claim Free Month Button */}
          {qualifiesForBenefits && !alreadyClaimed && (
            <Button
              onClick={() => claimFreeMonth.mutate()}
              disabled={claimFreeMonth.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {claimFreeMonth.isPending
                ? 'Claiming...'
                : 'Claim 1 Free Month of Pro'}
            </Button>
          )}

          {alreadyClaimed && (
            <div className="rounded-lg bg-green-900/20 border border-green-800/30 p-3">
              <p className="text-sm text-green-400">
                You've already claimed your free month of Pro. Thank you for
                being a token holder!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#2E2E2E] bg-[#191919] p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-[#232323]">
              <PhantomIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Connect Phantom Wallet
              </p>
              <p className="text-xs text-[#929292]">
                Connect your Solana wallet to verify token holdings
              </p>
            </div>
          </div>

          {/* Benefits Info */}
          <div className="rounded-lg bg-[#232323] p-3 space-y-2">
            <p className="text-sm font-medium text-white">
              Token Holder Benefits
            </p>
            <ul className="text-xs text-[#929292] space-y-1">
              <li>
                Hold ${threshold}+ in BOUNTY tokens to get 1 free month of Pro
              </li>
              <li>Verify ownership with a simple wallet signature</li>
              <li>No gas fees required</li>
            </ul>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Spinner className="size-4 mr-2" />
                Connecting...
              </>
            ) : phantomInstalled === false ? (
              'Install Phantom'
            ) : (
              'Connect Phantom'
            )}
          </Button>

          {phantomInstalled === false && (
            <p className="text-xs text-center text-[#929292]">
              Phantom wallet not detected. Click above to install.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
