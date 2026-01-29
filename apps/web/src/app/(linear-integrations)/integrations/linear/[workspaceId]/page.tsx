'use client';

import { useQuery, skipToken } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { ExternalLink, ArrowRight, Inbox, Layers, FolderKanban, LogOut } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function LinearWorkspacePage() {
  const router = useRouter();
  const params = useParams();
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

  const {
    data: issuesData,
    isLoading: issuesLoading,
  } = useQuery(
    trpc.linear.getIssues.queryOptions(
      hasLinear ? { pagination: { first: 5 } } : skipToken
    )
  );

  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken)
  );

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
      router.push('/integrations/linear');
    }
  };

  const recentIssues = issuesData?.issues?.slice(0, 3) ?? [];

  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <LinearIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Connect Linear
            </h1>
            <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Link your Linear workspace to create bounties from issues and track progress across teams.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLinkAccount}
                disabled={isConnecting || isLinearLoading}
                className="w-full h-11 px-6 rounded-xl bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect Linear'}
              </button>
              {needsSync && (
                <button
                  onClick={handleSyncWorkspace}
                  disabled={isSyncing || isLinearLoading}
                  className="w-full h-11 px-6 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Sync workspace'}
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-6">
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
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <LinearIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {linearWorkspace?.name || 'Linear'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={linearWorkspace?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open workspace</span>
          </a>

          <button
            onClick={() => {
              refreshLinear();
              toast.success('Refreshed');
            }}
            disabled={isLinearLoading}
            className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            onClick={handleDisconnect}
            className="h-9 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/issues`)}
          className="group p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-neutral-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Issues</h3>
          <p className="text-xs text-neutral-500">
            {issuesLoading ? '...' : `${issuesData?.issues?.length ?? 0} issues`}
          </p>
        </button>

        <button
          onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/projects`)}
          className="group p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-neutral-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">Projects</h3>
          <p className="text-xs text-neutral-500">
            {projectsLoading ? '...' : `${projectsData?.projects?.length ?? 0} projects`}
          </p>
        </button>
      </div>

      {/* Recent Issues */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Recent Issues</h2>
          <button
            onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/issues`)}
            className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {issuesLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : recentIssues.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-sm text-white">No issues yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Issues from your workspace will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden">
            {recentIssues.map((issue: any) => (
              <div
                key={issue.id}
                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-neutral-500 font-mono">
                      {issue.identifier}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `${issue.status.color}15`,
                        color: issue.status.color,
                      }}
                    >
                      {issue.status.name}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-white truncate">
                    {issue.title}
                  </h3>
                </div>
                <button
                  onClick={() => router.push(`/integrations/linear/${currentWorkspaceId}/issues?issue=${issue.id}`)}
                  className="h-8 px-4 rounded-lg bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors shrink-0"
                >
                  Create bounty
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
