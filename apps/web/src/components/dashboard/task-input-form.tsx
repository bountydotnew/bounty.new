'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    GithubIcon,
    BranchIcon,
    ChevronDoubleIcon,
    Spinner,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    ArrowDownIcon2,
} from '@bounty/ui';
import { Input } from '@bounty/ui/components/input';
import { trpc, trpcClient } from '@/utils/trpc';
import { parseRepo, GITHUB_URL_REGEX } from '@/utils/utils';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import { Tooltip, TooltipContent, TooltipTrigger } from '@bounty/ui/components/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { Eye, EyeOff } from 'lucide-react';
import {
    type CreateBountyForm,
    createBountyDefaults,
    createBountySchema,
    currencyOptions,
    difficultyOptions,
    formatFormData,
} from '@bounty/ui/lib/forms';

interface TaskInputFormProps {
    placeholder?: string;
    onSubmit?: (value: string, repository?: string, branch?: string) => void;
}

export interface TaskInputFormRef {
    focus: () => void;
}

// Step 1: Description Form Component
interface Step1DescriptionFormProps {
    placeholder: string;
    control: ReturnType<typeof useForm<CreateBountyForm>>['control'];
    description: string;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    showRawMarkdown: boolean;
    setShowRawMarkdown: (show: boolean) => void;
    selectedRepository: string;
    selectedBranch: string;
    repoSearchQuery: string;
    setRepoSearchQuery: (query: string) => void;
    branchSearchQuery: string;
    setBranchSearchQuery: (query: string) => void;
    issueQuery: string;
    setIssueQuery: (query: string) => void;
    selectedIssue: { number: number; title: string; url: string } | null;
    githubUsername: string | undefined;
    reposLoading: boolean;
    filteredRepositories: string[];
    branchesLoading: boolean;
    filteredBranches: string[];
    issuesList: { isLoading: boolean; isFetching: boolean; data?: Array<{ number: number; title: string }> };
    filteredIssues: Array<{ number: number; title: string }>;
    handleRepositorySelect: (repo: string) => void;
    handleBranchSelect: (branch: string) => void;
    handleIssueSelect: (issue: { number: number; title: string }) => void;
    repoInfo: { owner: string; repo: string } | null;
}

function Step1DescriptionForm({
    placeholder,
    control,
    description,
    textareaRef,
    showRawMarkdown,
    setShowRawMarkdown,
    selectedRepository,
    selectedBranch,
    repoSearchQuery,
    setRepoSearchQuery,
    branchSearchQuery,
    setBranchSearchQuery,
    issueQuery,
    setIssueQuery,
    selectedIssue,
    githubUsername,
    reposLoading,
    filteredRepositories,
    branchesLoading,
    filteredBranches,
    issuesList,
    filteredIssues,
    handleRepositorySelect,
    handleBranchSelect,
    handleIssueSelect,
    repoInfo,
}: Step1DescriptionFormProps) {
    return (
        <div className="flex flex-col">
                <div className="flex flex-col h-full">
                    <div className="flex flex-col overflow-x-hidden min-w-0 relative">
                        {showRawMarkdown ? (
                            <Controller
                                control={control}
                                name="description"
                                        render={({ field }) => (
                                    <textarea
                                        ref={(e) => {
                                            if (e) {
                                                textareaRef.current = e;
                                                field.ref(e);
                                            }
                                        }}
                                        className="flex flex-col text-base border-none p-3.5 min-h-[120px] max-h-[400px] resize-y shadow-none focus:ring-0 focus:outline-none w-full overflow-x-hidden overflow-y-auto bg-transparent text-[#5A5A5A] placeholder:text-[#5A5A5A]"
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                            const target = e.target;
                                            target.style.height = 'auto';
                                            const newHeight = Math.min(Math.max(target.scrollHeight, 120), 400);
                                            target.style.height = `${newHeight}px`;
                                        }}
                                        placeholder={placeholder}
                                        rows={4}
                                        value={field.value}
                                    />
                                )}
                            />
                        ) : (
                            <div className="p-3.5 min-h-[120px] max-h-[400px] overflow-y-auto">
                                {description ? (
                                    <MarkdownContent content={description} />
                                ) : (
                                    <div className="text-[#5A5A5A]">{placeholder}</div>
                                )}
                            </div>
                        )}
                        
                        <div className="absolute top-2 right-2 z-10">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className={`p-1.5 rounded-md transition-colors ${
                                            showRawMarkdown
                                                ? 'text-[#5A5A5A] hover:text-[#CFCFCF]'
                                                : 'text-white'
                                        }`}
                                        onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                                        type="button"
                                    >
                                        {showRawMarkdown ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {showRawMarkdown ? 'Show rendered markdown' : 'Show raw markdown'}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <div className="px-3 pb-3 flex items-center gap-2 flex-row min-w-0 bg-transparent">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-[#323232] active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full overflow-hidden max-w-[200px] sm:max-w-none"
                                    type="button"
                                >
                                    <GithubIcon className="text-[#5A5A5A]" />
                                    <div className="hidden sm:flex gap-0.5 text-sm font-medium items-center text-foreground-strong [&_svg]:size-2 overflow-hidden">
                                        <span className="truncate">
                                            {selectedRepository || 'Select repository'}
                                        </span>
                                    </div>
                                    <ChevronDoubleIcon className="!size-3.5 !text-[#5A5A5A] ml-auto shrink-0" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
                                align="start"
                                side="bottom"
                            >
                                <div className="p-1">
                                    <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                                        <input
                                            className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Search repositories"
                                            value={repoSearchQuery}
                                            onChange={(e) => setRepoSearchQuery(e.target.value)}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            spellCheck={false}
                                        />
                                    </div>
                                    <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                                    <div className="overflow-x-hidden flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                                        {reposLoading ? (
                                            <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                Loading repositories...
                                            </div>
                                        ) : filteredRepositories.length > 0 ? (
                                            filteredRepositories.map((repo: string) => (
                                                <DropdownMenuItem
                                                    key={repo}
                                                    className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                                                    onClick={() => handleRepositorySelect(repo)}
                                                    data-selected={selectedRepository === repo}
                                                >
                                                    <GithubIcon className="size-4 text-[#5A5A5A]" />
                                                    <span className="text-[#CFCFCF] truncate block overflow-hidden">
                                                        {repo}
                                                    </span>
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                {githubUsername
                                                    ? 'No repositories found'
                                                    : 'Connect GitHub to see repositories'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {branchesLoading ? (
                            <button
                                className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-(--icon-pad) relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-interactive-state-hover active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full opacity-50 cursor-not-allowed"
                                disabled
                                type="button"
                            >
                                <Spinner size="sm" className="ml-1 mr-2" />
                                <span>Finding branches...</span>
                            </button>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-[#323232] active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full shadow-hidden max-w-[150px] sm:max-w-none"
                                        type="button"
                                    >
                                        <BranchIcon className="shrink-0 text-[#5A5A5A]" />
                                        <div className="hidden sm:flex gap-0.5 items-center [&_svg]:size-2 overflow-hidden">
                                            <span className="truncate text-foreground-strong">
                                                {selectedBranch}
                                            </span>
                                            <ChevronDoubleIcon className="!size-3.5 !text-[#5A5A5A] shrink-0" />
                                        </div>
                                        <ChevronDoubleIcon className="sm:hidden !size-3.5 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
                                    align="start"
                                    side="bottom"
                                >
                                    <div className="p-1">
                                        <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                                            <input
                                                className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Search branches"
                                                value={branchSearchQuery}
                                                onChange={(e) => setBranchSearchQuery(e.target.value)}
                                                autoComplete="off"
                                                autoCorrect="off"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                                        <div className="overflow-x-hidden flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                                            {selectedRepository ? (
                                                filteredBranches.length > 0 ? (
                                                    filteredBranches.map((branch: string) => (
                                                        <DropdownMenuItem
                                                            key={branch}
                                                            className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                                                            onClick={() => handleBranchSelect(branch)}
                                                            data-selected={selectedBranch === branch}
                                                        >
                                                            <GithubIcon className="size-4 text-[#5A5A5A]" />
                                                            <span className="text-[#CFCFCF] truncate block overflow-hidden">
                                                                {branch}
                                                            </span>
                                                        </DropdownMenuItem>
                                                    ))
                                                ) : (
                                                    <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                        No branches found
                                                    </div>
                                                )
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                    Select a repository first
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {selectedRepository && repoInfo && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-[#323232] active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full shadow-hidden max-w-[150px] sm:max-w-none"
                                        type="button"
                                    >
                                        <GithubIcon className="shrink-0 text-[#5A5A5A]" />
                                        <div className="hidden sm:flex gap-0.5 items-center [&_svg]:size-2 overflow-hidden">
                                            <span className="truncate text-foreground-strong">
                                                {selectedIssue ? `#${selectedIssue.number}` : 'Issue'}
                                            </span>
                                            <ChevronDoubleIcon className="!size-3.5 !text-[#5A5A5A] shrink-0" />
                                        </div>
                                        <ChevronDoubleIcon className="sm:hidden !size-3.5 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
                                    align="start"
                                    side="bottom"
                                >
                                    <div className="p-1">
                                        <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                                            <input
                                                className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Search issues"
                                                value={issueQuery}
                                                onChange={(e) => setIssueQuery(e.target.value)}
                                                autoComplete="off"
                                                autoCorrect="off"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                                        <div className="overflow-x-hidden flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                                            {issuesList.isLoading || issuesList.isFetching ? (
                                                <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                    Loading issues...
                                                </div>
                                            ) : filteredIssues.length > 0 ? (
                                                filteredIssues.map((issue: { number: number; title: string }) => (
                                                    <DropdownMenuItem
                                                        key={issue.number}
                                                        className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                                                        onClick={() => handleIssueSelect(issue)}
                                                        data-selected={selectedIssue?.number === issue.number}
                                                    >
                                                        <GithubIcon className="size-4 text-[#5A5A5A]" />
                                                        <span className="text-[#CFCFCF] truncate block overflow-hidden">
                                                            #{issue.number}: {issue.title}
                                                        </span>
                                                    </DropdownMenuItem>
                                                ))
                                            ) : issueQuery.length > 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                    No issues found
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                                    No open issues
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <button
                        className="text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-white bg-[#656565] hover:bg-[#757575] active:bg-[#6D6D6D] px-[6px] py-[4px] w-[40px] h-[28px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.22),0_-1px_2px_0_rgba(255,255,255,0.12)_inset,0_1px_2px_0_rgba(255,255,255,0.16)_inset] shrink-0"
                        type="submit"
                    >
                        <ArrowDownIcon2 className="w-5 h-5 text-white/80" />
                    </button>
                </div>
            </div>
    );
}

// Step 2: Details Form Component
interface Step2DetailsFormProps {
    control: ReturnType<typeof useForm<CreateBountyForm>>['control'];
    errors: ReturnType<typeof useForm<CreateBountyForm>>['formState']['errors'];
    setStep: (step: 'description' | 'details') => void;
    createBounty: { isPending: boolean };
}

function Step2DetailsForm({
    control,
    errors,
    setStep,
    createBounty,
}: Step2DetailsFormProps) {
    return (
        <div className="flex flex-col p-3.5">
            <div className="flex items-center mb-4 px-0.5">
                <span className="text-sm text-[#5A5A5A]">Step 2 of 2</span>
            </div>

            <div className="space-y-4">
                <div>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="bg-transparent border-none text-[#CFCFCF] placeholder:text-[#5A5A5A] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] rounded-md"
                                id="title"
                                placeholder="Title *"
                            />
                        )}
                    />
                    {errors.title && (
                        <p className="mt-1 text-red-500 text-sm px-0.5">{errors.title.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Controller
                            control={control}
                            name="amount"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    className="bg-transparent border-none text-[#CFCFCF] placeholder:text-[#5A5A5A] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] rounded-md"
                                    id="amount"
                                    placeholder="Amount *"
                                />
                            )}
                        />
                        {errors.amount && (
                            <p className="mt-1 text-red-500 text-sm px-0.5">{errors.amount.message}</p>
                        )}
                    </div>
                    <div>
                        <Controller
                            control={control}
                            name="currency"
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className="w-full bg-transparent border-none text-[#CFCFCF] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] cursor-pointer rounded-md"
                                    id="currency"
                                >
                                    {currencyOptions.map((option) => (
                                        <option key={option.value} value={option.value} className="bg-[#191919] text-[#CFCFCF]">
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>
                </div>

                <div>
                    <Controller
                        control={control}
                        name="difficulty"
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`w-full bg-transparent border-none text-[#CFCFCF] focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] cursor-pointer rounded-md ${errors.difficulty ? 'text-red-500' : ''}`}
                                id="difficulty"
                            >
                                {difficultyOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-[#191919] text-[#CFCFCF]">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.difficulty && (
                        <p className="mt-1 text-red-500 text-sm px-0.5">{errors.difficulty.message}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#232323]">
                <button
                    className="text-sm px-3 py-1.5 rounded-full text-[#5A5A5A] hover:text-[#CFCFCF] hover:bg-[#232323] transition-colors"
                    onClick={() => setStep('description')}
                    type="button"
                >
                    Back
                </button>
                <button
                    className="text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-white bg-[#656565] hover:bg-[#757575] active:bg-[#6D6D6D] px-[6px] py-[4px] w-[40px] h-[28px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.22),0_-1px_2px_0_rgba(255,255,255,0.12)_inset,0_1px_2px_0_rgba(255,255,255,0.16)_inset] shrink-0 disabled:opacity-50"
                    disabled={createBounty.isPending}
                    type="submit"
                >
                    <ArrowDownIcon2 className="w-5 h-5 text-white/80 rotate-90" />
                </button>
            </div>
        </div>
    );
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

    // Step state
    const [step, setStep] = useState<'description' | 'details'>('description');
    
    // Form state
    const form = useForm<CreateBountyForm>({
        resolver: zodResolver(createBountySchema),
        defaultValues: {
            ...createBountyDefaults,
            description: '',
        },
    });

    const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
    const description = watch('description');

    // Get user data to fetch GitHub username
    const { data: userData } = useQuery(trpc.user.getMe.queryOptions());
    const githubUsername =
        (userData as { data?: { profile?: { githubUsername?: string } } })?.data
            ?.profile?.githubUsername;

    // State for selected repository and branch
    const [selectedRepository, setSelectedRepository] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('main');
    const [repoSearchQuery, setRepoSearchQuery] = useState('');
    const [branchSearchQuery, setBranchSearchQuery] = useState('');
    const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(true);
    
    // Issue selector state
    const [issueQuery, setIssueQuery] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<{ number: number; title: string; url: string } | null>(null);
    const [showImportPrompt, setShowImportPrompt] = useState(false);

    // Auto-grow textarea height when switching to raw mode
    useEffect(() => {
        if (textareaRef.current && showRawMarkdown && step === 'description') {
            const textarea = textareaRef.current;
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';
            // Set height based on scrollHeight, respecting min and max
            const newHeight = Math.min(Math.max(textarea.scrollHeight, 120), 400);
            textarea.style.height = `${newHeight}px`;
        }
    }, [showRawMarkdown, step]);

    // Fetch user repositories using authenticated user's GitHub token
    const { data: reposData, isLoading: reposLoading, error: reposError } = useQuery({
        ...trpc.repository.myRepos.queryOptions(),
        staleTime: 120_000, // 2 minutes
    });

    // Log repos data for debugging
    useEffect(() => {
        console.log('[TaskInputForm] Repos query state:', {
            githubUsername,
            enabled: !!githubUsername,
            isLoading: reposLoading,
            error: reposError,
            data: reposData,
        });
    }, [githubUsername, reposLoading, reposError, reposData]);

    // Extract repository names from the response
    const repositories = useMemo(() => {
        if (!reposData) {
            console.log('[TaskInputForm] No reposData');
            return [];
        }
        if (!('success' in reposData)) {
            console.log('[TaskInputForm] reposData does not have success property:', reposData);
            return [];
        }
        if (reposData.success === false) {
            console.log('[TaskInputForm] Repos query failed:', reposData);
            return [];
        }
        // TypeScript now knows reposData.success is true, so data exists
        const successData = reposData as { success: true; data: Array<{ name: string; url: string }> };
        const repos = successData.data.map((repo) => {
            // Extract owner from html_url: https://github.com/owner/repo
            const urlMatch = repo.url.match(GITHUB_URL_REGEX);
            if (urlMatch) {
                return `${urlMatch[1]}/${urlMatch[2]}`;
            }
            // Fallback: just use the name (less ideal)
            return repo.name;
        });
        console.log('[TaskInputForm] Extracted repositories:', repos);
        return repos;
    }, [reposData]);

    // Filter repositories based on search query
    const filteredRepositories = useMemo(() => {
        if (!repoSearchQuery) {
            return repositories;
        }
        const query = repoSearchQuery.toLowerCase();
        return repositories.filter((repo: string) =>
            repo.toLowerCase().includes(query)
        );
    }, [repositories, repoSearchQuery]);

    // Fetch default branch for selected repository
    const { data: defaultBranchData } = useQuery({
        ...trpc.repository.defaultBranch.queryOptions({
            repo: selectedRepository,
        }),
        enabled: !!selectedRepository,
        staleTime: 60_000, // 1 minute
    });

    // Fetch branches for selected repository
    const { data: branchesData, isLoading: branchesLoading } = useQuery({
        ...trpc.repository.branches.queryOptions({
            repo: selectedRepository,
        }),
        enabled: !!selectedRepository,
        staleTime: 60_000, // 1 minute
    });

    const branches = branchesData || [];

    // Filter branches based on search query
    const filteredBranches = useMemo(() => {
        if (!branchSearchQuery) {
            return branches;
        }
        const query = branchSearchQuery.toLowerCase();
        return branches.filter((branch: string) =>
            branch.toLowerCase().includes(query)
        );
    }, [branches, branchSearchQuery]);

    // Set default repository when repos are loaded
    useEffect(() => {
        if (
            repositories.length > 0 &&
            !selectedRepository &&
            !reposLoading
        ) {
            setSelectedRepository(repositories[0]);
        }
    }, [repositories, selectedRepository, reposLoading]);

    // Set default branch when repository changes or default branch is fetched
    useEffect(() => {
        if (selectedRepository && defaultBranchData) {
            console.log('[TaskInputForm] Setting default branch:', defaultBranchData);
            setSelectedBranch(defaultBranchData);
        } else if (selectedRepository && branches.length > 0 && !defaultBranchData) {
            // Fallback: Try to find 'main' or 'master', otherwise use first branch
            const fallbackBranch =
                branches.find((b) => b === 'main' || b === 'master') ||
                branches[0];
            console.log('[TaskInputForm] Using fallback branch:', fallbackBranch);
            setSelectedBranch(fallbackBranch);
        }
    }, [selectedRepository, defaultBranchData, branches]);

    // Issue list query - fetch all issues sorted by activity
    const repoInfo = parseRepo(selectedRepository);
    const issuesList = useQuery({
        queryKey: ['repository.listIssues', repoInfo?.owner, repoInfo?.repo],
        queryFn: () => {
            if (!repoInfo) {
                return Promise.resolve([]);
            }
            return trpcClient.repository.listIssues.query({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
            });
        },
        enabled: !!repoInfo,
        staleTime: 60_000,
    });

    // Filter issues by search query if provided
    const filteredIssues = useMemo(() => {
        if (!issuesList.data) {
            return [];
        }
        if (!issueQuery.trim()) {
            return issuesList.data;
        }
        const query = issueQuery.toLowerCase();
        return issuesList.data.filter((issue) => {
            return (
                String(issue.number).includes(query) ||
                issue.title.toLowerCase().includes(query)
            );
        });
    }, [issuesList.data, issueQuery]);

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
            setStep('description');
            setSelectedRepository('');
            setSelectedIssue(null);
            setIssueQuery('');
            if (result?.data?.id) {
                router.push(`/bounty/${result.data.id}`);
            }
        },
        onError: (error: Error) => {
            toast.error(`Failed to create bounty: ${error.message}`);
        },
    });

    const handleStep1Submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (description.trim()) {
            setStep('details');
        }
    };

    const handleStep2Submit = handleSubmit((data: CreateBountyForm) => {
        const formattedData = formatFormData.createBounty({
            ...data,
            repositoryUrl: selectedRepository ? `https://github.com/${selectedRepository}` : undefined,
            issueUrl: selectedIssue?.url,
        });
        createBounty.mutate(formattedData);
    });

    const handleRepositorySelect = (repo: string) => {
        setSelectedRepository(repo);
        setRepoSearchQuery('');
        setSelectedIssue(null);
        setIssueQuery('');
    };

    const handleBranchSelect = (branch: string) => {
        setSelectedBranch(branch);
        setBranchSearchQuery('');
    };

    const handleIssueSelect = (issue: { number: number; title: string }) => {
        if (!repoInfo) {
            return;
        }
        const issueUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issue.number}`;
        setSelectedIssue({ ...issue, url: issueUrl });
        setIssueQuery('');
        setShowImportPrompt(true);
    };

    const handleImportIssue = async () => {
        if (!selectedIssue) {
            return;
        }
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
        }
        setShowImportPrompt(false);
    };

    const handleSkipImport = () => {
        setShowImportPrompt(false);
    };

    return (
        <div className="flex w-full shrink-0 flex-col px-4 lg:max-w-[805px] xl:px-0 mx-auto">
            <form className="w-full flex flex-col mt-10 mb-6" onSubmit={step === 'description' ? handleStep1Submit : handleStep2Submit}>
                <fieldset className="w-full [all:unset]">
                    <div
                        role="presentation"
                        className={`bg-[#191919] text-[#5A5A5A] border-[1.5px] border-[#232323] rounded-2xl relative transition-colors cursor-text overflow-hidden ${
                            step === 'description' 
                                ? 'focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus-within:outline-none' 
                                : ''
                        }`}
                    >
                        {/* Hidden file input */}
                        <input
                            accept="image/*,.jpeg,.jpg,.png,.webp,.svg"
                            multiple
                            tabIndex={-1}
                            type="file"
                            className="absolute border-0 clip-[rect(0px,0px,0px,0px)] h-px m-0 overflow-hidden p-0 w-px whitespace-nowrap"
                        />

                        {step === 'description' ? (
                            <Step1DescriptionForm
                                placeholder={placeholder}
                                control={control}
                                description={description}
                                textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement | null>}
                                showRawMarkdown={showRawMarkdown}
                                setShowRawMarkdown={setShowRawMarkdown}
                                selectedRepository={selectedRepository}
                                selectedBranch={selectedBranch}
                                repoSearchQuery={repoSearchQuery}
                                setRepoSearchQuery={setRepoSearchQuery}
                                branchSearchQuery={branchSearchQuery}
                                setBranchSearchQuery={setBranchSearchQuery}
                                issueQuery={issueQuery}
                                setIssueQuery={setIssueQuery}
                                selectedIssue={selectedIssue}
                                githubUsername={githubUsername}
                                reposLoading={reposLoading}
                                filteredRepositories={filteredRepositories}
                                branchesLoading={branchesLoading}
                                filteredBranches={filteredBranches}
                                issuesList={issuesList}
                                filteredIssues={filteredIssues}
                                handleRepositorySelect={handleRepositorySelect}
                                handleBranchSelect={handleBranchSelect}
                                handleIssueSelect={handleIssueSelect}
                                repoInfo={repoInfo}
                            />
                        ) : (
                            <Step2DetailsForm
                                control={control}
                                errors={errors}
                                setStep={setStep}
                                createBounty={createBounty}
                            />
                        )}

                        {/* Issue import prompt */}
                        <Dialog open={showImportPrompt} onOpenChange={setShowImportPrompt}>
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
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        onClick={handleImportIssue}
                                    >
                                        Import
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </fieldset>
            </form>

        </div>
    );
});

TaskInputForm.displayName = 'TaskInputForm';

