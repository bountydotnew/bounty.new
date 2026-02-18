'use client';

import { useQuery, useQueries, skipToken } from '@tanstack/react-query';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { Button } from '@bounty/ui/components/button';
import {
  ExternalLink,
  RefreshCw,
  Filter,
  ChevronDown,
  X,
  Inbox,
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgPath } from '@/hooks/use-org-path';
import { toast } from 'sonner';
import { Suspense, useState, useCallback } from 'react';
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
import type {
  LinearWorkflowState,
  LinearProject,
  LinearIssue,
} from '@bounty/api/driver/linear-client';

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

function useLinearIssuesData() {
  const { linearWorkspace, hasLinear, refreshLinear, isLinearLoading } =
    useIntegrations();

  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    projectId: null,
  });

  const [workflowStatesQuery, projectsQuery] = useQueries({
    queries: [
      trpc.linear.getWorkflowStates.queryOptions(
        hasLinear ? undefined : skipToken
      ),
      trpc.linear.getProjects.queryOptions(hasLinear ? undefined : skipToken),
    ],
  });

  const workflowStatesData = workflowStatesQuery.data;
  const projectsData = projectsQuery.data;

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
              priority:
                filters.priority.length > 0 ? filters.priority : undefined,
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

  const activeFilterCount =
    filters.status.length +
    filters.priority.length +
    (filters.projectId ? 1 : 0);

  const workflowStates: LinearWorkflowState[] =
    workflowStatesData?.states ?? [];
  const projects: LinearProject[] = projectsData?.projects ?? [];
  const issues: LinearIssue[] = issuesData?.issues ?? [];

  return {
    linearWorkspace,
    hasLinear,
    isLinearLoading,
    filters,
    workflowStates,
    projects,
    issues,
    issuesLoading,
    hasActiveFilters,
    activeFilterCount,
    handleRefresh,
    toggleStatusFilter,
    togglePriorityFilter,
    setProjectFilter,
    clearFilters,
  };
}

function LinearNotConnectedState() {
  const router = useRouter();
  const orgPath = useOrgPath();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
          <LinearIcon className="w-8 h-8 text-text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Connect Linear
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Connect your workspace to view issues
        </p>
        <Button
          onClick={() => router.push(orgPath('/integrations/linear'))}
          size="lg"
        >
          Go to Linear integration
        </Button>
      </div>
    </div>
  );
}

function IssuesPageHeader({
  issuesLoading,
  issues,
  linearWorkspaceUrl,
  isLinearLoading,
  onRefresh,
}: {
  issuesLoading: boolean;
  issues: LinearIssue[];
  linearWorkspaceUrl: string | undefined;
  isLinearLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary mb-1">Issues</h1>
        <p className="text-sm text-text-secondary">
          {issuesLoading
            ? '...'
            : `${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={linearWorkspaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-lg border border-border-subtle text-sm text-text-secondary hover:bg-surface-2 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Open in Linear</span>
        </a>

        <Button
          onClick={onRefresh}
          disabled={isLinearLoading}
          variant="outline"
          size="icon"
          aria-label="Refresh"
        >
          <RefreshCw
            className={cn('w-4 h-4', isLinearLoading && 'animate-spin')}
          />
        </Button>
      </div>
    </div>
  );
}

function IssuesFilterBar({
  filters,
  workflowStates,
  projects,
  hasActiveFilters,
  activeFilterCount,
  toggleStatusFilter,
  togglePriorityFilter,
  setProjectFilter,
  clearFilters,
}: {
  filters: FilterState;
  workflowStates: LinearWorkflowState[];
  projects: LinearProject[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
  toggleStatusFilter: (statusId: string) => void;
  togglePriorityFilter: (priority: number) => void;
  setProjectFilter: (projectId: string | null) => void;
  clearFilters: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <div className="flex items-center gap-2 text-text-muted">
        <Filter className="w-4 h-4" />
        <span className="text-sm">Filter</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.status.length > 0 ? 'secondary' : 'outline'}
            size="sm"
          >
            Status
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            {filters.status.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                {filters.status.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          {workflowStates.length > 0 ? (
            workflowStates.map((state: LinearWorkflowState) => (
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
          <Button
            variant={filters.priority.length > 0 ? 'secondary' : 'outline'}
            size="sm"
          >
            Priority
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            {filters.priority.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                {filters.priority.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {([0, 1, 2, 3, 4] as const).map((priority) => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={filters.priority.includes(priority)}
              onCheckedChange={() => togglePriorityFilter(priority)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    PRIORITY_COLORS[priority]
                  )}
                />
                {PRIORITY_LABELS[priority]}
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.projectId ? 'secondary' : 'outline'}
            size="sm"
          >
            Project
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            {filters.projectId && (
              <span className="w-5 h-5 rounded-full bg-surface-3 text-text-primary text-xs flex items-center justify-center">
                1
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          <DropdownMenuItem onClick={() => setProjectFilter(null)}>
            All projects
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {projects.length > 0 ? (
            projects.map((project: LinearProject) => (
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
        <Button onClick={clearFilters} variant="ghost" size="sm">
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear all</span>
          <span className="sm:hidden">{activeFilterCount}</span>
        </Button>
      )}
    </div>
  );
}

function IssuesList({
  issuesLoading,
  issues,
  hasActiveFilters,
  clearFilters,
  selectedIssueId,
  workspaceId,
}: {
  issuesLoading: boolean;
  issues: LinearIssue[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  selectedIssueId: string | null | undefined;
  workspaceId: string;
}) {
  if (issuesLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-border-default border-t-text-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center mb-3">
          <Inbox className="w-5 h-5 text-text-muted" />
        </div>
        <p className="text-sm text-text-primary">
          {hasActiveFilters ? 'No issues match your filters' : 'No issues yet'}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {hasActiveFilters
            ? 'Try adjusting your filters'
            : 'Issues from your workspace will appear here'}
        </p>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="mt-3"
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
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
  );
}

function LinearIssuesContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const selectedIssueId = searchParams?.get('issue');

  const {
    linearWorkspace,
    hasLinear,
    isLinearLoading,
    filters,
    workflowStates,
    projects,
    issues,
    issuesLoading,
    hasActiveFilters,
    activeFilterCount,
    handleRefresh,
    toggleStatusFilter,
    togglePriorityFilter,
    setProjectFilter,
    clearFilters,
  } = useLinearIssuesData();

  if (!hasLinear) {
    return <LinearNotConnectedState />;
  }

  return (
    <div>
      <IssuesPageHeader
        issuesLoading={issuesLoading}
        issues={issues}
        linearWorkspaceUrl={linearWorkspace?.url}
        isLinearLoading={isLinearLoading}
        onRefresh={handleRefresh}
      />

      <IssuesFilterBar
        filters={filters}
        workflowStates={workflowStates}
        projects={projects}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        toggleStatusFilter={toggleStatusFilter}
        togglePriorityFilter={togglePriorityFilter}
        setProjectFilter={setProjectFilter}
        clearFilters={clearFilters}
      />

      <IssuesList
        issuesLoading={issuesLoading}
        issues={issues}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        selectedIssueId={selectedIssueId}
        workspaceId={workspaceId}
      />
    </div>
  );
}

export default function LinearIssuesPage() {
  return (
    <Suspense fallback={null}>
      <LinearIssuesContent />
    </Suspense>
  );
}
