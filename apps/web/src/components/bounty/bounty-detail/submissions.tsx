'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from '@bounty/ui/components/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check } from 'lucide-react';
import { Spinner } from '@bounty/ui';
import { PullRequestIcon } from '@bounty/ui/components/icons/huge/pull-request';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';
import { cn } from '@bounty/ui/lib/utils';
import {
  submissionSchema,
  type SubmissionForm,
  submissionDefaults,
} from '@bounty/ui/lib/forms';
import {
  usePullRequests,
  type PullRequestItem,
} from '@bounty/ui/hooks/usePullRequests';
import SubmissionCard from '@/components/bounty/submission-card';
import { useSession } from '@/context/session-context';
import { trpcClient } from '@/utils/trpc';
import { BountyDetailContext, type SubmissionData } from './context';
import { Textarea, Fieldset, Button } from '@bounty/ui';

/**
 * BountyDetailSubmissions
 *
 * Renders the submit-work form (above) and submissions list (below).
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
  const canManage =
    state.canEdit && isFundedOrFree && bounty.paymentStatus !== 'released';

  const submissionCount = submissions?.length ?? 0;

  const isAcceptingSubmissions =
    bounty.paymentStatus === 'held' ||
    bounty.paymentStatus === 'released' ||
    (isFreeBounty && bounty.paymentStatus === 'pending');
  const canSubmit =
    isAuthenticated &&
    !state.isCreator &&
    isAcceptingSubmissions &&
    bounty.paymentStatus !== 'released';

  const userHasSubmission =
    isAuthenticated &&
    submissions?.some(
      (sub: SubmissionData) => sub.contributorId === session?.user?.id
    );

  return (
    <div className="mb-8">
      {/* Submit form — above submissions, under relevant links */}
      {canSubmit && (
        <div className="py-6">
          <h3 className="mb-4 font-medium text-xl text-foreground">
            Submit your work
          </h3>
          <SubmitWorkForm
            onSubmit={actions.submitWork}
            isSubmitting={meta.isSubmittingWork}
            isDisabled={!!userHasSubmission}
            githubRepoOwner={bounty.githubRepoOwner ?? undefined}
            githubRepoName={bounty.githubRepoName ?? undefined}
          />
        </div>
      )}

      {/* Sign-in prompt for unauthenticated users */}
      {!isAuthenticated && (
        <div className="mb-6 mt-10">
          <div className="bg-surface-1 border border-border-subtle rounded-[21px] p-6 text-center">
            <Link
              href={`/login?callback=/bounty/${bounty.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 h-[34px] rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Sign in to submit your solution
            </Link>
          </div>
        </div>
      )}

      {/* Submissions heading + list */}
      <div className="rounded-lg py-6">
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
                githubPullRequestNumber={
                  sub.githubPullRequestNumber ?? undefined
                }
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
                  meta.isMergingSubmission &&
                  meta.mergingSubmissionId === sub.id
                }
                onApprove={() => actions.approveSubmission(sub.id)}
                onUnapprove={() => actions.unapproveSubmission(sub.id)}
                onMerge={() => actions.mergeSubmission(sub.id)}
                mergeLabel={isFreeBounty ? 'Complete' : 'Pay Out'}
                canWithdraw={
                  isAuthenticated &&
                  sub.contributorId === session?.user?.id &&
                  sub.status === 'pending'
                }
                isWithdrawing={
                  meta.isWithdrawingSubmission &&
                  meta.withdrawingSubmissionId === sub.id
                }
                onWithdraw={() => actions.withdrawSubmission(sub.id)}
              />
            ))
          ) : (
            <div className="rounded-lg bg-surface-2 p-6 text-center">
              <p className="text-text-muted text-sm">No submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * In-app submit form matching the task-input-form visual style.
 *
 * Uses react-hook-form + zodResolver with submissionSchema from @bounty/ui/lib/forms.
 *
 * Layout:
 *  - Top:  textarea (notes)
 *  - Bottom bar:  PR selector (left) + "Create submission" button (right)
 */
function SubmitWorkForm({
  onSubmit,
  isSubmitting,
  isDisabled,
  githubRepoOwner,
  githubRepoName,
}: {
  onSubmit: (pullRequestUrl: string, description?: string) => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  githubRepoOwner?: string;
  githubRepoName?: string;
}) {
  const hasRepo = !!(githubRepoOwner && githubRepoName);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedPr, setSelectedPr] = useState<PullRequestItem | null>(null);
  const [showManualInput, setShowManualInput] = useState(!hasRepo);

  const {
    control,
    handleSubmit: formHandleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: submissionDefaults,
  });

  const pullRequestUrl = watch('pullRequestUrl');

  const { pullRequestsList, filteredPullRequests, prQuery, setPrQuery } =
    usePullRequests(githubRepoOwner ?? '', githubRepoName ?? '', {
      listPullRequests: (params) =>
        trpcClient.repository.listPullRequests.query(params),
    });

  // Sync selected PR to form value
  useEffect(() => {
    if (selectedPr) {
      setValue('pullRequestUrl', selectedPr.html_url, {
        shouldValidate: false,
      });
    }
  }, [selectedPr, setValue]);

  const handleFormSubmit = formHandleSubmit((data: SubmissionForm) => {
    onSubmit(data.pullRequestUrl, data.notes?.trim() || undefined);
    setSelectedPr(null);
    reset();
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 300);
      textarea.style.height = `${newHeight}px`;
    }
  });

  const disabled = isSubmitting || isDisabled;

  return (
    <form onSubmit={handleFormSubmit} className="min-w-0 w-full">
      {/* Using raw fieldset with [all:unset] — same pattern as TaskInputForm */}
      <Fieldset disabled={disabled} className="w-full! min-w-full gap-0">
        {/* Top: textarea area */}
        <div
          className={cn(
            'bg-surface-1 text-text-tertiary border border-border-subtle rounded-t-[21px] border-b-0 relative transition-colors cursor-text overflow-hidden w-full min-w-0 p-4 flex flex-col gap-3',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Manual PR URL input (fallback when no repo or user toggled) */}
          {showManualInput && (
            <Controller
              control={control}
              name="pullRequestUrl"
              render={({ field }) => (
                <input
                  ref={field.ref}
                  type="url"
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  disabled={disabled}
                  className="bg-transparent text-foreground text-[14px] leading-5 outline-none placeholder:text-text-tertiary w-full"
                />
              )}
            />
          )}

          {/* Notes textarea — inline style (no border), same pattern as DescriptionTextarea */}
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <textarea
                ref={(e) => {
                  if (e) {
                    textareaRef.current = e;
                    field.ref(e);
                  }
                }}
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  const target = e.target;
                  target.style.height = 'auto';
                  const newHeight = Math.min(
                    Math.max(target.scrollHeight, 60),
                    300
                  );
                  target.style.height = `${newHeight}px`;
                }}
                placeholder="Add any other details you'd want the maintainers of this bounty to know..."
                disabled={disabled}
                maxLength={500}
                className="flex-1 min-h-[60px] bg-transparent text-foreground text-[16px] leading-6 outline-none resize-none placeholder:text-text-tertiary"
              />
            )}
          />

          {/* Error messages */}
          {(errors.pullRequestUrl || errors.notes) && (
            <div className="flex flex-col gap-1 px-1">
              {errors.pullRequestUrl && (
                <span className="text-red-500 text-xs">
                  {errors.pullRequestUrl.message}
                </span>
              )}
              {errors.notes && (
                <span className="text-red-500 text-xs">
                  {errors.notes.message}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar: PR selector + submit button */}
        <div
          className={cn(
            'bg-surface-1 border border-border-subtle border-t-0 rounded-b-[21px] w-full flex items-center justify-between gap-2 pb-3 px-[11px]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center flex-1 min-w-0 overflow-auto gap-2">
            {hasRepo && !showManualInput ? (
              <PrSelectorDropdown
                pullRequests={filteredPullRequests}
                isLoading={pullRequestsList.isLoading}
                selectedPr={selectedPr}
                onSelect={(pr) => {
                  setSelectedPr(pr);
                  setValue('pullRequestUrl', pr.html_url, {
                    shouldValidate: false,
                  });
                }}
                searchQuery={prQuery}
                onSearchChange={setPrQuery}
                disabled={disabled}
                onSwitchToManual={() => {
                  setShowManualInput(true);
                  setSelectedPr(null);
                  setValue('pullRequestUrl', '', { shouldValidate: false });
                }}
              />
            ) : hasRepo ? (
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setValue('pullRequestUrl', '', { shouldValidate: false });
                }}
                className="flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5 hover:bg-white/10"
              >
                <PullRequestIcon className="size-[18px]" />
                <span className="text-[14px] text-text-muted">
                  Select from PRs
                </span>
                <ChevronSortIcon className="size-2" />
              </button>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={disabled || !pullRequestUrl}
            className="flex items-center justify-center gap-1.5 px-4 h-[34px] rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <Spinner className="h-4 w-4 text-background" />
            ) : (
              <span>Create submission</span>
            )}
          </Button>
        </div>
      </Fieldset>
    </form>
  );
}

/**
 * PR selector dropdown — follows the same pattern as RepoBranchIssueSelector
 * using DropdownMenu from the design system.
 */
function PrSelectorDropdown({
  pullRequests,
  isLoading,
  selectedPr,
  onSelect,
  searchQuery,
  onSearchChange,
  disabled,
  onSwitchToManual,
}: {
  pullRequests: PullRequestItem[];
  isLoading: boolean;
  selectedPr: PullRequestItem | null;
  onSelect: (pr: PullRequestItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  disabled: boolean;
  onSwitchToManual: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
            'hover:bg-white/10',
            isOpen && 'bg-white/10'
          )}
        >
          <PullRequestIcon className="size-[18px]" />
          {selectedPr ? (
            <span className="text-[14px] text-foreground truncate max-w-[260px]">
              {selectedPr.title}{' '}
              <span className="text-text-muted">#{selectedPr.number}</span>
            </span>
          ) : (
            <span className="text-[14px] text-text-muted">Select PR</span>
          )}
          <ChevronSortIcon className="size-2 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 border-border-subtle bg-surface-1 text-text-secondary rounded-xl"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
            <PullRequestIcon className="size-4 text-text-tertiary" />
            <input
              className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
              placeholder="Search pull requests..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* PR list */}
          <div className="min-h-[120px] max-h-[250px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
              </div>
            ) : pullRequests.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-tertiary">
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
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors',
                    'hover:bg-white/10',
                    selectedPr?.number === pr.number && 'bg-white/5'
                  )}
                >
                  {selectedPr?.number === pr.number ? (
                    <Check className="size-3.5 text-green-500 shrink-0" />
                  ) : (
                    <PullRequestIcon className="size-3.5 text-green-500 shrink-0" />
                  )}
                  <span className="flex-1 text-sm text-text-secondary truncate">
                    #{pr.number}: {pr.title}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Manual input toggle */}
          <div className="border-t border-border-subtle px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onSwitchToManual();
                setIsOpen(false);
              }}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Paste a PR URL manually instead
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
