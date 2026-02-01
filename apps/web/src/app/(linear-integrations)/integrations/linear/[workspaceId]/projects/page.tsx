'use client';

import { useQuery, skipToken } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { ExternalLink, Inbox, FolderKanban } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { cn } from '@bounty/ui/lib/utils';

export default function LinearProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { hasLinear, linearWorkspace } = useIntegrations();

  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken)
  );

  const projects = projectsData?.projects ?? [];

  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border-subtle mb-6">
            <LinearIcon className="w-8 h-8 text-text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Connect Linear
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Connect your workspace to view projects
          </p>
          <button
            onClick={() => router.push('/integrations/linear')}
            className="h-11 px-6 rounded-xl bg-surface-1 text-sm font-medium text-text-primary border border-border-subtle hover:bg-surface-2 transition-colors"
          >
            Go to Linear integration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Projects</h1>
          <p className="text-sm text-text-secondary">
            {linearWorkspace?.name} • {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>

        <a
          href={linearWorkspace?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Linear</span>
        </a>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-border-default border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-primary">No projects yet</p>
          <p className="text-xs text-text-muted mt-1">
            Projects from your workspace will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <button
              key={project.id}
              onClick={() => router.push(`/integrations/linear/${workspaceId}/projects/${project.id}`)}
              className="group p-5 rounded-xl border border-border-subtle hover:border-border-default bg-surface-1 hover:bg-surface-2 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                {project.icon ? (
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-lg">
                    {project.icon}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-text-muted" />
                  </div>
                )}
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'h-8 w-8 rounded-lg border border-border-subtle text-text-secondary hover:bg-surface-2 transition-colors flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="text-sm font-medium text-text-primary mb-2 truncate">
                {project.name}
              </h3>

              {project.description ? (
                <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              ) : (
                <p className="text-sm text-text-muted">No description</p>
              )}

              {project.status && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <span className="text-xs px-2 py-1 rounded-md border border-border-subtle bg-surface-2 text-text-tertiary">
                    {project.status}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
