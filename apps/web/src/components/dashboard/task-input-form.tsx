'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner } from '@bounty/ui';
import { ArrowRight } from 'lucide-react';
import { trpc, trpcClient } from '@/utils/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
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
import GitHub from '@/components/icons/github';

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

interface TaskInputFormProps {
    placeholder?: string;
    onSubmit?: (value: string, repository?: string, branch?: string) => void;
}

export interface TaskInputFormRef {
    focus: () => void;
}

export const TaskInputForm = forwardRef<TaskInputFormRef, TaskInputFormProps>(({
    placeholder = 'Create a new bounty...',
}, ref) => {
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
        mode: 'onChange',
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
    } = useRepositories(githubUsername);

    const {
        filteredBranches,
        branchesLoading,
        branchSearchQuery,
        setBranchSearchQuery,
        selectedBranch,
        setSelectedBranch,
    } = useBranches(selectedRepository);

    const {
        issuesList,
        filteredIssues,
        issueQuery,
        setIssueQuery,
        repoInfo,
    } = useIssues(selectedRepository);

    // Issue selector state
    const [selectedIssue, setSelectedIssue] = useState<{ number: number; title: string; url: string } | null>(null);
    const [showImportPrompt, setShowImportPrompt] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Autofill prompt state (for issues)
    const [showAutofillPrompt, setShowAutofillPrompt] = useState(false);
    const [pendingAutofillIssue, setPendingAutofillIssue] = useState<{ number: number; title: string; url: string } | null>(null);
    const [pendingIssueData, setPendingIssueData] = useState<{ title?: string; body?: string } | null>(null);
    const isOpeningPromptRef = useRef(false);

    // Bounty creation mutation
    const createBounty = useMutation({
        mutationFn: async (input: CreateBountyForm) => {
            return await trpcClient.bounties.createBounty.mutate(input);
        },
        onSuccess: (result) => {
            toast.success('Bounty created successfully!');
            queryClient.invalidateQueries({
                queryKey: ['bounties'],
                type: 'all',
            });
            reset();
            setSelectedRepository('');
            setSelectedIssue(null);
            setIssueQuery('');
            if (result?.data?.id) {
                router.push(`/bounty/${result.data.id}`);
            } else {
                router.push(`/dashboard`);
            }
        },
        onError: (error: Error) => {
            toast.error(`Failed to create bounty: ${error.message}`);
        },
    });

    const onSubmit = formHandleSubmit(
        (data: CreateBountyForm) => {
            const formattedData = formatFormData.createBounty({
                ...data,
                repositoryUrl: selectedRepository ? `https://github.com/${selectedRepository}` : undefined,
                issueUrl: selectedIssue?.url,
            });
            
            createBounty.mutate(formattedData);
        },
        (errors) => {
            console.log('[TaskInputForm] Submit - validation errors:', errors);
        }
    );

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

    const handleImportIssue = async () => {
        if (!selectedIssue) {
            return;
        }
        setIsImporting(true);
        try {
            const result = await trpcClient.repository.issueFromUrl.query({ url: selectedIssue.url });
            if (result?.data) {
                if (result.data.title) {
                    setValue('title', result.data.title);
                }
                if (result.data.body) {
                    setValue('description', result.data.body);
                }
                toast.success('Issue details imported');
            }
        } catch {
            toast.error('Failed to import issue details');
        } finally {
            setIsImporting(false);
            setShowImportPrompt(false);
        }
    };

    const handleSkipImport = () => {
        setShowImportPrompt(false);
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
                            {(errors.title || errors.amount) && (
                                <div className="flex flex-row flex-wrap items-center gap-3 px-1">
                                    {errors.title && (
                                        <span className="text-red-500 text-xs">{errors.title.message}</span>
                                    )}
                                    {errors.amount && (
                                        <span className="text-red-500 text-xs">{errors.amount.message}</span>
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

                        {/* Bottom row with selectors and submit */}
                        <div className="flex flex-row justify-between items-center pt-2">
                            <div className="relative flex items-center gap-2">
                                <RepoSelector
                                    selectedRepository={selectedRepository}
                                    filteredRepositories={filteredRepositories}
                                    reposLoading={reposLoading}
                                    reposData={reposData}
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
                                                        filteredIssues={filteredIssues}
                                                        issuesList={issuesList}
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
        </div>
    );
});

TaskInputForm.displayName = 'TaskInputForm';
