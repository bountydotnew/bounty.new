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

interface IntegrationsState {
  // Loading states
  isLoading: boolean;
  isGitHubLoading: boolean;
  isLinearLoading: boolean;

  // GitHub installations
  githubInstallations: GitHubInstallation[];
  githubInstallUrl?: string;
  hasGitHub: boolean;

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

  // Linear queries
  const {
    data: linearConnectionData,
    isLoading: linearLoading,
    refetch: refetchLinear,
  } = useQuery(trpc.linear.getConnectionStatus.queryOptions());
  const { data: linearAccountStatusData } = useQuery(
    trpc.linear.getAccountStatus.queryOptions()
  );

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

  // Computed state
  const state: IntegrationsState = useMemo(
    () => ({
      isLoading: githubLoading || linearLoading,
      isGitHubLoading: githubLoading,
      isLinearLoading: linearLoading,

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

      totalCount:
        (githubData?.installations?.length ?? 0) +
        (linearConnectionData?.connected ? 1 : 0),
    }),
    [
      githubData,
      installUrlData,
      linearConnectionData,
      linearAccountStatusData,
      githubLoading,
      linearLoading,
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
      refreshAll,
      invalidateAll,
    ]
  );
}
