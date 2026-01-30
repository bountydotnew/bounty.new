'use client';

import { useQuery, skipToken } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { ArrowLeft, ExternalLink, Inbox } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { LinearIssueCard } from '../../issues/components/issue-card';

export default function LinearProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasLinear } = useIntegrations();
  const workspaceId = params.workspaceId as string;
  const projectId = params.id as string;

  const { data: projectsData, isLoading: projectLoading } = useQuery(
    trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken)
  );

  const { data: issuesData, isLoading: issuesLoading } = useQuery(
    trpc.linear.getIssues.queryOptions(
      hasLinear
        ? {
            filters: { projectId },
            pagination: { first: 50 },
          }
        : skipToken
    )
  );

  const project = projectsData?.projects?.find((p) => p.id === projectId);
  const issues = issuesData?.issues ?? [];

  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <LinearIcon className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
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

  if (!projectLoading && !project) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <Inbox className="w-8 h-8 text-neutral-500" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Project Not Found
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            The project you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push(`/integrations/linear/${workspaceId}/projects`)}
            className="h-11 px-6 rounded-xl bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/integrations/linear/${workspaceId}/projects`)}
            className="h-9 px-2.5 rounded-lg border border-white/10 text-foreground hover:bg-white/5 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {project?.icon && (
            <div
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg"
              dangerouslySetInnerHTML={{ __html: project.icon }}
            />
          )}

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {projectLoading ? '...' : project?.name}
            </h1>
            <p className="text-sm text-neutral-500">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
        </div>

        <a
          href={project?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-lg border border-white/10 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Linear</span>
        </a>
      </div>

      {/* Project Info */}
      {project?.description && (
        <div className="p-5 rounded-xl border border-white/10 mb-6">
          <p className="text-sm text-neutral-400 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Status Badge */}
      {project?.status && (
        <div className="mb-6">
          <span className="text-xs px-2 py-1 rounded-lg border border-white/10 text-neutral-400">
            Status: {project.status}
          </span>
        </div>
      )}

      {/* Issues */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-4">Issues</h2>

        {issuesLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-neutral-500" />
            </div>
            <p className="text-sm text-foreground">No issues yet</p>
            <p className="text-xs text-neutral-500 mt-1">
              Issues from this project will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <LinearIssueCard key={issue.id} issue={issue} isExpanded={false} workspaceId={workspaceId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
