import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import bs58 from 'bs58';
import { toast } from 'sonner';

export interface PhantomWallet {
  walletAddress: string;
  displayName?: string | null;
  tokenBalance?: string | null;
  tokenBalanceFormatted?: string | null;
  tokenValueUsd?: string | null;
  qualifiesForBenefits?: boolean;
  lastVerifiedAt?: string | null;
}

export interface GitHubInstallation {
  id: number;
  accountLogin?: string | null;
  accountType?: string | null;
  repositoryIds?: string[] | null;
  isDefault?: boolean;
}

export interface DiscordAccount {
  discordId: string;
  username: string | null;
  globalName: string | null;
  displayName: string;
  avatar: string | null;
  linkedAt: string | null;
}

export interface IntegrationsState {
  // Loading states
  isLoading: boolean;
  isGitHubLoading: boolean;
  isPhantomLoading: boolean;
  isDiscordLoading: boolean;

  // GitHub installations
  githubInstallations: GitHubInstallation[];
  githubInstallUrl?: string;
  hasGitHub: boolean;

  // Phantom wallets
  phantomWallets: PhantomWallet[];
  hasPhantom: boolean;

  // Discord
  discordAccount: DiscordAccount | null;
  discordBotInstallUrl?: string;
  hasDiscord: boolean;

  // Combined
  totalCount: number;
}

export interface IntegrationsActions {
  // GitHub actions
  refreshGitHub: () => void;
  invalidateGitHub: () => void;

  // Phantom actions
  connectPhantom: () => Promise<boolean>;
  disconnectPhantom: (walletAddress: string) => Promise<void>;
  syncPhantom: (walletAddress: string) => Promise<void>;
  refreshPhantom: () => void;
  invalidatePhantom: () => void;

  // Discord actions
  addDiscordBot: () => void;
  linkDiscord: () => Promise<void>;
  unlinkDiscord: () => Promise<void>;
  refreshDiscord: () => void;

  // Global refresh
  refreshAll: () => void;
  invalidateAll: () => void;
}

export function useIntegrations(): IntegrationsState & IntegrationsActions {
  const queryClient = useQueryClient();

  // GitHub installations queries
  const {
    data: githubData,
    isLoading: githubLoading,
    refetch: refetchGitHub,
  } = useQuery(trpc.githubInstallation.getInstallations.queryOptions());
  const { data: installUrlData } = useQuery(
    trpc.githubInstallation.getInstallationUrl.queryOptions({})
  );

  // Phantom connection queries
  const {
    data: phantomData,
    isLoading: phantomLoading,
    refetch: refetchPhantom,
  } = useQuery(trpc.phantom.getConnectionStatus.queryOptions());

  // Discord queries
  const { data: discordBotInstallData } = useQuery(
    trpc.discord.getBotInstallUrl.queryOptions()
  );
  const {
    data: discordAccountData,
    isLoading: discordLoading,
    refetch: refetchDiscord,
  } = useQuery(trpc.discord.getLinkedAccount.queryOptions());

  // Connect Phantom mutation
  const connectPhantomMutation = useMutation({
    mutationFn: async () => {
      const provider = (
        window as unknown as {
          phantom?: {
            solana?: {
              isPhantom?: boolean;
              connect: () => Promise<{ publicKey: { toString: () => string } }>;
              signMessage: (
                msg: Uint8Array,
                encoding: string
              ) => Promise<{ signature: Uint8Array }>;
            };
          };
        }
      ).phantom?.solana;
      if (!provider?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not found');
      }

      // Connect to Phantom
      const { publicKey } = await provider.connect();
      const walletAddress = publicKey.toString();

      // Clear any cached message and generate a fresh verification message
      await queryClient.invalidateQueries({
        queryKey: ['phantom.generateVerificationMessage'],
      });

      const messageResult =
        await trpcClient.phantom.generateVerificationMessage.mutate({
          walletAddress,
        });
      const message = messageResult.data.message;

      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(messageBytes, 'utf8');

      // Convert signature to base58
      const signatureBase58 = bs58.encode(signature);

      // Connect wallet with signature
      await trpcClient.phantom.connectWallet.mutate({
        walletAddress,
        signature: signatureBase58,
        message,
      });

      return { walletAddress };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      toast.success('Wallet connected successfully!');
    },
    onError: (error: Error) => {
      if (!error.message.includes('User rejected')) {
        toast.error(error.message || 'Failed to connect wallet');
      }
    },
  });

  // Disconnect specific Phantom wallet mutation
  const disconnectPhantomMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      await trpcClient.phantom.disconnectSpecificWallet.mutate({
        walletAddress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      toast.success('Wallet disconnected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect wallet');
    },
  });

  // Sync Phantom wallet mutation
  const syncPhantomMutation = useMutation({
    mutationFn: (walletAddress: string) => {
      return trpcClient.phantom.syncWallet.mutate({ walletAddress });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({ queryKey: ['phantom.getWallet'] });
      toast.success(
        `Balance updated: ${data.data.tokenBalanceFormatted || data.data.tokenBalance || '0'} $BOUNTY`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync wallet');
    },
  });

  // Unlink Discord mutation
  const unlinkDiscordMutation = useMutation({
    mutationFn: () => trpcClient.discord.unlinkAccount.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [['discord', 'getLinkedAccount']],
      });
      toast.success('Discord account unlinked');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlink Discord');
    },
  });

  // Computed state
  const state: IntegrationsState = useMemo(
    () => ({
      isLoading: githubLoading || phantomLoading || discordLoading,
      isGitHubLoading: githubLoading,
      isPhantomLoading: phantomLoading,
      isDiscordLoading: discordLoading,

      githubInstallations: githubData?.installations ?? [],
      githubInstallUrl: installUrlData?.url,
      hasGitHub: (githubData?.installations?.length ?? 0) > 0,

      phantomWallets: phantomData?.data?.wallets ?? [],
      hasPhantom: phantomData?.data?.connected ?? false,

      discordAccount: discordAccountData?.account ?? null,
      discordBotInstallUrl: discordBotInstallData?.url ?? undefined,
      hasDiscord: discordAccountData?.linked ?? false,

      totalCount:
        (githubData?.installations?.length ?? 0) +
        (phantomData?.data?.connected ? 1 : 0) +
        (discordAccountData?.linked ? 1 : 0),
    }),
    [
      githubData,
      installUrlData,
      phantomData,
      discordAccountData,
      discordBotInstallData,
      githubLoading,
      phantomLoading,
      discordLoading,
    ]
  );

  // Actions
  const actions: IntegrationsActions = {
    refreshGitHub: useCallback(() => refetchGitHub(), [refetchGitHub]),
    invalidateGitHub: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
    }, [queryClient]),

    connectPhantom: useCallback(async () => {
      try {
        await connectPhantomMutation.mutateAsync();
        return true;
      } catch {
        return false;
      }
    }, [connectPhantomMutation]),

    disconnectPhantom: useCallback(
      async (walletAddress: string) => {
        await disconnectPhantomMutation.mutateAsync(walletAddress);
      },
      [disconnectPhantomMutation]
    ),

    syncPhantom: useCallback(
      async (walletAddress: string) => {
        await syncPhantomMutation.mutateAsync(walletAddress);
      },
      [syncPhantomMutation]
    ),

    refreshPhantom: useCallback(() => refetchPhantom(), [refetchPhantom]),
    invalidatePhantom: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
    }, [queryClient]),

    addDiscordBot: useCallback(() => {
      if (discordBotInstallData?.url) {
        window.open(discordBotInstallData.url, '_blank');
      }
    }, [discordBotInstallData]),

    linkDiscord: useCallback(async () => {
      // Use Better Auth's linkSocial to link Discord to existing account
      await authClient.linkSocial({
        provider: 'discord',
        callbackURL: '/integrations/discord',
      });
    }, []),

    unlinkDiscord: useCallback(async () => {
      await unlinkDiscordMutation.mutateAsync();
    }, [unlinkDiscordMutation]),

    refreshDiscord: useCallback(() => refetchDiscord(), [refetchDiscord]),

    refreshAll: useCallback(() => {
      refetchGitHub();
      refetchPhantom();
      refetchDiscord();
    }, [refetchGitHub, refetchPhantom, refetchDiscord]),

    invalidateAll: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
      queryClient.invalidateQueries({
        queryKey: ['phantom.getConnectionStatus'],
      });
      queryClient.invalidateQueries({
        queryKey: [['discord', 'getLinkedAccount']],
      });
    }, [queryClient]),
  };

  return { ...state, ...actions };
}
