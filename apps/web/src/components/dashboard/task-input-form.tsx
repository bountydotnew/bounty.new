'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
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
import { trpc } from '@/utils/trpc';

// Regex for extracting owner/repo from GitHub URLs
const GITHUB_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)/;

interface TaskInputFormProps {
  placeholder?: string;
  onSubmit?: (value: string, repository?: string, branch?: string) => void;
}

export function TaskInputForm({
  placeholder = 'Create a new bounty...',
  onSubmit,
}: TaskInputFormProps) {
  // Get user data to fetch GitHub username
  const { data: userData } = useQuery(trpc.user.getMe.queryOptions());
  const githubUsername =
    (userData as { data?: { profile?: { githubUsername?: string } } })?.data
      ?.profile?.githubUsername;

  // Log for debugging
  useEffect(() => {
    console.log('[TaskInputForm] User data:', userData);
    console.log('[TaskInputForm] GitHub username:', githubUsername);
  }, [userData, githubUsername]);

  // State for selected repository and branch
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskValue = formData.get('task') as string;
    if (taskValue && onSubmit) {
      onSubmit(taskValue, selectedRepository, selectedBranch);
    }
  };

  const handleRepositorySelect = (repo: string) => {
    setSelectedRepository(repo);
    setRepoSearchQuery('');
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    setBranchSearchQuery('');
  };

  return (
    <div className="flex w-full shrink-0 flex-col px-4 lg:max-w-[805px] xl:px-0 mx-auto">
      <form className="w-full flex flex-col mt-10 mb-6" onSubmit={handleSubmit}>
        <fieldset className="w-full [all:unset]">
          <div
            role="presentation"
            className="bg-[#191919] text-[#5A5A5A] border-[1.5px] border-[#232323] rounded-2xl relative focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus-within:outline-none transition-colors cursor-text overflow-hidden"
          >
            {/* Hidden file input */}
            <input
              accept="image/*,.jpeg,.jpg,.png,.webp,.svg"
              multiple
              tabIndex={-1}
              type="file"
              className="absolute border-0 clip-[rect(0px,0px,0px,0px)] h-px m-0 overflow-hidden p-0 w-px whitespace-nowrap"
            />

            <div className="flex flex-col">
              <div className="flex flex-col h-full">
                <div className="flex flex-col overflow-x-hidden min-w-0">
                  {/* Textarea area */}
                  <textarea
                    name="task"
                    className="flex flex-col text-base h-full border-none p-3.5 min-h-[120px] max-h-[400px] resize-none shadow-none focus:ring-0 focus:outline-none w-full overflow-x-hidden overflow-y-auto bg-transparent text-[#5A5A5A] placeholder:text-[#5A5A5A]"
                    placeholder={placeholder}
                    rows={4}
                  />
                </div>
              </div>

              {/* Bottom controls */}
              <div className="px-3 pb-3 flex justify-between items-center gap-2 flex-row min-w-0 bg-transparent">
                {/* Left side - Repository/Branch/AI buttons */}
                <div className="flex-wrap flex items-center gap-1 min-w-0">
                  {/* GitHub repo button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-interactive-state-hover active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full overflow-hidden max-w-[200px] sm:max-w-none"
                        type="button"
                      >
                        <GithubIcon className="dark:invert" />
                        <div className="hidden sm:flex gap-0.5 text-sm font-medium items-center text-foreground-strong [&_svg]:size-2 overflow-hidden">
                          <span className="truncate">
                            {selectedRepository || 'Select repository'}
                          </span>
                        </div>
                        <ChevronDoubleIcon className="!size-3.5 !text-icon ml-auto shrink-0" />
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

                  {/* Branch button */}
                  {branchesLoading ? (
                    <button
                      className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-interactive-state-hover active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full opacity-50 cursor-not-allowed"
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
                          className="w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px] inline-flex items-center justify-center gap-0.5 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border [&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)] relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted text-foreground [&_svg]:text-icon bg-interactive-state hover:bg-interactive-state-hover active:bg-interactive-state-pressed data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled h-[28px] px-[6px] py-[4px] [--icon-frame:20px] [--icon-pad:2px] rounded-full shadow-hidden max-w-[150px] sm:max-w-none"
                          type="button"
                        >
                          <BranchIcon className="shrink-0" />
                          <div className="hidden sm:flex gap-0.5 items-center [&_svg]:size-2 overflow-hidden">
                            <span className="truncate text-foreground-strong">
                              {selectedBranch}
                            </span>
                            <ChevronDoubleIcon className="!size-3.5 shrink-0" />
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
                </div>

                {/* Right side - Action buttons */}
                <div className="flex gap-2 justify-between items-center shrink-0">
                  <button
                    className="text-sm font-medium inline-flex items-center justify-center gap-0.5 whitespace-nowrap relative focus:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,130,246,0.5)] disabled:text-[#5A5A5A] disabled:shadow-none text-white bg-[#0F0F0F] hover:bg-[#141414] active:bg-[#1A1A1A] px-[6px] py-[4px] w-[50px] h-[40px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.22),0_-1px_2px_0_rgba(255,255,255,0.12)_inset,0_1px_2px_0_rgba(255,255,255,0.16)_inset]"
                    type="submit"
                  >
                    <ArrowDownIcon2 className="w-5 h-5 text-white/80 rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

