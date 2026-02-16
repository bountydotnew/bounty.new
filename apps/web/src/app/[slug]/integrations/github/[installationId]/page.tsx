'use client';

import type * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GithubIcon } from '@bounty/ui';
import { ConfirmAlertDialog } from '@bounty/ui/components/alert-dialog';
import { ExternalLink, RefreshCw, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { trpcClient } from '@/utils/trpc';
import { useQueryState, parseAsString } from 'nuqs';
import { useOrgPath } from '@/hooks/use-org-path';
import {
  IntegrationDetailPage,
  IntegrationHeader,
  IntegrationTable,
  ActionButton,
  ActionButtonGroup,
  SectionHeader,
  type Column,
} from '@/components/integrations';

interface Repository {
  id: number;
  name: string;
  htmlUrl: string;
}

export default function GitHubInstallationPage() {
  const params = useParams();
  const rawInstallationId = Number(params.installationId);
  const isValidId = !Number.isNaN(rawInstallationId) && rawInstallationId > 0;
  const installationId = isValidId ? rawInstallationId : 0;
  const router = useRouter();
  const orgPath = useOrgPath();
  const queryClientLocal = useQueryClient();
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [newFlag, setNewFlag] = useQueryState(
    'new',
    parseAsString.withDefault('')
  );

  const {
    data: repositories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['githubInstallation.getRepositories', installationId],
    queryFn: () =>
      trpcClient.githubInstallation.getRepositories.query({ installationId }),
    enabled: isValidId,
  });

  const { data: installation } = useQuery({
    queryKey: ['githubInstallation.getInstallation', installationId],
    queryFn: () =>
      trpcClient.githubInstallation.getInstallation.query({ installationId }),
    enabled: isValidId,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      trpcClient.githubInstallation.syncInstallation.mutate({ installationId }),
    onSuccess: () => {
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getRepositories', installationId],
      });
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallation', installationId],
      });
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: () =>
      trpcClient.githubInstallation.setDefaultInstallation.mutate({
        installationId,
      }),
    onSuccess: () => {
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: () =>
      trpcClient.githubInstallation.removeInstallation.mutate({
        installationId,
      }),
    onSuccess: () => {
      toast.success('GitHub installation removed');
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
      router.push(orgPath('/integrations'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to uninstall');
    },
  });

  useEffect(() => {
    if (newFlag) {
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getRepositories', installationId],
      });
      queryClientLocal.invalidateQueries({
        queryKey: ['githubInstallation.getInstallation', installationId],
      });
      setNewFlag(null);
    }
  }, [newFlag, installationId, queryClientLocal, setNewFlag]);

  const accountLogin = installation?.installation?.account.login || '';
  const accountType = installation?.installation?.account.type;

  const handleViewInGitHub = () => {
    let githubUrl: string;
    if (accountType === 'Organization' && accountLogin) {
      githubUrl = `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`;
    } else {
      githubUrl = `https://github.com/settings/installations/${installationId}`;
    }

    window.open(githubUrl, '_blank');
  };

  if (!isValidId) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-text-muted">Invalid installation ID.</p>
      </div>
    );
  }

  const repoCount = repositories?.repositories?.length || 0;
  const repoList = (repositories?.repositories || []) as Repository[];

  const columns: Column<Repository>[] = [
    {
      key: 'name',
      header: 'Repository',
      width: '1fr',
      render: (repo) => (
        <div className="flex items-center gap-2 min-w-0">
          <GithubIcon className="h-4 w-4 text-text-muted shrink-0" />
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:text-foreground transition-colors"
          >
            {repo.name}
          </a>
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary hover:text-foreground shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
  ];

  const CenteredWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <CenteredWrapper>
      <IntegrationDetailPage
        isLoading={isLoading}
        error={error as Error | null}
        errorMessage="Failed to load installation details. Please try again."
      >
        <IntegrationHeader
          icon={<GithubIcon className="h-8 w-8 text-foreground" />}
          title={installation?.installation?.account.login || 'GitHub'}
          description="Connect your repositories so that bounty.new can open Pull Requests for issues that it finds"
        />

        <ActionButtonGroup
          dropdownActions={[
            {
              label: 'Make default',
              icon: <Star className="h-4 w-4" />,
              onClick: () => setDefaultMutation.mutate(),
              disabled: setDefaultMutation.isPending,
            },
            {
              label: 'Uninstall',
              variant: 'danger',
              onClick: () => setShowUninstallDialog(true),
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
            onClick={handleViewInGitHub}
            icon={<ExternalLink className="h-4 w-4" />}
          >
            View in GitHub
          </ActionButton>
          <ActionButton
            onClick={() =>
              window.open(
                'https://docs.bounty.new/integrations/github',
                '_blank'
              )
            }
            icon={<ExternalLink className="h-4 w-4" />}
          >
            View docs
          </ActionButton>
        </ActionButtonGroup>

        <div className="pt-4">
          <SectionHeader title="Active repositories" count={repoCount} />
          <IntegrationTable
            columns={columns}
            data={repoList}
            keyExtractor={(repo) => repo.id}
            rowActions={[]}
            emptyMessage="No repositories connected."
          />
        </div>

        <ActionButton
          className="w-fit"
          onClick={handleViewInGitHub}
          icon={<Plus className="h-4 w-4" />}
        >
          Add another repository
        </ActionButton>
      </IntegrationDetailPage>

      <ConfirmAlertDialog
        open={showUninstallDialog}
        onOpenChange={setShowUninstallDialog}
        title="Uninstall GitHub App"
        description={
          <>
            This will revoke bounty.new&apos;s access to{' '}
            <span className="font-semibold text-foreground">
              {accountLogin}
            </span>
            .{' '}
            <span className="font-semibold text-red-400">
              This can not be undone.
            </span>
          </>
        }
        confirmValue={accountLogin}
        confirmLabel="Uninstall"
        pendingLabel="Uninstalling..."
        isPending={uninstallMutation.isPending}
        onConfirm={async () => {
          await uninstallMutation.mutateAsync();
        }}
      />
    </CenteredWrapper>
  );
}
