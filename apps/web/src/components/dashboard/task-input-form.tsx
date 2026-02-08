'use client';

import {
  useMutation,
  useQueryClient,
  type useQuery,
} from '@tanstack/react-query';
import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner, GithubIcon } from '@bounty/ui';
import { trpc, trpcClient } from '@/utils/trpc';
import Link from 'next/link';
import { useActiveOrg } from '@/hooks/use-active-org';
import {
  type CreateBountyForm,
  createBountyDefaults,
  createBountySchema,
  currencyOptions,
  formatFormData,
} from '@bounty/ui/lib/forms';

// Hooks
import { useGitHubInstallationRepositories } from '@/hooks/use-github-installation-repos';
import { useBranches } from '@bounty/ui/hooks/useBranches';
import { useIssues } from '@bounty/ui/hooks/useIssues';

// Components
import { TitleChip } from './task-form/components/TitleChip';
import { PriceChip } from './task-form/components/PriceChip';
import { DeadlineChip } from './task-form/components/DeadlineChip';
import { DescriptionTextarea } from './task-form/components/DescriptionTextarea';
import { RepoBranchIssueSelector } from './task-form/components/RepoBranchIssueSelector';
import { FundBountyModal } from '@/components/payment/fund-bounty-modal';

type TaskInputFormProps = {
  onSubmit?: (data: CreateBountyForm) => void;
};

export interface TaskInputFormRef {
  focus: () => void;
}

export const TaskInputForm = forwardRef<TaskInputFormRef, TaskInputFormProps>(
  (_props, ref) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { orgUrl } = useActiveOrg();

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      },
    }));

    // Form state
    const form = useForm<CreateBountyForm>({
      resolver: zodResolver(createBountySchema),
      mode: 'onSubmit',
      reValidateMode: 'onSubmit',
      defaultValues: {
        ...createBountyDefaults,
        description: '',
      },
    });

    const {
      control,
      handleSubmit: formHandleSubmit,
      formState: { errors },
      watch,
      reset,
    } = form;
    const title = watch('title');
    const amount = watch('amount');

    // Custom hooks for data fetching - use GitHub App installations
    const {
      installations,
      installationRepos,
      filteredInstallations,
      installationsLoading,
      accountSearchQuery,
      setAccountSearchQuery,
      selectedRepository,
      setSelectedRepository,
    } = useGitHubInstallationRepositories();

    const {
      filteredBranches,
      branchesLoading,
      branchSearchQuery,
      setBranchSearchQuery,
      selectedBranch,
      setSelectedBranch,
    } = useBranches(selectedRepository, {
      defaultBranchQueryOptions: {
        ...trpc.repository.defaultBranch.queryOptions({
          repo: selectedRepository,
        }),
      } as Parameters<typeof useQuery>[0],
      branchesQueryOptions: {
        ...trpc.repository.branches.queryOptions({
          repo: selectedRepository,
        }),
      } as Parameters<typeof useQuery>[0],
    });

    const { issuesList, filteredIssues, issueQuery, setIssueQuery, repoInfo } =
      useIssues(selectedRepository, {
        listIssues: (params) => trpcClient.repository.listIssues.query(params),
      });

    // Issue selector state
    const [selectedIssue, setSelectedIssue] = useState<{
      number: number;
      title: string;
      url: string;
    } | null>(null);

    // Autofill prompt state (for issues)

    // Fund bounty modal state
    const [showFundModal, setShowFundModal] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<
      (CreateBountyForm & { repositoryUrl?: string; issueUrl?: string }) | null
    >(null);

    // Bounty creation mutation
    const createBounty = useMutation({
      mutationFn: async (input: CreateBountyForm & { payLater?: boolean }) => {
        return await trpcClient.bounties.createBounty.mutate({
          ...input,
          payLater: input.payLater ?? false,
        });
      },
      onSuccess: (result) => {
        // Invalidate specific bounty queries rather than all bounty queries
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'fetchAllBounties']],
        });
        queryClient.invalidateQueries({
          queryKey: [['bounties', 'fetchMyBounties']],
        });

        if (result?.data?.id) {
          if (result.checkoutUrl && !result.payLater) {
            // Close modal before redirect
            setShowFundModal(false);
            setPendingFormData(null);
            // Redirect to Stripe Checkout
            window.location.href = result.checkoutUrl;
          } else if (result.payLater) {
            // Pay later - just redirect
            setShowFundModal(false);
            setPendingFormData(null);
            toast.success('Bounty created! Complete payment to make it live.');
            reset();
            setSelectedRepository('');
            setSelectedIssue(null);
            setIssueQuery('');
            router.push(`/bounty/${result.data.id}`);
          } else {
            // Shouldn't happen, but handle it
            setShowFundModal(false);
            setPendingFormData(null);
            toast.success('Bounty created successfully!');
            reset();
            setSelectedRepository('');
            setSelectedIssue(null);
            setIssueQuery('');
            router.push(`/bounty/${result.data.id}`);
          }
        } else {
          setShowFundModal(false);
          setPendingFormData(null);
          router.push('/dashboard');
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to create bounty: ${error.message}`);
        // Keep modal open on error so user can retry
      },
    });

    const onSubmit = formHandleSubmit(
      (data: CreateBountyForm) => {
        const formattedData = formatFormData.createBounty({
          ...data,
          repositoryUrl: selectedRepository
            ? `https://github.com/${selectedRepository}`
            : undefined,
          issueUrl: selectedIssue?.url,
        });

        // Store formatted data and show funding modal
        setPendingFormData(formattedData);
        setShowFundModal(true);
      },
      (errors) => {
        console.log('[TaskInputForm] Submit - validation errors:', errors);
      }
    );

    const handleSkip = () => {
      if (!pendingFormData) {
        return;
      }
      setShowFundModal(false);
      createBounty.mutate({ ...pendingFormData, payLater: true });
      setPendingFormData(null);
    };

    const handlePayWithStripe = () => {
      if (!pendingFormData) {
        return;
      }
      // Don't close modal yet - let it stay open until redirect happens
      createBounty.mutate({ ...pendingFormData, payLater: false });
      // Modal will close automatically when redirect happens
    };

    const handlePayWithBalance = () => {
      // Future implementation for paying with award balance
      // For now, default to Stripe
      handlePayWithStripe();
    };

    const handleRepositorySelect = (repo: string) => {
      setSelectedRepository(repo);
      setSelectedIssue(null);
      setIssueQuery('');
    };

    const handleBranchSelect = (branch: string) => {
      setSelectedBranch(branch);
      setBranchSearchQuery('');
    };

    const handleIssueSelect = async (issue: {
      number: number;
      title: string;
    }) => {
      if (!repoInfo) {
        return;
      }
      const issueUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issue.number}`;
      const issueWithUrl = { ...issue, url: issueUrl };

      setIssueQuery('');

      // Fetch issue data to check if there's content to autofill
      try {
        const result = await trpcClient.repository.issueFromUrl.query({
          url: issueUrl,
        });
        if (result?.data && (result.data.title || result.data.body)) {
          // There's actual data to autofill - show prompt
          setSelectedIssue(issueWithUrl);
        } else {
          // No data to autofill - just select the issue
          setSelectedIssue(issueWithUrl);
        }
      } catch {
        // If fetch fails, just select the issue
        setSelectedIssue(issueWithUrl);
      }
    };

    return (
      <div className="flex w-full shrink-0 flex-col px-4 lg:max-w-[805px] xl:px-0 mx-auto min-w-0">
        <form
          className="w-full flex flex-col mt-3 mb-3 md:mt-10 md:mb-6 min-w-0"
          onSubmit={onSubmit}
        >
          <fieldset className="w-full [all:unset] min-w-0">
            <div
              role="presentation"
              className="bg-surface-1 text-text-tertiary border border-border-subtle rounded-[21px] relative transition-colors cursor-text overflow-hidden w-full min-w-0 p-4 flex flex-col gap-3 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus-within:outline-none"
            >
              {/* Inline input chips row */}
              <div className="flex flex-col gap-1">
                <div className="flex flex-row flex-wrap items-center gap-[5px]">
                  <TitleChip control={control} />
                  <PriceChip control={control} />
                  <DeadlineChip control={control} />

                  {/* Currency selector - hidden but kept for form */}
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <select {...field} className="hidden">
                        {currencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Error messages below chips */}
                {(errors.title || errors.amount || errors.deadline) && (
                  <div className="flex flex-row flex-wrap items-center gap-3 px-1">
                    {errors.title && (
                      <span className="text-red-500 text-xs">
                        {errors.title.message}
                      </span>
                    )}
                    {errors.amount && (
                      <span className="text-red-500 text-xs">
                        {errors.amount.message}
                      </span>
                    )}
                    {errors.deadline && (
                      <span className="text-red-500 text-xs">
                        {errors.deadline.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Main textarea for description */}
              <DescriptionTextarea
                control={control}
                placeholder="Start typing your description..."
                textareaRef={textareaRef}
              />

              {/* Description error message */}
              {errors.description && (
                <div className="px-1 pt-1">
                  <span className="text-red-500 text-xs">
                    {errors.description.message}
                  </span>
                </div>
              )}

              {/* Bottom row with selectors and submit */}
              <div className="flex flex-row justify-between items-center pt-2 gap-2">
                <div className="relative flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
                  {/* Unified Repo/Branch/Issue selector */}
                  {installations.length > 0 && (
                    <RepoBranchIssueSelector
                      selectedRepository={selectedRepository}
                      selectedBranch={selectedBranch}
                      selectedIssue={selectedIssue}
                      installations={filteredInstallations}
                      installationRepos={installationRepos}
                      filteredBranches={filteredBranches}
                      filteredIssues={
                        filteredIssues as Array<{
                          number: number;
                          title: string;
                        }>
                      }
                      branchesLoading={branchesLoading}
                      issuesList={{
                        isLoading: issuesList.isLoading,
                        isFetching: issuesList.isFetching,
                        data: issuesList.data as
                          | Array<{ number: number; title: string }>
                          | undefined,
                      }}
                      accountSearchQuery={accountSearchQuery}
                      setAccountSearchQuery={setAccountSearchQuery}
                      branchSearchQuery={branchSearchQuery}
                      setBranchSearchQuery={setBranchSearchQuery}
                      issueQuery={issueQuery}
                      setIssueQuery={setIssueQuery}
                      onSelectRepo={handleRepositorySelect}
                      onSelectBranch={handleBranchSelect}
                      onSelectIssue={handleIssueSelect}
                      openStep="repos"
                    />
                  )}
                </div>

                {/* Connect GitHub button (when no installations) or Submit button */}
                {!installationsLoading && installations.length === 0 ? (
                  <Link
                    href={orgUrl('/integrations')}
                    className="flex items-center justify-center gap-2 px-4 h-[34px] rounded-full text-[15px] font-medium bg-surface-3 hover:bg-surface-hover border border-border-default hover:border-border-strong text-foreground transition-colors shrink-0"
                  >
                    <GithubIcon className="size-4" />
                    <span className="hidden sm:inline">Connect GitHub</span>
                    <span className="sm:hidden">Connect</span>
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={createBounty.isPending || !title || !amount}
                    className="flex items-center justify-center gap-1.5 px-4 h-[34px] rounded-full text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {createBounty.isPending ? (
                      <Spinner className="h-4 w-4 text-background" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Create bounty</span>
                        <span className="sm:hidden">Create</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </fieldset>
        </form>

        {/* Fund Bounty Modal */}
        {pendingFormData && (
          <FundBountyModal
            open={showFundModal}
            onOpenChange={setShowFundModal}
            onSkip={handleSkip}
            onPayWithStripe={handlePayWithStripe}
            onPayWithBalance={handlePayWithBalance}
            isLoading={createBounty.isPending}
          />
        )}
      </div>
    );
  }
);

TaskInputForm.displayName = 'TaskInputForm';
