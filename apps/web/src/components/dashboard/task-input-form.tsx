'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner } from '@bounty/ui';
import { trpc, trpcClient } from '@/utils/trpc';
import { Popover, PopoverContent, PopoverTrigger } from '@bounty/ui/components/popover';
import {
    type CreateBountyForm,
    createBountyDefaults,
    createBountySchema,
    currencyOptions,
    formatFormData,
} from '@bounty/ui/lib/forms';
import { cn } from '@bounty/ui/lib/utils';
import { DatePicker } from '@bounty/ui/components/date-picker';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';

// Hooks
import { useRepositories } from '@bounty/ui/hooks/useRepositories';
import { useBranches } from '@bounty/ui/hooks/useBranches';
import { useIssues } from '@bounty/ui/hooks/useIssues';

// Components
import { TitleChip } from './task-form/components/TitleChip';
import { PriceChip } from './task-form/components/PriceChip';
import { DescriptionTextarea } from './task-form/components/DescriptionTextarea';
import { RepoSelector } from './task-form/components/RepoSelector';
import { BranchSelector } from './task-form/components/BranchSelector';
import { IssueSelector } from './task-form/components/IssueSelector';
import { FundBountyModal } from '@/components/payment/fund-bounty-modal';

type TaskInputFormProps = {};

export interface TaskInputFormRef {
    focus: () => void;
}

export const TaskInputForm = forwardRef<TaskInputFormRef, TaskInputFormProps>((_props, ref) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const { control, handleSubmit: formHandleSubmit, formState: { errors }, setValue, watch, reset } = form;
    const title = watch('title');
    const amount = watch('amount');

    // Get user data to fetch GitHub username
    const { data: userData } = useQuery(trpc.user.getMe.queryOptions());
    const githubUsername =
        (userData as { data?: { profile?: { githubUsername?: string } } })?.data
            ?.profile?.githubUsername;

    // Custom hooks for data fetching
    const {
        filteredRepositories,
        reposLoading,
        reposData,
        githubUsername: repoGithubUsername,
        repoSearchQuery,
        setRepoSearchQuery,
        selectedRepository,
        setSelectedRepository,
    } = useRepositories(githubUsername, {
        myReposQueryOptions: trpc.repository.myRepos.queryOptions() as unknown as Parameters<typeof useQuery>[0] as Parameters<typeof useQuery<unknown, Error>>[0],
    });

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

    const {
        issuesList,
        filteredIssues,
        issueQuery,
        setIssueQuery,
        repoInfo,
    } = useIssues(selectedRepository, {
        listIssues: (params) => trpcClient.repository.listIssues.query(params),
    });

    // Issue selector state
    const [selectedIssue, setSelectedIssue] = useState<{ number: number; title: string; url: string } | null>(null);

    // Autofill prompt state (for issues)
    const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);
    const [pendingAutofillIssue, setPendingAutofillIssue] = useState<{ number: number; title: string; url: string } | null>(null);
    const [pendingIssueData, setPendingIssueData] = useState<{ title?: string; body?: string } | null>(null);
    const isOpeningPromptRef = useRef(false);

    // Fund bounty modal state
    const [showFundModal, setShowFundModal] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<CreateBountyForm & { repositoryUrl?: string; issueUrl?: string } | null>(null);

    // Bounty creation mutation
    const createBounty = useMutation({
        mutationFn: async (input: CreateBountyForm & { payLater?: boolean }) => {
            return await trpcClient.bounties.createBounty.mutate({
                ...input,
                payLater: input.payLater ?? false,
            });
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: ['bounties'],
                type: 'all',
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
                repositoryUrl: selectedRepository ? `https://github.com/${selectedRepository}` : undefined,
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
        if (!pendingFormData) return;
        setShowFundModal(false);
        createBounty.mutate({ ...pendingFormData, payLater: true });
        setPendingFormData(null);
    };

    const handlePayWithStripe = () => {
        if (!pendingFormData) return;
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
        setRepoSearchQuery('');
        setSelectedIssue(null);
        setIssueQuery('');
    };

    const handleAutofill = (shouldAutofill: boolean) => {
        if (shouldAutofill && pendingAutofillIssue && pendingIssueData) {
            // Autofill with actual issue data
            if (pendingIssueData.title) {
                setValue('title', pendingIssueData.title);
            }
            if (pendingIssueData.body) {
                setValue('description', pendingIssueData.body);
            }
        }
        // Set the issue regardless
        if (pendingAutofillIssue) {
            setSelectedIssue(pendingAutofillIssue);
        }
        setShowAutofillPrompt(false);
        setPendingAutofillIssue(null);
        setPendingIssueData(null);
    };

    const handlePopoverOpenChange = (open: boolean) => {
        // Prevent auto-closing when issue is selected - only close on explicit user action
        if (open) {
            // Opening - ensure state is synced
            if (pendingAutofillIssue) {
                setShowAutofillPrompt(true);
            }
            return;
        }
        
        // If we're in the process of opening the prompt, ignore close events
        if (isOpeningPromptRef.current) {
            return;
        }
        
        // Closing - only close if we're currently showing the prompt
        if (!showAutofillPrompt) {
            return;
        }
        
        setShowAutofillPrompt(false);
        // If we have a pending issue and user dismissed, select it without autofill
        if (pendingAutofillIssue && !selectedIssue) {
            setSelectedIssue(pendingAutofillIssue);
        }
        setPendingAutofillIssue(null);
        setPendingIssueData(null);
    };

    const handleBranchSelect = (branch: string) => {
        setSelectedBranch(branch);
        setBranchSearchQuery('');
    };

    const handleIssueSelect = async (issue: { number: number; title: string }) => {
        if (!repoInfo) {
            return;
        }
        const issueUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issue.number}`;
        const issueWithUrl = { ...issue, url: issueUrl };
        
        setIssueQuery('');
        
        // Fetch issue data to check if there's content to autofill
        try {
            const result = await trpcClient.repository.issueFromUrl.query({ url: issueUrl });
            if (result?.data && (result.data.title || result.data.body)) {
                // There's actual data to autofill - show prompt
                setPendingAutofillIssue(issueWithUrl);
                setPendingIssueData(result.data);
                isOpeningPromptRef.current = true;
                setTimeout(() => {
                    setShowAutofillPrompt(true);
                    setTimeout(() => {
                        isOpeningPromptRef.current = false;
                    }, 200);
                }, 150);
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
            <form className="w-full flex flex-col mt-10 mb-6 min-w-0" onSubmit={onSubmit}>
                <fieldset className="w-full [all:unset] min-w-0">
                    <div
                        role="presentation"
                        className="bg-[#191919] text-[#5A5A5A] border border-[#232323] rounded-[21px] relative transition-colors cursor-text overflow-hidden w-full min-w-0 p-4 flex flex-col gap-3 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus-within:outline-none"
                    >
                        {/* Inline input chips row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-row flex-wrap items-center gap-[5px]">
                                <TitleChip control={control} />
                                <PriceChip control={control} />
                                
                                {/* Deadline chip */}
                                <div className="rounded-[7px] px-1.5 py-[3px] bg-[#201F1F] text-[#5A5A5A] text-[16px] leading-5 font-normal flex items-center gap-1 shrink-0">
                                    <CalendarIcon className="w-4 h-4 shrink-0" />
                                    <Controller
                                        control={control}
                                        name="deadline"
                                        render={({ field }) => (
                                            <DatePicker
                                                value={field.value}
                                                onChange={(value) => field.onChange(value || undefined)}
                                                placeholder="Deadline, e.g. tomorrow"
                                                className="min-w-[140px]"
                                                id="deadline"
                                            />
                                        )}
                                    />
                                </div>
                                
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
                                        <span className="text-red-500 text-xs">{errors.title.message}</span>
                                    )}
                                    {errors.amount && (
                                        <span className="text-red-500 text-xs">{errors.amount.message}</span>
                                    )}
                                    {errors.deadline && (
                                        <span className="text-red-500 text-xs">{errors.deadline.message}</span>
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
                                <span className="text-red-500 text-xs">{errors.description.message}</span>
                            </div>
                        )}

                        {/* Bottom row with selectors and submit */}
                        <div className="flex flex-row justify-between items-center pt-2">
                            <div className="relative flex items-center gap-2">
                                <RepoSelector
                                    selectedRepository={selectedRepository}
                                    filteredRepositories={filteredRepositories}
                                    reposLoading={reposLoading}
                                    reposData={reposData as { success: boolean; error?: string; data?: Array<{ name: string; url: string }> } | undefined}
                                    githubUsername={repoGithubUsername}
                                    repoSearchQuery={repoSearchQuery}
                                    setRepoSearchQuery={setRepoSearchQuery}
                                    onSelect={handleRepositorySelect}
                                />

                                {selectedRepository && (
                                    <>
                                        <div className="w-px h-4 bg-[#333]" />
                                        <BranchSelector
                                            selectedBranch={selectedBranch}
                                            filteredBranches={filteredBranches}
                                            branchesLoading={branchesLoading}
                                            branchSearchQuery={branchSearchQuery}
                                            setBranchSearchQuery={setBranchSearchQuery}
                                            onSelect={handleBranchSelect}
                                        />
                                    </>
                                )}

                                {selectedRepository && repoInfo && (
                                    <>
                                        <div className="w-px h-4 bg-[#333]" />
                                        <Popover open={showAutofillPrompt} onOpenChange={handlePopoverOpenChange} modal={false}>
                                            <PopoverTrigger asChild>
                                                <div className="inline-flex">
                                                    <IssueSelector
                                                        selectedIssue={selectedIssue}
                                                        filteredIssues={filteredIssues as Array<{ number: number; title: string }>}
                                                        issuesList={{
                                                            isLoading: issuesList.isLoading,
                                                            isFetching: issuesList.isFetching,
                                                            data: issuesList.data as Array<{ number: number; title: string }> | undefined,
                                                        }}
                                                        issueQuery={issueQuery}
                                                        setIssueQuery={setIssueQuery}
                                                        onSelect={handleIssueSelect}
                                                    />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-72 p-3 bg-[#191919] border-[#232323] rounded-xl shadow-[rgba(0,0,0,0.16)_0px_16px_40px_0px]"
                                                side="bottom"
                                                align="start"
                                                sideOffset={8}
                                            >
                                                <p className="text-[#CFCFCF] text-sm mb-3">
                                                    Would you like to autofill form fields based on{' '}
                                                    <span className="text-white font-medium">
                                                        {pendingAutofillIssue ? `#${pendingAutofillIssue.number}` : ''}
                                                    </span>?
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutofill(true)}
                                                        className="flex-1 px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                                                    >
                                                        Yes, autofill
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutofill(false)}
                                                        className="flex-1 px-3 py-1.5 bg-[#232323] text-[#CFCFCF] text-sm font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
                                                    >
                                                        No thanks
                                                    </button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={createBounty.isPending || !title || !amount}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 px-[13px] h-[31.9965px] rounded-full text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50",
                                    createBounty.isPending
                                        ? "bg-[#1a1a1a] cursor-wait"
                                        : title && amount
                                            ? "bg-white text-black cursor-pointer"
                                            : "bg-white text-black opacity-50 cursor-not-allowed"
                                )}
                            >
                                {createBounty.isPending ? (
                                    <Spinner size="sm" className="w-4 h-4" />
                                ) : (
                                    <span>Create bounty</span>
                                )}
                            </button>
                        </div>

                                {/* Issue import prompt */}
                                {/* <Dialog open={showImportPrompt} onOpenChange={setShowImportPrompt}>
                                    <DialogContent className="border border-[#232323] bg-[#191919] text-[#CFCFCF]">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#CFCFCF]">Import issue details?</DialogTitle>
                                            <DialogDescription className="text-[#5A5A5A]">
                                                Found issue #{selectedIssue?.number} in {selectedRepository}. Would you like to import the title and description?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex gap-2 justify-end mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={handleSkipImport}
                                                disabled={isImporting}
                                            >
                                                Skip
                                            </Button>
                                            <Button
                                                onClick={handleImportIssue}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? (
                                                    <>
                                                        <Spinner size="sm" className="mr-2" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    'Import'
                                                )}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog> */}
                    </div>
                </fieldset>
            </form>

            {/* Fund Bounty Modal */}
            {pendingFormData && (
                <FundBountyModal
                    open={showFundModal}
                    onOpenChange={setShowFundModal}
                    bountyAmount={Number(pendingFormData.amount) || 0}
                    onSkip={handleSkip}
                    onPayWithStripe={handlePayWithStripe}
                    onPayWithBalance={handlePayWithBalance}
                    isLoading={createBounty.isPending}
                />
            )}
        </div>
    );
});

TaskInputForm.displayName = 'TaskInputForm';
