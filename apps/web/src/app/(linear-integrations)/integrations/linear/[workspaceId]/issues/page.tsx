'use client';

import { useQuery, skipToken } from '@tanstack/react-query';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { ExternalLink, RefreshCw, Filter, ChevronDown, X, Inbox } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@bounty/ui/components/dropdown-menu';
import { LinearIssueCard } from './components/issue-card';
import { cn } from '@bounty/ui/lib/utils';

interface FilterState {
  status: string[];
  priority: number[];
  projectId: string | null;
}

const PRIORITY_LABELS: Record<number, string> = {
  4: 'Urgent',
  3: 'High',
  2: 'Medium',
  1: 'Low',
  0: 'No Priority',
};

const PRIORITY_COLORS: Record<number, string> = {
  4: 'bg-red-500',
  3: 'bg-orange-500',
  2: 'bg-yellow-500',
  1: 'bg-blue-500',
  0: 'bg-neutral-500',
};

export default function LinearIssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { linearWorkspace, hasLinear, refreshLinear, isLinearLoading } =
    useIntegrations();

  const selectedIssueId = searchParams?.get('issue');

  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    projectId: null,
  });

  const { data: workflowStatesData } = useQuery(
    trpc.linear.getWorkflowStates.queryOptions(
      hasLinear ? undefined : skipToken
    )
  );

  const { data: projectsData } = useQuery(
    trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken)
  );

  const {
    data: issuesData,
    isLoading: issuesLoading,
    refetch: refetchIssues,
  } = useQuery(
    trpc.linear.getIssues.queryOptions(
      hasLinear
        ? {
            filters: {
              status: filters.status.length > 0 ? filters.status : undefined,
              priority: filters.priority.length > 0 ? filters.priority : undefined,
              projectId: filters.projectId || undefined,
            },
            pagination: { first: 50 },
          }
        : skipToken
    )
  );

  const handleRefresh = () => {
    refreshLinear();
    refetchIssues();
    toast.success('Refreshed');
  };

  const toggleStatusFilter = useCallback((statusId: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(statusId)
        ? prev.status.filter((s) => s !== statusId)
        : [...prev.status, statusId],
    }));
  }, []);

  const togglePriorityFilter = useCallback((priority: number) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }));
  }, []);

  const setProjectFilter = useCallback((projectId: string | null) => {
    setFilters((prev) => ({ ...prev, projectId }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: [],
      priority: [],
      projectId: null,
    });
  }, []);

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.projectId !== null;

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
            Connect your workspace to view issues
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

  const workflowStates = workflowStatesData?.states ?? [];
  const projects = projectsData?.projects ?? [];
  const issues = issuesData?.issues ?? [];

  const activeFilterCount =
    filters.status.length + filters.priority.length + (filters.projectId ? 1 : 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary mb-1">Issues</h1>
          <p className="text-sm text-text-secondary">
            {issuesLoading ? '...' : `${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={linearWorkspace?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Open in Linear</span>
          </a>

          <button
            onClick={handleRefresh}
            disabled={isLinearLoading}
            className="h-9 px-3 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-2 transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLinearLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-text-muted">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filter</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'h-8 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors',
              filters.status.length > 0
                ? 'bg-surface-1 border-border-default text-text-primary'
                : 'border-border-subtle text-text-secondary hover:bg-surface-2'
            )}>
              Status
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              {filters.status.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                  {filters.status.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            {workflowStates.length > 0 ? (
              workflowStates.map((state: any) => (
                <DropdownMenuCheckboxItem
                  key={state.id}
                  checked={filters.status.includes(state.id)}
                  onCheckedChange={() => toggleStatusFilter(state.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: state.color }}
                    />
                    {state.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-text-tertiary">
                No states available
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'h-8 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors',
              filters.priority.length > 0
                ? 'bg-surface-1 border-border-default text-text-primary'
                : 'border-border-subtle text-text-secondary hover:bg-surface-2'
            )}>
              Priority
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              {filters.priority.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                  {filters.priority.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {([0, 1, 2, 3, 4] as const).map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={filters.priority.includes(priority)}
                onCheckedChange={() => togglePriorityFilter(priority)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[priority])} />
                  {PRIORITY_LABELS[priority]}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'h-8 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors',
              filters.projectId
                ? 'bg-surface-1 border-border-default text-text-primary'
                : 'border-border-subtle text-text-secondary hover:bg-surface-2'
            )}>
              Project
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              {filters.projectId && (
                <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuItem onClick={() => setProjectFilter(null)}>
              All projects
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {projects.length > 0 ? (
              projects.map((project: any) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setProjectFilter(project.id)}
                >
                  {project.name}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-text-tertiary">
                No projects available
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-3 rounded-lg border border-border-subtle text-sm text-text-muted hover:text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear all</span>
            <span className="sm:hidden">{activeFilterCount}</span>
          </button>
        )}
      </div>

      {/* Issues List */}
      {issuesLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-border-default border-t-text-primary rounded-full animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-3">
            <Inbox className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm text-text-primary">
            {hasActiveFilters
              ? 'No issues match your filters'
              : 'No issues yet'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Issues from your workspace will appear here'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <LinearIssueCard
              key={issue.id}
              issue={issue}
              isExpanded={selectedIssueId === issue.id}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
