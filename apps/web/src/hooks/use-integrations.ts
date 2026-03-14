import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/utils/convex';
import { useCallback, useMemo } from 'react';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import { useOrgSlug } from '@/context/org-slug-context';

interface GitHubInstallation {
  id: number;
  accountLogin?: string | null;
  accountType?: string | null;
  repositoryIds?: string[] | null;
  isDefault?: boolean;
}

interface DiscordAccount {
  discordId: string;
  username: string | null;
  globalName: string | null;
  displayName: string;
  avatar: string | null;
  linkedAt: string | null;
}

interface LinearWorkspace {
  id: string;
  name: string;
  key?: string;
  url?: string;
}

interface IntegrationsState {
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

interface IntegrationsActions {
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
  const orgSlug = useOrgSlug();

  // GitHub installations queries (reactive via Convex)
  const githubData = useQuery(
    api.functions.githubInstallation.getInstallations,
    {}
  );
  const githubLoading = githubData === undefined;

  const installUrlData = useQuery(
    api.functions.githubInstallation.getInstallationUrl,
    {}
  );

  // Discord queries (reactive via Convex)
  const discordBotInstallData = useQuery(
    api.functions.discord.getBotInstallUrl,
    {}
  );

  const discordAccountData = useQuery(
    api.functions.discord.getLinkedAccount,
    {}
  );
  const discordLoading = discordAccountData === undefined;

  // Linear queries (reactive via Convex)
  const linearConnectionData = useQuery(
    api.functions.linear.getConnectionStatus,
    {}
  );
  const linearLoading = linearConnectionData === undefined;

  const linearAccountStatusData = useQuery(
    api.functions.linear.getAccountStatus,
    {}
  );

  // Convex mutations and actions
  const unlinkAccountMutation = useMutation(
    api.functions.discord.unlinkAccount
  );
  const disconnectLinearMutation = useAction(api.functions.linear.disconnect);
  const syncWorkspaceAction = useAction(api.functions.linear.syncWorkspace);

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
  // Convex is reactive — refresh/invalidate are no-ops since data auto-updates
  const refreshGitHub = useCallback(() => {}, []);
  const invalidateGitHub = useCallback(() => {}, []);

  const addDiscordBot = useCallback(() => {
    if (discordBotInstallData?.url) {
      window.open(discordBotInstallData.url, '_blank');
    }
  }, [discordBotInstallData]);

  const linkDiscord = useCallback(async () => {
    await authClient.linkSocial({
      provider: 'discord',
      callbackURL: `/${orgSlug}/integrations/discord`,
    });
  }, [orgSlug]);

  const unlinkDiscord = useCallback(async () => {
    try {
      await unlinkAccountMutation();
      toast.success('Discord account unlinked');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to unlink Discord';
      toast.error(message);
    }
  }, [unlinkAccountMutation]);

  const refreshDiscord = useCallback(() => {}, []);

  const linkLinear = useCallback(async () => {
    await authClient.linkSocial({
      provider: 'linear',
      callbackURL: `/${orgSlug}/integrations/linear`,
    });
  }, [orgSlug]);

  const unlinkLinear = useCallback(
    async (workspaceId: string) => {
      try {
        await disconnectLinearMutation({ workspaceId });
        toast.success('Linear workspace disconnected');
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to disconnect Linear';
        toast.error(message);
      }
    },
    [disconnectLinearMutation]
  );

  const refreshLinear = useCallback(() => {}, []);

  const syncLinearWorkspace = useCallback(async () => {
    try {
      const data = await syncWorkspaceAction();
      if (data?.success) {
        toast.success('Linear workspace connected successfully');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to connect Linear workspace';
      toast.error(message);
    }
  }, [syncWorkspaceAction]);

  const refreshAll = useCallback(() => {}, []);
  const invalidateAll = useCallback(() => {}, []);

  // Memoize the combined return value to maintain referential stability
  return useMemo(
    () => ({
      ...state,
      refreshGitHub,
      invalidateGitHub,
      addDiscordBot,
      linkDiscord,
      unlinkDiscord,
      refreshDiscord,
      linkLinear,
      unlinkLinear,
      refreshLinear,
      syncLinearWorkspace,
      refreshAll,
      invalidateAll,
    }),
    [
      state,
      refreshGitHub,
      invalidateGitHub,
      addDiscordBot,
      linkDiscord,
      unlinkDiscord,
      refreshDiscord,
      linkLinear,
      unlinkLinear,
      refreshLinear,
      syncLinearWorkspace,
      refreshAll,
      invalidateAll,
    ]
  );
}
