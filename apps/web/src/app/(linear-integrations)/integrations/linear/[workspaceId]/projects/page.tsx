'use client';

import { useQuery, skipToken } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { ExternalLink, Inbox, FolderKanban } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';

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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <LinearIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Connect Linear
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            Connect your workspace to view projects
          </p>
          <button
            onClick={() => router.push('/integrations/linear')}
            className="h-11 px-6 rounded-xl bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
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
          <h1 className="text-2xl font-semibold text-white mb-1">Projects</h1>
          <p className="text-sm text-neutral-500">
            {linearWorkspace?.name} • {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>

        <a
          href={linearWorkspace?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-lg border border-white/10 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Linear</span>
        </a>
      </div>

      {/* Projects Grid */}
      {projectsLoading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-neutral-500" />
          </div>
          <p className="text-sm text-white">No projects yet</p>
          <p className="text-xs text-neutral-500 mt-1">
            Projects from your workspace will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <button
              key={project.id}
              onClick={() => router.push(`/integrations/linear/${workspaceId}/projects/${project.id}`)}
              className="group p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                {project.icon ? (
                  <div
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg"
                    dangerouslySetInnerHTML={{ __html: project.icon }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="text-sm font-medium text-white mb-2 truncate">
                {project.name}
              </h3>

              {project.description ? (
                <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              ) : (
                <p className="text-sm text-neutral-600">No description</p>
              )}

              {project.status && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs px-2 py-1 rounded-md border border-white/10 text-neutral-400">
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
