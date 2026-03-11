'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SubmissionCard from '@/components/bounty/submission-card';
import { useSession } from '@/context/session-context';
import { BountyDetailContext, type SubmissionData } from './context';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Textarea } from '@bounty/ui/components/textarea';
import {
  Loader2,
  Send,
  ChevronDown,
  GitPullRequest,
  Check,
  Search,
} from 'lucide-react';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { trpcClient } from '@/utils/trpc';
import {
  usePullRequests,
  type PullRequestItem,
} from '@bounty/ui/hooks/usePullRequests';

/**
 * BountyDetailSubmissions
 *
 * Displays the list of submissions for the bounty
 * and an in-app form for solvers to submit their PR URL.
 */
export function BountyDetailSubmissions() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error(
      'BountyDetailSubmissions must be used within BountyDetailProvider'
    );
  }

  const { session } = useSession();
  const isAuthenticated = !!session?.user;

  const { state, actions, meta } = context;
  const { submissions, isSubmissionsLoading, bounty } = state;

  const isFreeBounty = bounty.amount === 0;
  const isFundedOrFree =
    bounty.paymentStatus === 'held' ||
    (isFreeBounty && bounty.paymentStatus === 'pending');
  // canManage: owner can approve/unapprove as long as bounty is funded (or free)
  // and not already completed (released)
  const canManage =
    state.canEdit && isFundedOrFree && bounty.paymentStatus !== 'released';

  const submissionCount = submissions?.length ?? 0;

  // Solvers can submit if:
  // - Authenticated
  // - Not the bounty creator
  // - Bounty is accepting submissions (open or free+draft)
  const isAcceptingSubmissions =
    bounty.paymentStatus === 'held' ||
    bounty.paymentStatus === 'released' ||
    (isFreeBounty && bounty.paymentStatus === 'pending');
  const canSubmit =
    isAuthenticated &&
    !state.isCreator &&
    isAcceptingSubmissions &&
    bounty.paymentStatus !== 'released';

  return (
    <div className="mb-8 rounded-lg py-6">
      <h3 className="mb-4 font-medium text-xl text-foreground">
        Submissions
        {submissionCount > 0 && (
          <span className="ml-2 text-sm text-text-muted">
            ({submissionCount})
          </span>
        )}
      </h3>

      <div className="space-y-4">
        {isSubmissionsLoading ? (
          <div className="text-center text-text-muted text-sm py-4">
            Loading submissions...
          </div>
        ) : submissions && submissions.length > 0 ? (
          submissions.map((sub: SubmissionData) => (
            <SubmissionCard
              key={sub.id}
              className="w-full"
              description={sub.description ?? undefined}
              status={
                sub.status as
                  | 'pending'
                  | 'approved'
                  | 'rejected'
                  | 'revision_requested'
              }
              username={sub.githubUsername ?? undefined}
              contributorName={sub.contributorName ?? undefined}
              contributorImage={sub.contributorImage ?? undefined}
              githubPullRequestNumber={sub.githubPullRequestNumber ?? undefined}
              githubRepoOwner={bounty.githubRepoOwner ?? undefined}
              githubRepoName={bounty.githubRepoName ?? undefined}
              pullRequestUrl={sub.pullRequestUrl ?? undefined}
              pullRequestTitle={sub.pullRequestTitle ?? undefined}
              githubHeadSha={sub.githubHeadSha ?? undefined}
              deliverableUrl={sub.deliverableUrl ?? undefined}
              canManage={canManage}
              isApproving={
                meta.isApprovingSubmission &&
                meta.approvingSubmissionId === sub.id
              }
              isUnapproving={
                meta.isUnapprovingSubmission &&
                meta.unapprovingSubmissionId === sub.id
              }
              isMerging={
                meta.isMergingSubmission && meta.mergingSubmissionId === sub.id
              }
              onApprove={() => actions.approveSubmission(sub.id)}
              onUnapprove={() => actions.unapproveSubmission(sub.id)}
              onMerge={() => actions.mergeSubmission(sub.id)}
              mergeLabel={isFreeBounty ? 'Complete' : 'Pay Out'}
            />
          ))
        ) : !canSubmit ? (
          <EmptyState
            isAuthenticated={isAuthenticated}
            bounty={bounty}
          />
        ) : null}

        {/* In-app submit form for solvers */}
        {canSubmit && (
          <SubmitWorkForm
            onSubmit={actions.submitWork}
            isSubmitting={meta.isSubmittingWork}
            hasExistingSubmissions={submissionCount > 0}
            githubRepoOwner={bounty.githubRepoOwner ?? undefined}
            githubRepoName={bounty.githubRepoName ?? undefined}
          />
        )}

        {/* Sign in prompt for unauthenticated users when there are submissions */}
        {!isAuthenticated && submissionCount > 0 && (
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-4 text-center">
            <Link
              href={`/login?callback=/bounty/${bounty.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Sign in to Submit Your Solution
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * In-app form for submitting work.
 * When a repo is linked, shows a PR dropdown selector.
 * Falls back to manual URL paste when no repo is linked.
 */
function SubmitWorkForm({
  onSubmit,
  isSubmitting,
  hasExistingSubmissions,
  githubRepoOwner,
  githubRepoName,
}: {
  onSubmit: (pullRequestUrl: string, description?: string) => void;
  isSubmitting: boolean;
  hasExistingSubmissions: boolean;
  githubRepoOwner?: string;
  githubRepoName?: string;
}) {
  const hasRepo = !!(githubRepoOwner && githubRepoName);

  const [selectedPr, setSelectedPr] = useState<PullRequestItem | null>(null);
  const [manualPrUrl, setManualPrUrl] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(!hasRepo);

  const { pullRequestsList, filteredPullRequests, prQuery, setPrQuery } =
    usePullRequests(githubRepoOwner ?? '', githubRepoName ?? '', {
      listPullRequests: (params) =>
        trpcClient.repository.listPullRequests.query(params),
    });

  const prUrl = selectedPr
    ? selectedPr.html_url
    : manualPrUrl.trim();

  const isValidPrUrl = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(
    prUrl
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!prUrl) {
      setError('Please select a pull request');
      return;
    }
    if (!isValidPrUrl) {
      setError(
        'Please enter a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)'
      );
      return;
    }

    onSubmit(prUrl, description.trim() || undefined);
    setSelectedPr(null);
    setManualPrUrl('');
    setDescription('');
    setShowDescription(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border-subtle bg-surface-2 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <GithubIcon className="h-4 w-4 text-text-secondary" />
        <span className="text-sm font-medium text-foreground">
          {hasExistingSubmissions
            ? 'Submit another solution'
            : 'Submit your solution'}
        </span>
      </div>

      <div className="space-y-3">
        {/* PR selector or manual input */}
        {hasRepo && !showManualInput ? (
          <div>
            <PullRequestSelector
              pullRequests={filteredPullRequests}
              isLoading={pullRequestsList.isLoading}
              selectedPr={selectedPr}
              onSelect={(pr) => {
                setSelectedPr(pr);
                setError('');
              }}
              searchQuery={prQuery}
              onSearchChange={setPrQuery}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => {
                setShowManualInput(true);
                setSelectedPr(null);
              }}
              className="mt-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Or paste a PR URL manually
            </button>
          </div>
        ) : (
          <div>
            <Input
              type="url"
              placeholder="https://github.com/owner/repo/pull/123"
              value={manualPrUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setManualPrUrl(e.target.value);
                if (error) setError('');
              }}
              className="border-border-default bg-background text-foreground placeholder:text-text-muted"
              disabled={isSubmitting}
            />
            {hasRepo && (
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualPrUrl('');
                }}
                className="mt-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Select from open PRs instead
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Optional description */}
        {showDescription ? (
          <div>
            <Textarea
              placeholder="Brief description of your changes (optional)"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              className="min-h-[60px] border-border-default bg-background text-foreground placeholder:text-text-muted"
              disabled={isSubmitting}
              maxLength={2000}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDescription(true)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
            Add description
          </button>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {hasRepo && !showManualInput
              ? 'Select your PR — we handle the rest.'
              : 'Paste your GitHub PR link — we handle the rest.'}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !prUrl}
            className="flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Dropdown selector for picking from open PRs.
 */
function PullRequestSelector({
  pullRequests,
  isLoading,
  selectedPr,
  onSelect,
  searchQuery,
  onSearchChange,
  disabled,
}: {
  pullRequests: PullRequestItem[];
  isLoading: boolean;
  selectedPr: PullRequestItem | null;
  onSelect: (pr: PullRequestItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className="flex w-full items-center gap-2 rounded-md border border-border-default bg-background px-3 py-2 text-sm transition-colors hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <GitPullRequest className="h-4 w-4 shrink-0 text-text-secondary" />
        {selectedPr ? (
          <span className="flex-1 truncate text-left text-foreground">
            <span className="text-text-muted">#{selectedPr.number}</span>{' '}
            {selectedPr.title}
          </span>
        ) : (
          <span className="flex-1 text-left text-text-muted">
            Select a pull request...
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border-subtle bg-surface-1 shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search PRs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-muted outline-none"
            />
          </div>

          {/* PR list */}
          <div className="max-h-[240px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              </div>
            ) : pullRequests.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-muted">
                {searchQuery
                  ? 'No PRs match your search'
                  : 'No open pull requests found'}
              </div>
            ) : (
              pullRequests.map((pr) => (
                <button
                  key={pr.number}
                  type="button"
                  onClick={() => {
                    onSelect(pr);
                    setIsOpen(false);
                    onSearchChange('');
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
                >
                  {selectedPr?.number === pr.number ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  ) : (
                    <GitPullRequest className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground">
                      {pr.title}
                    </div>
                    <div className="text-xs text-text-muted">
                      #{pr.number} by {pr.user}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no submissions exist and user can't submit.
 */
function EmptyState({
  isAuthenticated,
  bounty,
}: {
  isAuthenticated: boolean;
  bounty: {
    id: string;
    githubRepoOwner?: string | null;
    githubRepoName?: string | null;
    githubIssueNumber?: number | null;
  };
}) {
  return (
    <div className="rounded-lg bg-surface-2 p-6 text-center">
      <p className="text-text-muted text-sm mb-4">No submissions yet</p>
      {!isAuthenticated && (
        <Link
          href={`/login?callback=/bounty/${bounty.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Sign in to Submit Your Solution
        </Link>
      )}
    </div>
  );
}
