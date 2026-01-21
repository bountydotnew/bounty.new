'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { GithubIcon } from '@bounty/ui';
import { ExternalLink, RefreshCw, Plus, Star } from 'lucide-react';
import { trpcClient, queryClient } from '@/utils/trpc';
import { useQueryState, parseAsString } from 'nuqs';
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
  const installationId = Number(params.installationId);
  const queryClientLocal = useQueryClient();
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
  });

  const { data: installation } = useQuery({
    queryKey: ['githubInstallation.getInstallation', installationId],
    queryFn: () =>
      trpcClient.githubInstallation.getInstallation.query({ installationId }),
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      trpcClient.githubInstallation.syncInstallation.mutate({ installationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getRepositories', installationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getInstallation', installationId],
      });
      queryClient.invalidateQueries({
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
      queryClient.invalidateQueries({
        queryKey: ['githubInstallation.getInstallations'],
      });
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

  const handleViewInGitHub = () => {
    window.open(
      `https://github.com/apps/bountydotnew/installations/${installationId}`,
      '_blank'
    );
  };

  const repoCount = repositories?.repositories?.length || 0;
  const repoList = (repositories?.repositories || []) as Repository[];

  const columns: Column<Repository>[] = [
    {
      key: 'name',
      header: 'Repository',
      width: '1fr',
      render: (repo) => (
        <div className="flex items-center gap-2 min-w-0">
          <GithubIcon className="h-4 w-4 text-[#888] shrink-0" />
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:text-white transition-colors"
          >
            {repo.name}
          </a>
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5A5A5A] hover:text-white shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <IntegrationDetailPage
      isLoading={isLoading}
      error={error as Error | null}
      errorMessage="Failed to load installation details. Please try again."
    >
      <IntegrationHeader
        icon={<GithubIcon className="h-8 w-8 text-white" />}
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
            onClick: () => console.log('Uninstall clicked'),
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
            window.open('https://docs.bounty.new/integrations/github', '_blank')
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
          rowActions={[
            { label: 'Configure', onClick: () => console.log('Configure') },
          ]}
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
  );
}
