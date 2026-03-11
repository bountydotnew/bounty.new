'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import SubmissionCard from '@/components/bounty/submission-card';
import { useSession } from '@/context/session-context';
import { BountyDetailContext, type SubmissionData } from './context';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Textarea } from '@bounty/ui/components/textarea';
import { Loader2, Send, ChevronDown } from 'lucide-react';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';

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
 * Just paste a PR URL and optionally add a description.
 */
function SubmitWorkForm({
  onSubmit,
  isSubmitting,
  hasExistingSubmissions,
}: {
  onSubmit: (pullRequestUrl: string, description?: string) => void;
  isSubmitting: boolean;
  hasExistingSubmissions: boolean;
}) {
  const [prUrl, setPrUrl] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [error, setError] = useState('');

  const isValidPrUrl = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(
    prUrl.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = prUrl.trim();
    if (!trimmedUrl) {
      setError('Please enter a pull request URL');
      return;
    }
    if (!isValidPrUrl) {
      setError(
        'Please enter a valid GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)'
      );
      return;
    }

    onSubmit(trimmedUrl, description.trim() || undefined);
    // Reset form on success (mutation success will re-render)
    setPrUrl('');
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
          {hasExistingSubmissions ? 'Submit another solution' : 'Submit your solution'}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <Input
            type="url"
            placeholder="https://github.com/owner/repo/pull/123"
            value={prUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPrUrl(e.target.value);
              if (error) setError('');
            }}
            className="border-border-default bg-background text-foreground placeholder:text-text-muted"
            disabled={isSubmitting}
          />
          {error && (
            <p className="mt-1 text-xs text-red-500">{error}</p>
          )}
        </div>

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
            Paste your GitHub PR link — we handle the rest.
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !prUrl.trim()}
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
