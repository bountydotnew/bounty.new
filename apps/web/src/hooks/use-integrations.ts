import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';
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

interface LinearWorkspace {
  id: string;
  name: string;
  key?: string;
  url?: string;
}

interface TwitterAccount {
  id: string;
  username?: string | null;
}

interface IntegrationsState {
  // Loading states
  isLoading: boolean;
  isGitHubLoading: boolean;
  isLinearLoading: boolean;
  isTwitterLoading: boolean;

  // GitHub installations
  githubInstallations: GitHubInstallation[];
  githubInstallUrl?: string;
  hasGitHub: boolean;

  // Linear
  linearWorkspace: LinearWorkspace | null;
  hasLinear: boolean;
  hasLinearOAuth: boolean;

  // Twitter (X)
  twitterAccount: TwitterAccount | null;
  hasTwitter: boolean;

  // Combined
  totalCount: number;
}

interface IntegrationsActions {
  // GitHub actions
  refreshGitHub: () => void;
  invalidateGitHub: () => void;

  // Linear actions
  linkLinear: () => Promise<void>;
  unlinkLinear: (workspaceId: string) => Promise<void>;
  refreshLinear: () => void;
  syncLinearWorkspace: () => Promise<void>;

  // Twitter (X) actions
  linkTwitter: () => Promise<void>;
  unlinkTwitter: () => Promise<void>;

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

  // Linear queries
  const {
    data: linearConnectionData,
    isLoading: linearLoading,
    refetch: refetchLinear,
  } = useQuery(trpc.linear.getConnectionStatus.queryOptions());
  const { data: linearAccountStatusData } = useQuery(
    trpc.linear.getAccountStatus.queryOptions()
  );

  // Twitter (X) - use linked accounts query and user data for handle
  const {
    data: linkedAccountsData,
    isLoading: twitterLoading,
    refetch: refetchTwitter,
  } = useQuery(trpc.user.getLinkedAccounts.queryOptions());
  const { data: userData } = useQuery(trpc.user.getMe.queryOptions());

  // Unlink Linear mutation
  const unlinkLinearMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      trpcClient.linear.disconnect.mutate({ workspaceId }),
    onSuccess: () => {
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
      if (data?.success) {
        toast.success('Linear workspace connected successfully');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect Linear workspace');
    },
  });

  // Unlink Twitter mutation
  const unlinkTwitterMutation = useMutation({
    mutationFn: () =>
      authClient.unlinkAccount({
        providerId: 'twitter',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [['user', 'getLinkedAccounts']],
      });
      toast.success('X (Twitter) account disconnected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect X (Twitter)');
    },
  });

  // Computed state
  const state: IntegrationsState = useMemo(
    () => {
      // Extract Twitter account from linked accounts
      const twitterAccountRecord =
        linkedAccountsData?.accounts?.find(
          (a: { providerId: string }) => a.providerId === 'twitter'
        ) ?? null;

      // Use user's handle (synced from Twitter) as display name, fall back to numeric ID
      const twitterUsername = userData?.handle || twitterAccountRecord?.accountId || null;

      return {
        isLoading: githubLoading || linearLoading || twitterLoading,
        isGitHubLoading: githubLoading,
        isLinearLoading: linearLoading,
        isTwitterLoading: twitterLoading,

        githubInstallations: githubData?.installations ?? [],
        githubInstallUrl: installUrlData?.url,
        hasGitHub: (githubData?.installations?.length ?? 0) > 0,

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

        twitterAccount: twitterAccountRecord
          ? {
              id: twitterAccountRecord.accountId,
              username: twitterUsername,
            }
          : null,
        hasTwitter: !!twitterAccountRecord,

        totalCount:
          (githubData?.installations?.length ?? 0) +
          (linearConnectionData?.connected ? 1 : 0) +
          (twitterAccountRecord ? 1 : 0),
      };
    },
    [
      githubData,
      installUrlData,
      linearConnectionData,
      linearAccountStatusData,
      linkedAccountsData,
      userData,
      githubLoading,
      linearLoading,
      twitterLoading,
    ]
  );

  // Actions
  const refreshGitHub = useCallback(() => refetchGitHub(), [refetchGitHub]);
  const invalidateGitHub = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [['githubInstallation', 'getInstallations']],
    });
  }, [queryClient]);

  const linkLinear = useCallback(async () => {
    await authClient.linkSocial({
      provider: 'linear',
      callbackURL: `/${orgSlug}/integrations/linear`,
    });
  }, [orgSlug]);

  const unlinkLinear = useCallback(
    async (workspaceId: string) => {
      await unlinkLinearMutation.mutateAsync(workspaceId);
    },
    [unlinkLinearMutation]
  );

  const refreshLinear = useCallback(() => refetchLinear(), [refetchLinear]);

  const syncLinearWorkspace = useCallback(async () => {
    await syncLinearWorkspaceMutation.mutateAsync();
  }, [syncLinearWorkspaceMutation]);

  const linkTwitter = useCallback(async () => {
    await authClient.linkSocial({
      provider: 'twitter',
      callbackURL: `/${orgSlug}/integrations`,
    });
  }, [orgSlug]);

  const unlinkTwitter = useCallback(async () => {
    await unlinkTwitterMutation.mutateAsync();
  }, [unlinkTwitterMutation]);

  const refreshAll = useCallback(() => {
    refetchGitHub();
    refetchLinear();
  }, [refetchGitHub, refetchLinear]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [['githubInstallation', 'getInstallations']],
    });
    queryClient.invalidateQueries({
      queryKey: [['linear', 'getConnectionStatus']],
    });
  }, [queryClient]);

  return useMemo(
    () => ({
      ...state,
      refreshGitHub,
      invalidateGitHub,
      linkLinear,
      unlinkLinear,
      refreshLinear,
      syncLinearWorkspace,
      linkTwitter,
      unlinkTwitter,
      refreshAll,
      invalidateAll,
    }),
    [
      state,
      refreshGitHub,
      invalidateGitHub,
      linkLinear,
      unlinkLinear,
      refreshLinear,
      syncLinearWorkspace,
      linkTwitter,
      unlinkTwitter,
      refreshAll,
      invalidateAll,
    ]
  );
}
