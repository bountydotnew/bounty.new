'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LinearIssue } from '@bounty/api/driver/linear-client';
import { ChevronDown, ChevronUp, User, ExternalLink } from 'lucide-react';
import { CreateBountyForm } from './create-bounty-form';
import { MarkdownContent } from '@/components/bounty/markdown-content';

interface LinearIssueCardProps {
  issue: LinearIssue;
  isExpanded: boolean;
  workspaceId: string;
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 4: return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 3: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 2: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 1: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    default: return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
  }
}

export function LinearIssueCard({ issue, isExpanded, workspaceId }: LinearIssueCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(isExpanded);

  const toggleExpand = () => {
    setExpanded(!expanded);
    const url = new URL(window.location.href);
    if (!expanded) {
      url.searchParams.set('issue', issue.id);
    } else {
      url.searchParams.delete('issue');
    }
    router.push(url.pathname + url.search, { scroll: false });
  };

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Summary */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500 font-mono">
                {issue.identifier}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-md border"
                style={{
                  backgroundColor: `${issue.status.color}15`,
                  color: issue.status.color,
                  borderColor: `${issue.status.color}30`,
                }}
              >
                {issue.status.name}
              </span>
              {issue.priority > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md border ${getPriorityColor(issue.priority)}`}>
                  {issue.priorityLabel}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-white leading-snug">
              {issue.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{issue.assignee?.displayName || issue.assignee?.name || 'Unassigned'}</span>
              </div>
              {issue.project && (
                <div className="flex items-center gap-1.5">
                  <span>{issue.project.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-lg border border-white/10 text-xs text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View</span>
            </a>
            <button
              onClick={() => router.push(`/integrations/linear/${workspaceId}/issues/${issue.id}`)}
              className="h-8 px-3 rounded-lg border border-white/10 text-xs text-white hover:bg-white/5 transition-colors"
            >
              Details
            </button>
            <button
              onClick={toggleExpand}
              className="h-8 px-3 rounded-lg bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
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
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/5 bg-white/[0.02]">
          {/* Description */}
          {issue.description && (
            <div className="p-4 border-b border-white/5">
              <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Description
              </h4>
              <div className="text-sm text-neutral-300">
                <MarkdownContent content={issue.description} />
              </div>
            </div>
          )}

          {/* Create Bounty Form */}
          <div className="p-4">
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
