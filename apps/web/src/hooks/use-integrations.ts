import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import { useOrgSlug } from '@/context/org-slug-context';

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

export interface LinearWorkspace {
  id: string;
  name: string;
  key?: string;
  url?: string;
}

export interface IntegrationsState {
  // Loading states
  isLoading: boolean;
  isGitHubLoading: boolean;
  isDiscordLoading: boolean;
  isLinearLoading: boolean;

  // GitHub installations
  githubInstallations: GitHubInstallation[];
  githubInstallUrl?: string;
  hasGitHub: boolean;

  // Discord
  discordAccount: DiscordAccount | null;
  discordBotInstallUrl?: string;
  hasDiscord: boolean;

  // Linear
  linearWorkspace: LinearWorkspace | null;
  hasLinear: boolean;
  hasLinearOAuth: boolean;

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

  // Linear actions
  linkLinear: () => Promise<void>;
  unlinkLinear: (workspaceId: string) => Promise<void>;
  refreshLinear: () => void;
  syncLinearWorkspace: () => Promise<void>;

  // Global refresh
  refreshAll: () => void;
  invalidateAll: () => void;
}

export function useIntegrations(): IntegrationsState & IntegrationsActions {
  const queryClient = useQueryClient();
  const orgSlug = useOrgSlug();

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

  // Linear queries
  const {
    data: linearConnectionData,
    isLoading: linearLoading,
    refetch: refetchLinear,
  } = useQuery(trpc.linear.getConnectionStatus.queryOptions());
  const { data: linearAccountStatusData } = useQuery(
    trpc.linear.getAccountStatus.queryOptions()
  );

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

  // Unlink Linear mutation
  const unlinkLinearMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      trpcClient.linear.disconnect.mutate({ workspaceId }),
    onSuccess: () => {
      // Invalidate all Linear queries to immediately update UI state
      queryClient.invalidateQueries({
        queryKey: [['linear', 'getConnectionStatus']],
      });
      queryClient.invalidateQueries({
        queryKey: [['linear', 'getAccountStatus']],
      });
      toast.success('Linear workspace disconnected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect Linear');
    },
  });

  // Sync Linear workspace mutation
  const syncLinearWorkspaceMutation = useMutation({
    mutationFn: () => trpcClient.linear.syncWorkspace.mutate(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [['linear', 'getConnectionStatus']],
      });
      queryClient.invalidateQueries({
        queryKey: [['linear', 'getAccountStatus']],
      });
      // Only show success toast if sync actually succeeded
      if (data?.success) {
        toast.success('Linear workspace connected successfully');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect Linear workspace');
    },
  });

  // Computed state
  const state: IntegrationsState = useMemo(
    () => ({
      isLoading: githubLoading || discordLoading || linearLoading,
      isGitHubLoading: githubLoading,
      isDiscordLoading: discordLoading,
      isLinearLoading: linearLoading,

      githubInstallations: githubData?.installations ?? [],
      githubInstallUrl: installUrlData?.url,
      hasGitHub: (githubData?.installations?.length ?? 0) > 0,

      discordAccount: discordAccountData?.account ?? null,
      discordBotInstallUrl: discordBotInstallData?.url ?? undefined,
      hasDiscord: discordAccountData?.linked ?? false,

      linearWorkspace: linearConnectionData?.workspace
        ? {
            id: linearConnectionData.workspace.id,
            name: linearConnectionData.workspace.name,
            key: linearConnectionData.workspace.key ?? undefined,
            url: linearConnectionData.workspace.url ?? undefined,
          }
        : null,
      hasLinear: linearConnectionData?.connected ?? false,
      hasLinearOAuth: linearAccountStatusData?.hasOAuth ?? false,

      totalCount:
        (githubData?.installations?.length ?? 0) +
        (discordAccountData?.linked ? 1 : 0) +
        (linearConnectionData?.connected ? 1 : 0),
    }),
    [
      githubData,
      installUrlData,
      discordAccountData,
      discordBotInstallData,
      linearConnectionData,
      linearAccountStatusData,
      githubLoading,
      discordLoading,
      linearLoading,
    ]
  );

  // Actions
  const actions: IntegrationsActions = {
    refreshGitHub: useCallback(() => refetchGitHub(), [refetchGitHub]),
    invalidateGitHub: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: [['githubInstallation', 'getInstallations']],
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
        callbackURL: `/${orgSlug}/integrations/discord`,
      });
    }, [orgSlug]),

    unlinkDiscord: useCallback(async () => {
      await unlinkDiscordMutation.mutateAsync();
    }, [unlinkDiscordMutation]),

    refreshDiscord: useCallback(() => refetchDiscord(), [refetchDiscord]),

    linkLinear: useCallback(async () => {
      // Use Better Auth's linkSocial to link Linear to existing account
      await authClient.linkSocial({
        provider: 'linear',
        callbackURL: `/${orgSlug}/integrations/linear`,
      });
    }, [orgSlug]),

    unlinkLinear: useCallback(
      async (workspaceId: string) => {
        await unlinkLinearMutation.mutateAsync(workspaceId);
      },
      [unlinkLinearMutation]
    ),

    refreshLinear: useCallback(() => refetchLinear(), [refetchLinear]),

    syncLinearWorkspace: useCallback(async () => {
      await syncLinearWorkspaceMutation.mutateAsync();
    }, [syncLinearWorkspaceMutation]),

    refreshAll: useCallback(() => {
      refetchGitHub();
      refetchDiscord();
      refetchLinear();
    }, [refetchGitHub, refetchDiscord, refetchLinear]),

    invalidateAll: useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: [['githubInstallation', 'getInstallations']],
      });
      queryClient.invalidateQueries({
        queryKey: [['discord', 'getLinkedAccount']],
      });
      queryClient.invalidateQueries({
        queryKey: [['linear', 'getConnectionStatus']],
      });
    }, [queryClient]),
  };

  return { ...state, ...actions };
}
