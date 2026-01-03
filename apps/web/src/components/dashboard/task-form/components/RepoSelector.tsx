import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { GithubIcon } from '@bounty/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';

interface RepoSelectorProps {
  selectedRepository: string;
  filteredRepositories: string[];
  reposLoading: boolean;
  reposData?:
    | {
        success: boolean;
        error?: string;
        data?: Array<{ name: string; url: string }>;
      }
    | undefined;
  githubUsername?: string;
  repoSearchQuery: string;
  setRepoSearchQuery: (query: string) => void;
  onSelect: (repo: string) => void;
}

export function RepoSelector({
  selectedRepository,
  filteredRepositories,
  reposLoading,
  reposData,
  githubUsername,
  repoSearchQuery,
  setRepoSearchQuery,
  onSelect,
}: RepoSelectorProps) {
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  return (
    <DropdownMenu open={showRepoDropdown} onOpenChange={setShowRepoDropdown}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex flex-row items-center gap-2 text-[#5A5A5A] hover:text-[#888] transition-colors"
        >
          {selectedRepository ? (
            <>
              <GithubIcon className="w-4 h-4" />
              <span className="text-[14px] leading-[150%] tracking-[-0.02em] font-medium text-white">
                {selectedRepository}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showRepoDropdown ? 'rotate-180' : ''}`}
              />
            </>
          ) : (
            <>
              <span className="text-[14px] leading-[150%] tracking-[-0.02em] font-medium">
                Select repositories
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showRepoDropdown ? 'rotate-180' : ''}`}
              />
            </>
          )}
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
              className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] text-[#CFCFCF]"
              placeholder="Search repositories"
              value={repoSearchQuery}
              onChange={(e) => setRepoSearchQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
          <div className="max-h-[240px] overflow-y-auto px-1 pb-1">
            {reposLoading ? (
              <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                Loading repositories...
              </div>
            ) : reposData && !reposData.success && reposData.error ? (
              <div className="px-2 py-1.5 text-sm text-[#FF6B6B]">
                {reposData.error?.includes('reconnect') ? (
                  <span>
                    {reposData.error}{' '}
                    <a
                      href="/api/auth/sign-in/github"
                      className="underline hover:text-[#FF8E8E]"
                    >
                      Reconnect
                    </a>
                  </span>
                ) : (
                  reposData.error || 'Failed to load repositories'
                )}
              </div>
            ) : filteredRepositories.length > 0 ? (
              filteredRepositories.map((repo: string) => (
                <DropdownMenuItem
                  key={repo}
                  className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                  onClick={() => {
                    onSelect(repo);
                    setShowRepoDropdown(false);
                  }}
                  data-selected={selectedRepository === repo}
                >
                  <GithubIcon className="size-4 text-[#5A5A5A]" />
                  <span className="text-[#CFCFCF] truncate block overflow-hidden">
                    {repo}
                  </span>
                  {selectedRepository === repo && (
                    <Check className="w-3 h-3 text-green-500 ml-auto shrink-0" />
                  )}
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
  );
}
