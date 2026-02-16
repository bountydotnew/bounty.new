'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { LinearIssue } from '@bounty/api/driver/linear-client';
import { Button } from '@bounty/ui/components/button';
import { ChevronDown, ChevronUp, User, ExternalLink } from 'lucide-react';
import { CreateBountyForm } from './create-bounty-form';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import { cn } from '@bounty/ui/lib/utils';
import { trpc } from '@/utils/trpc';
import { useOrgPath } from '@/hooks/use-org-path';

interface LinearIssueCardProps {
  issue: LinearIssue;
  isExpanded: boolean;
  workspaceId: string;
}

function getPriorityStyles(priority: number): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 4:
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
      };
    case 3:
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/20',
      };
    case 2:
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
      };
    case 1:
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
      };
    default:
      return {
        bg: 'bg-surface-2',
        text: 'text-text-tertiary',
        border: 'border-border-default',
      };
  }
}

export function LinearIssueCard({
  issue,
  isExpanded,
  workspaceId,
}: LinearIssueCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgPath = useOrgPath();
  const [expanded, setExpanded] = useState(isExpanded);

  // Prefetch issue detail on hover for faster navigation
  const prefetchIssueDetail = useCallback(() => {
    queryClient.prefetchQuery(
      trpc.linear.getIssue.queryOptions({ issueId: issue.id })
    );
    queryClient.prefetchQuery(
      trpc.linear.getBountyDataFromIssue.queryOptions({
        linearIssueId: issue.id,
      })
    );
  }, [issue.id, queryClient]);

  const toggleExpand = () => {
    setExpanded(!expanded);
    const url = new URL(window.location.href);
    if (expanded) {
      url.searchParams.delete('issue');
    } else {
      url.searchParams.set('issue', issue.id);
    }
    router.push(url.pathname + url.search, { scroll: false });
  };

  const priorityStyles = getPriorityStyles(issue.priority);
  const statusBg = `${issue.status.color}15`;
  const statusBorder = `${issue.status.color}30`;

  return (
    <div className="group border border-border-subtle rounded-xl overflow-hidden hover:border-border-default transition-all bg-surface-1">
      {/* Summary */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted font-mono">
                {issue.identifier}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-md border font-medium"
                style={{
                  backgroundColor: statusBg,
                  color: issue.status.color,
                  borderColor: statusBorder,
                }}
              >
                {issue.status.name}
              </span>
              {issue.priority > 0 && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md border font-medium',
                    priorityStyles.bg,
                    priorityStyles.text,
                    priorityStyles.border
                  )}
                >
                  {issue.priorityLabel}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-text-primary leading-snug">
              {issue.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
              {issue.assignee && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    {issue.assignee.displayName || issue.assignee.name}
                  </span>
                </div>
              )}
              {!issue.assignee && (
                <div className="flex items-center gap-1.5 text-text-tertiary">
                  <User className="w-3.5 h-3.5" />
                  <span>Unassigned</span>
                </div>
              )}
              {issue.project && (
                <>
                  <span className="text-border-default">•</span>
                  <span>{issue.project.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(
                  orgPath(
                    `/integrations/linear/${workspaceId}/issues/${issue.id}`
                  )
                )
              }
              onMouseEnter={prefetchIssueDetail}
              onFocus={prefetchIssueDetail}
              className="hidden sm:flex"
            >
              Details
            </Button>
            <Button
              onClick={toggleExpand}
              variant={expanded ? 'secondary' : 'outline'}
              size="sm"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Collapse</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Create bounty</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border-subtle bg-surface-2">
          {/* Description */}
          {issue.description && (
            <div className="p-4 sm:p-5 border-b border-border-subtle">
              <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                Description
              </h4>
              <div className="text-sm text-text-secondary prose prose-invert prose-sm max-w-none">
                <MarkdownContent content={issue.description} />
              </div>
            </div>
          )}

          {/* Create Bounty Form */}
          <div className="p-4 sm:p-5">
            <CreateBountyForm
              issue={issue}
              onCancel={() => setExpanded(false)}
              onSuccess={() => {
                setExpanded(false);
                const url = new URL(window.location.href);
                url.searchParams.delete('issue');
                router.push(url.pathname + url.search, { scroll: false });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
