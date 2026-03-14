'use client';

import type * as React from 'react';
import { useQuery, useAction, useMutation } from 'convex/react';
import { api } from '@/utils/convex';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GithubIcon } from '@bounty/ui';
import { Button } from '@bounty/ui/components/button';
import { ConfirmAlertDialog } from '@bounty/ui/components/alert-dialog';
import { ExternalLink, RefreshCw, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
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

/**
 * Detect if an error indicates a stale/removed GitHub App installation.
 */
function isStaleInstallationError(error: string | null): boolean {
  if (!error) return false;
  return error.includes('NOT_FOUND') || error.includes('INTERNAL_SERVER_ERROR');
}

const CenteredWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
      <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6">
        {children}
      </div>
    </div>
  </div>
);

export default function GitHubInstallationPage() {
  const params = useParams();
  const rawInstallationId = Number(params.installationId);
  const isValidId = !Number.isNaN(rawInstallationId) && rawInstallationId > 0;
  const installationId = isValidId ? rawInstallationId : 0;
  const router = useRouter();
  const orgPath = useOrgPath();
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [newFlag, setNewFlag] = useQueryState(
    'new',
    parseAsString.withDefault('')
  );

  // Action-based data fetching (these call external GitHub APIs)
  const getRepositories = useAction(
    api.functions.githubInstallation.getRepositories
  );
  const getInstallation = useAction(
    api.functions.githubInstallation.getInstallation
  );
  const syncInstallationAction = useAction(
    api.functions.githubInstallation.syncInstallation
  );
  const removeInstallationAction = useAction(
    api.functions.githubInstallation.removeInstallation
  );
  const setDefaultInstallationMut = useMutation(
    api.functions.githubInstallation.setDefaultInstallation
  );

  // Query-based data (no external API call)
  const installUrlData = useQuery(
    api.functions.githubInstallation.getInstallationUrl,
    isValidId ? {} : 'skip'
  );

  // State for action-fetched data
  const [repositories, setRepositories] = useState<{
    repositories: Repository[];
  } | null>(null);
  const [installation, setInstallation] = useState<{
    installation: { account: { login: string; type: string } };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);

  // Fetch repositories and installation data
  const fetchData = useCallback(async () => {
    if (!isValidId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [repoData, installData] = await Promise.all([
        getRepositories({ installationId }),
        getInstallation({ installationId }),
      ]);
      setRepositories(repoData as typeof repositories);
      setInstallation(installData as typeof installation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [isValidId, installationId, getRepositories, getInstallation]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const isStale = isStaleInstallationError(error);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncInstallationAction({ installationId });
      await fetchData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      await setDefaultInstallationMut({ installationId });
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleUninstall = async () => {
    setIsUninstalling(true);
    try {
      await removeInstallationAction({ installationId });
      toast.success('GitHub installation removed');
      router.push(orgPath('/integrations'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to uninstall');
      setIsUninstalling(false);
    }
  };

  // Clear new flag on arrival
  useEffect(() => {
    if (!newFlag) return;
    void fetchData().then(() => {
      setNewFlag(null);
    });
  }, [newFlag, fetchData, setNewFlag]);

  const accountLogin = installation?.installation?.account.login || '';
  const accountType = installation?.installation?.account.type;

  const handleViewInGitHub = () => {
    let githubUrl: string;
    if (accountType === 'Organization' && accountLogin) {
      githubUrl = `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`;
    } else {
      githubUrl = `https://github.com/settings/installations/${installationId}`;
    }

    window.open(githubUrl, '_blank', 'noopener,noreferrer');
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

  const staleErrorContent = isStale ? (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <GithubIcon className="h-10 w-10 text-text-tertiary" />
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">
          This installation is no longer active
        </p>
        <p className="text-sm text-text-muted max-w-sm">
          The GitHub App was uninstalled or its permissions were revoked. You
          can reinstall it or remove this record.
        </p>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={() => {
            if (installUrlData?.url) {
              window.open(installUrlData.url, '_blank', 'noopener,noreferrer');
            }
          }}
          disabled={!installUrlData?.url}
          size="sm"
        >
          <GithubIcon className="h-4 w-4" />
          Reinstall GitHub App
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isUninstalling}
          onClick={() => void handleUninstall()}
        >
          {isUninstalling ? 'Removing...' : 'Remove'}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <CenteredWrapper>
      <IntegrationDetailPage
        isLoading={isLoading}
        error={error ? new Error(error) : null}
        errorMessage="Failed to load installation details. Please try again."
        errorContent={staleErrorContent}
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
              onClick: () => void handleSetDefault(),
              disabled: isSettingDefault,
            },
            {
              label: 'Uninstall',
              variant: 'danger',
              onClick: () => setShowUninstallDialog(true),
            },
          ]}
        >
          <ActionButton
            onClick={() => void handleSync()}
            disabled={isSyncing}
            loading={isSyncing}
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
                '_blank',
                'noopener,noreferrer'
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

      {!isStale && (
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
          isPending={isUninstalling}
          onConfirm={async () => {
            await handleUninstall();
          }}
        />
      )}
    </CenteredWrapper>
  );
}
