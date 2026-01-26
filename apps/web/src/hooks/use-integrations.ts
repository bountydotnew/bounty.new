import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';

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
  isDiscordLoading: boolean;

  // GitHub installations
  githubInstallations: GitHubInstallation[];
  githubInstallUrl?: string;
  hasGitHub: boolean;

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

  // Discord queries
  const { data: discordBotInstallData } = useQuery(
    trpc.discord.getBotInstallUrl.queryOptions()
  );
  const {
    data: discordAccountData,
    isLoading: discordLoading,
    refetch: refetchDiscord,
  } = useQuery(trpc.discord.getLinkedAccount.queryOptions());

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
      isLoading: githubLoading || discordLoading,
      isGitHubLoading: githubLoading,
      isDiscordLoading: discordLoading,

      githubInstallations: githubData?.installations ?? [],
      githubInstallUrl: installUrlData?.url,
      hasGitHub: (githubData?.installations?.length ?? 0) > 0,

      discordAccount: discordAccountData?.account ?? null,
      discordBotInstallUrl: discordBotInstallData?.url ?? undefined,
      hasDiscord: discordAccountData?.linked ?? false,

      totalCount:
        (githubData?.installations?.length ?? 0) +
        (discordAccountData?.linked ? 1 : 0),
    }),
    [
      githubData,
      installUrlData,
      discordAccountData,
      discordBotInstallData,
      githubLoading,
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
      refetchDiscord();
    }, [refetchGitHub, refetchDiscord]),

    invalidateAll: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
      queryClient.invalidateQueries({
        queryKey: [['discord', 'getLinkedAccount']],
      });
    }, [queryClient]),
  };

  return { ...state, ...actions };
}
