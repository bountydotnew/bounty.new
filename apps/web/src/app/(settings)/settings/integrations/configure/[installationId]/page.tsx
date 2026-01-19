'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@bounty/ui/components/button';
import { Card } from '@bounty/ui/components/card';
import { GithubIcon } from '@bounty/ui';
import { SettingsGearIcon } from '@bounty/ui/components/icons/huge/settings-gear';
import { ExternalLink, RefreshCw, ArrowLeft, Loader2, MoreVertical, GitBranch, BookOpen, Plus, Star, Check } from 'lucide-react';
import { trpcClient, queryClient } from '@/utils/trpc';
import Link from 'next/link';
import { useQueryState, parseAsString } from 'nuqs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';

export default function InstallationConfigurePage() {
  const params = useParams();
  const installationId = Number(params.installationId);
  const queryClientLocal = useQueryClient();
  const [newFlag, setNewFlag] = useQueryState('new', parseAsString.withDefault(''));

  const { data: repositories, isLoading, error } = useQuery({
    queryKey: ['githubInstallation.getRepositories', installationId],
    queryFn: () => trpcClient.githubInstallation.getRepositories.query({ installationId }),
  });

  const { data: installation } = useQuery({
    queryKey: ['githubInstallation.getInstallation', installationId],
    queryFn: () => trpcClient.githubInstallation.getInstallation.query({ installationId }),
  });

  const { data: installations } = useQuery({
    queryKey: ['githubInstallation.getInstallations'],
    queryFn: () => trpcClient.githubInstallation.getInstallations.query(),
  });

  const syncMutation = useMutation({
    mutationFn: () => trpcClient.githubInstallation.syncInstallation.mutate({ installationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubInstallation.getRepositories', installationId] });
      queryClient.invalidateQueries({ queryKey: ['githubInstallation.getInstallation', installationId] });
      queryClient.invalidateQueries({ queryKey: ['githubInstallation.getInstallations'] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: () => trpcClient.githubInstallation.setDefaultInstallation.mutate({ installationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubInstallation.getInstallations'] });
    },
  });

  useEffect(() => {
    if (newFlag) {
      queryClientLocal.invalidateQueries({ queryKey: ['githubInstallation.getInstallations'] });
      queryClientLocal.invalidateQueries({ queryKey: ['githubInstallation.getRepositories', installationId] });
      queryClientLocal.invalidateQueries({ queryKey: ['githubInstallation.getInstallation', installationId] });
      setNewFlag(null);
    }
  }, [newFlag, installationId, queryClientLocal, setNewFlag]);

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handleViewInGitHub = () => {
    window.open(`https://github.com/apps/bountydotnew/installations/${installationId}`, '_blank');
  };

  const handleViewDocs = () => {
    window.open('https://docs.bounty.new/integrations/github', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#929292]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/settings/integrations" className="flex items-center gap-2 text-sm text-[#929292] hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to integrations
          </Link>
        </div>
        <Card className="border-[#232323] bg-[#191919] p-12 text-center">
          <p className="text-[#929292]">Failed to load installation details. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/settings/integrations" className="flex items-center gap-2 text-sm text-[#929292] hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to integrations
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#232323] shrink-0">
            <GithubIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {installation?.installation?.account.login || 'bountydotnew'}
            </h1>
            <p className="text-sm text-[#929292]">
              Connect your repositories so that bounty.new can create bounties from GitHub issues and track PR submissions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewInGitHub}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View in GitHub
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewDocs}>
            <BookOpen className="mr-2 h-4 w-4" />
            View docs
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#191919] border-[#232323]">
              <DropdownMenuItem
                className="focus:bg-[#232323]"
                onClick={() => {
                  if (setDefaultMutation.isPending) return;
                  setDefaultMutation.mutate();
                }}
                disabled={setDefaultMutation.isPending}
              >
                <Star className="mr-2 h-4 w-4" />
                Make default
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400 focus:bg-[#232323]"
                onClick={() => {
                  // TODO: Implement uninstall
                  console.log('Uninstall clicked');
                }}
              >
                Uninstall
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Repositories Table */}
      <Card className="border-[#232323] bg-[#191919]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Active repositories</h2>
            {repositories?.repositories && repositories.repositories.length > 0 && (
              <span className="rounded-full bg-[#232323] px-2 py-1 text-xs text-[#929292]">
                {repositories.repositories.length}
              </span>
            )}
          </div>
          
          {repositories?.repositories && repositories.repositories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#232323]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#929292]">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#929292]">Base branch</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#929292]">Open PRs to</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#929292]">Last action</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#929292]" />
                  </tr>
                </thead>
                <tbody>
                  {repositories.repositories.map((repo) => (
                    <tr key={repo.id} className="border-b border-[#232323] hover:bg-[#141414] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <GithubIcon className="h-4 w-4 text-[#929292]" />
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-white transition-colors"
                          >
                            {repo.fullName}
                          </a>
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#929292] hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-[#929292]">
                          <GitBranch className="h-3 w-3" />
                          <span>main</span>
                          <span className="text-[#929292]">⇅</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-[#929292]">
                          <GitBranch className="h-3 w-3" />
                          <span>main</span>
                          <span className="text-[#929292]">⇅</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#929292]">
                        14 hours ago
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="text" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#191919] border-[#232323]">
                            <DropdownMenuItem className="flex items-center gap-2 focus:bg-[#232323]">
                              <SettingsGearIcon className="size-4 opacity-60 text-white" />
                              <span className="flex-1">{repo.fullName}</span>
                              <GithubIcon className="size-4 opacity-60 text-white" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-[#929292] mb-4">No repositories connected.</p>
              <Button variant="outline" size="sm" onClick={handleViewInGitHub}>
                <Plus className="mr-2 h-4 w-4" />
                Add another repository
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
