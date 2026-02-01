'use client';

import { useState } from 'react';
import { useQuery, skipToken } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { Button } from '@bounty/ui/components/button';
import { ArrowLeft, ExternalLink, Inbox, User, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { CreateBountyForm } from '../components/create-bounty-form';
import { MarkdownContent } from '@/components/bounty/markdown-content';

function IssueSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-32 rounded bg-white/5" />
        <div className="h-9 w-24 rounded bg-white/5" />
      </div>

      {/* Title */}
      <div className="h-7 w-1/2 rounded bg-white/5 mb-6" />

      {/* Description */}
      <div className="space-y-2 mb-8">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-3/4 rounded bg-white/5" />
      </div>

      {/* Create Bounty */}
      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-white/5" />
        <div className="h-10 w-24 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function LinearIssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasLinear } = useIntegrations();
  const workspaceId = params.workspaceId as string;
  const issueId = params.id as string;
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: issueData, isLoading: issueLoading } = useQuery(
    trpc.linear.getIssue.queryOptions(
      hasLinear
        ? { issueId }
        : skipToken
    )
  );

  const issue = issueData?.issue;

  // Show skeleton while loading
  if (hasLinear && issueLoading) {
    return <IssueSkeleton />;
  }

  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
            <LinearIcon className="w-8 h-8 text-text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Connect Linear
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            Connect your workspace to view issues
          </p>
          <Button
            variant="default"
            onClick={() => router.push('/integrations/linear')}
            className="h-11 px-6 rounded-xl bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
          >
            Go to Linear integration
          </Button>
        </div>
      </div>
    );
  }

  if (issue === undefined && !issueLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
            <Inbox className="w-8 h-8 text-text-muted" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Issue Not Found
          </h1>
          <p className="text-sm text-neutral-400 mb-6">
            The issue you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => router.push(`/integrations/linear/${workspaceId}/issues`)}
            size="lg"
          >
            Back to Issues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push(`/integrations/linear/${workspaceId}/issues`)}
            variant="outline"
            size="icon"
            title="Back to Issues"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 font-mono">
              {issue?.identifier}
            </span>
            {issue?.status && (
              <span
                className="text-xs px-2 py-1 rounded-md border"
                style={{
                  backgroundColor: `${issue.status.color}15`,
                  borderColor: `${issue.status.color}30`,
                  color: issue.status.color,
                }}
              >
                {issue.status.name}
              </span>
            )}
          </div>
        </div>

        <a
          href={issue?.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-lg border border-white/10 text-sm text-foreground hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Linear</span>
        </a>
      </div>

      {/* Issue Title */}
      <h1 className="text-xl font-semibold text-foreground mb-6">
        {issue?.title}
      </h1>

      {/* Issue Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
        {issue && issue.priority > 0 && (
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Priority:</span>
            <span className="text-foreground">{issue.priorityLabel}</span>
          </div>
        )}
        {issue?.assignee && (
          <div className="flex items-center gap-2 text-neutral-400">
            <User className="w-4 h-4" />
            <span className="text-foreground">{issue.assignee.displayName || issue.assignee.name}</span>
          </div>
        )}
        {issue?.project && (
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Project:</span>
            <button
              type="button"
              onClick={() => router.push(`/integrations/linear/${workspaceId}/projects/${issue.project?.id}`)}
              className="text-foreground hover:underline"
            >
              {issue.project.name}
            </button>
          </div>
        )}
      </div>

      {/* Issue Dates */}
      {issue && (
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
          {issue.updatedAt !== issue.createdAt && (
            <span>Updated {new Date(issue.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Description */}
      {issue?.description && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">Description</h2>
          <div className="p-5 rounded-xl border border-white/10">
            <MarkdownContent content={issue.description} />
          </div>
        </div>
      )}

      {/* Create Bounty Section */}
      <div className="mt-8 pt-6 border-t border-border-subtle">
        {showCreateForm && issue ? (
          <div className="p-5 rounded-xl border border-border-subtle bg-surface-1">
            <CreateBountyForm
              issue={issue}
              onCancel={() => setShowCreateForm(false)}
              onSuccess={() => router.push(`/integrations/linear/${workspaceId}/issues`)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Create Bounty</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Turn this Linear issue into a bounty on bounty.new
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => setShowCreateForm(true)}
              className="h-10 px-6 rounded-lg "
            >
              Create bounty
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
