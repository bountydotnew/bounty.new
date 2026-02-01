'use client';

import { useQuery, useQueries, skipToken, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { LinearIcon } from '@bounty/ui';
import { Button } from '@bounty/ui/components/button';
import { ExternalLink, ArrowRight, Inbox, Layers, FolderKanban, LogOut, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { cn } from '@bounty/ui/lib/utils';
import type { LinearIssue } from '@bounty/api/driver/linear-client';

export default function LinearWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const workspaceIdFromUrl = params.workspaceId as string;

  const {
    linearWorkspace,
    hasLinear,
    linkLinear,
    refreshLinear,
    syncLinearWorkspace,
    unlinkLinear,
    isLinearLoading,
  } = useIntegrations();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch issues and projects in parallel using useQueries
  const [issuesQuery, projectsQuery] = useQueries({
    queries: [
      trpc.linear.getIssues.queryOptions(
        hasLinear ? { pagination: { first: 5 } } : skipToken
      ),
      trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken),
    ],
  });

  const issuesData = issuesQuery.data;
  const issuesLoading = issuesQuery.isLoading;
  const projectsData = projectsQuery.data;
  const projectsLoading = projectsQuery.isLoading;

  // Account status is separate as it's always needed (even when not connected)
  const { data: accountData } = useQuery(
    trpc.linear.getAccountStatus.queryOptions()
  );

  const needsSync = accountData?.hasOAuth && !hasLinear;

  // Redirect to correct workspace URL if workspaceId doesn't match
  useEffect(() => {
    if (linearWorkspace && linearWorkspace.id !== workspaceIdFromUrl) {
      router.replace(`/integrations/linear/${linearWorkspace.id}`);
    }
  }, [linearWorkspace, workspaceIdFromUrl, router]);

  const handleLinkAccount = async () => {
    setIsConnecting(true);
    try {
      await linkLinear();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncWorkspace = async () => {
    setIsSyncing(true);
    try {
      await syncLinearWorkspace();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (linearWorkspace) {
      await unlinkLinear(linearWorkspace.id);
      // Clear all Linear queries to prevent any API calls after disconnect
      queryClient.removeQueries({ queryKey: [['linear']] });
      router.push('/integrations');
    }
  };

  const recentIssues = issuesData?.issues?.slice(0, 3) ?? [];

  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
              <LinearIcon className="w-8 h-8 text-text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              Connect Linear
            </h1>
            <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
              Link your Linear workspace to create bounties from issues and track progress across teams.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleLinkAccount}
                disabled={isConnecting || isLinearLoading}
                size="lg"
                className="w-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect Linear'}
              </Button>
              {needsSync && (
                <Button
                  onClick={handleSyncWorkspace}
                  disabled={isSyncing || isLinearLoading}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {isSyncing ? 'Syncing...' : 'Sync workspace'}
                </Button>
              )}
            </div>
            <p className="text-xs text-text-muted mt-6">
              You'll be redirected to Linear to authorize
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentWorkspaceId = linearWorkspace?.id || workspaceIdFromUrl;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <LinearIcon className="w-5 h-5 text-text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {linearWorkspace?.name || 'Linear'}
            </h1>
            <p className="text-xs text-text-muted">Workspace Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={linearWorkspace?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open workspace</span>
          </a>

          <Button
            onClick={() => {
              refreshLinear();
              toast.success('Refreshed');
            }}
            disabled={isLinearLoading}
            variant="outline"
            size="icon"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLinearLoading && 'animate-spin')} />
          </Button>

          <Button
            onClick={handleDisconnect}
            variant="destructive"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Disconnect</span>
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/integrations/linear/${currentWorkspaceId}/issues`}
          className="group p-5 rounded-xl border border-border-subtle hover:border-border-default bg-surface-1 hover:bg-surface-2 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center">
              <Layers className="w-5 h-5 text-text-muted" />
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">Issues</h3>
          <p className="text-xs text-text-muted">
            {issuesLoading ? '...' : `${issuesData?.issues?.length ?? 0} issue${(issuesData?.issues?.length ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </Link>

        <Link
          href={`/integrations/linear/${currentWorkspaceId}/projects`}
          className="group p-5 rounded-xl border border-border-subtle hover:border-border-default bg-surface-1 hover:bg-surface-2 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-text-muted" />
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-text-primary mb-1">Projects</h3>
          <p className="text-xs text-text-muted">
            {projectsLoading ? '...' : `${projectsData?.projects?.length ?? 0} project${(projectsData?.projects?.length ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </Link>
      </div>

      {/* Recent Issues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-text-primary">Recent Issues</h2>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/issues`)}
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {issuesLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-border-default border-t-text-primary rounded-full animate-spin" />
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm text-text-primary">No issues yet</p>
            <p className="text-xs text-text-muted mt-1">
              Issues from your workspace will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle border border-border-subtle rounded-xl overflow-hidden bg-surface-1">
            {recentIssues.map((issue: LinearIssue) => (
              <div
                key={issue.id}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-text-muted font-mono">
                      {issue.identifier}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-md border font-medium"
                      style={{
                        backgroundColor: `${issue.status.color}15`,
                        color: issue.status.color,
                        borderColor: `${issue.status.color}30`,
                      }}
                    >
                      {issue.status.name}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {issue.title}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/issues?issue=${issue.id}`)}
                  className="shrink-0"
                >
                  Create bounty
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
