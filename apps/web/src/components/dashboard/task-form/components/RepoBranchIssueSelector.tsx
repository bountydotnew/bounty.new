'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { GithubIcon, BranchIcon } from '@bounty/ui';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@bounty/ui/components/drawer';
import { cn } from '@bounty/ui/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface Account {
  id: number;
  accountLogin: string | null;
  accountType: string | null;
}

interface InstallationRepos {
  installationId: number;
  accountLogin: string | null;
  accountType: string | null;
  repositories: string[];
  loading: boolean;
}

interface Issue {
  number: number;
  title: string;
}

type Step = 'repos' | 'branches' | 'issues';

interface RepoBranchIssueSelectorProps {
  // State
  selectedRepository: string;
  selectedBranch: string;
  selectedIssue: { number: number; title: string; url: string } | null;

  // Data
  installations: Account[];
  installationRepos: InstallationRepos[];
  filteredBranches: string[];
  filteredIssues: Issue[];
  branchesLoading: boolean;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };

  // Search queries
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  branchSearchQuery: string;
  setBranchSearchQuery: (query: string) => void;
  issueQuery: string;
  setIssueQuery: (query: string) => void;

  // Callbacks
  onSelectRepo: (repo: string) => void;
  onSelectBranch: (branch: string) => void;
  onSelectIssue: (issue: Issue) => void;

  // Allow opening at a specific step
  openStep?: Step;
}

const ACCOUNTS_PER_PAGE = 5;
const BRANCHES_PER_PAGE = 10;
const ISSUES_PER_PAGE = 10;

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 px-3 py-2 border-t border-border-subtle">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-text-tertiary">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-text-secondary"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================================
// ACCOUNTS/REPOS SELECTOR (Desktop Dropdown)
// ============================================================================
function AccountsSelectorContent({
  installations,
  installationRepos,
  accountsPage,
  setAccountsPage,
  onSelectRepo,
  onClose,
}: {
  installations: Account[];
  installationRepos: InstallationRepos[];
  accountsPage: number;
  setAccountsPage: (page: number) => void;
  onSelectRepo: (repo: string) => void;
  onClose: () => void;
}) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const directionRef = useRef<'forward' | 'back'>('forward');
  const totalAccountPages = Math.ceil(installations.length / ACCOUNTS_PER_PAGE);

  const paneKey = selectedAccount ? `repos-${selectedAccount.id}` : 'accounts';

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        {selectedAccount ? (
          <>
            <button
              type="button"
              onClick={() => {
                directionRef.current = 'back';
                setSelectedAccount(null);
              }}
              className="p-1 -ml-1 rounded hover:bg-white/10 text-text-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <GithubIcon className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">
              {selectedAccount.accountLogin ?? 'Unknown Account'}
            </span>
          </>
        ) : (
          <>
            <GithubIcon className="w-4 h-4 text-text-tertiary" />
            <input
              className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
              placeholder={
                installations.length === 1
                  ? (installations[0]?.accountLogin ?? 'Search accounts...')
                  : 'Search accounts...'
              }
              autoComplete="off"
              spellCheck={false}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[250px] max-h-[250px] overflow-hidden relative">
        <AnimatePresence initial={false}>
          <motion.div
            key={paneKey}
            initial={
              prefersReducedMotion
                ? false
                : {
                    transform: `translateX(${directionRef.current === 'forward' ? 40 : -40}px)`,
                  }
            }
            animate={{
              transform: 'translateX(0px)',
            }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-y-auto p-1 h-[250px]"
          >
            {selectedAccount ? (
              // Repos list for selected account
              (() => {
                const accountRepos = installationRepos.find(
                  (r) => r.installationId === selectedAccount.id
                );
                return (
                  <>
                    {accountRepos?.repositories &&
                    accountRepos.repositories.length > 0 ? (
                      accountRepos.repositories.map((repo: string) => (
                        <button
                          key={repo}
                          type="button"
                          onClick={() => {
                            onSelectRepo(repo);
                            onClose();
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-white/10 transition-colors"
                        >
                          <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          <span className="flex-1 text-sm text-text-secondary truncate">
                            {repo}
                          </span>
                          <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-text-tertiary">
                        No repositories
                      </div>
                    )}
                  </>
                );
              })()
            ) : // Accounts list
            installations.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-tertiary">
                No accounts found
              </div>
            ) : (
              installations
                .slice(
                  (accountsPage - 1) * ACCOUNTS_PER_PAGE,
                  accountsPage * ACCOUNTS_PER_PAGE
                )
                .map((account) => {
                  const accountRepos = installationRepos.find(
                    (r) => r.installationId === account.id
                  );
                  const count = accountRepos?.repositories.length ?? 0;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        directionRef.current = 'forward';
                        setSelectedAccount(account);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-white/10 transition-colors"
                    >
                      <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                      <span className="flex-1 text-sm text-text-secondary truncate">
                        {account.accountLogin ?? 'Unknown Account'}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {count}
                      </span>
                      <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                    </button>
                  );
                })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination for accounts only */}
      {!selectedAccount && totalAccountPages > 1 && (
        <Pagination
          currentPage={accountsPage}
          totalPages={totalAccountPages}
          onPageChange={setAccountsPage}
        />
      )}
    </div>
  );
}

// ============================================================================
// BRANCHES SELECTOR (Desktop Dropdown)
// ============================================================================
function BranchesSelectorContent({
  filteredBranches,
  branchesPage,
  setBranchesPage,
  branchesLoading,
  onSelectBranch,
  onClose,
}: {
  filteredBranches: string[];
  branchesPage: number;
  setBranchesPage: (page: number) => void;
  branchesLoading: boolean;
  onSelectBranch: (branch: string) => void;
  onClose: () => void;
}) {
  const totalBranchPages = Math.ceil(
    filteredBranches.length / BRANCHES_PER_PAGE
  );
  const paginatedBranches = filteredBranches.slice(
    (branchesPage - 1) * BRANCHES_PER_PAGE,
    branchesPage * BRANCHES_PER_PAGE
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <BranchIcon className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm text-text-secondary">Select branch</span>
      </div>

      {/* Content */}
      <div className="min-h-[250px] max-h-[250px] overflow-y-auto p-1">
        {branchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
          </div>
        ) : paginatedBranches.length > 0 ? (
          paginatedBranches.map((branch: string) => (
            <button
              key={branch}
              type="button"
              onClick={() => {
                onSelectBranch(branch);
                onClose();
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-white/10 transition-colors"
            >
              <BranchIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              <span className="flex-1 text-sm text-text-secondary truncate">
                {branch}
              </span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-text-tertiary">
            No branches found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalBranchPages > 1 && (
        <Pagination
          currentPage={branchesPage}
          totalPages={totalBranchPages}
          onPageChange={setBranchesPage}
        />
      )}
    </div>
  );
}

// ============================================================================
// ISSUES SELECTOR (Desktop Dropdown)
// ============================================================================
function IssuesSelectorContent({
  selectedIssue,
  filteredIssues,
  issuesPage,
  setIssuesPage,
  issuesList,
  onSelectIssue,
  onClose,
}: {
  selectedIssue: { number: number; title: string; url: string } | null;
  filteredIssues: Issue[];
  issuesPage: number;
  setIssuesPage: (page: number) => void;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  onSelectIssue: (issue: Issue) => void;
  onClose: () => void;
}) {
  const totalIssuePages = Math.ceil(filteredIssues.length / ISSUES_PER_PAGE);
  const paginatedIssues = filteredIssues.slice(
    (issuesPage - 1) * ISSUES_PER_PAGE,
    issuesPage * ISSUES_PER_PAGE
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        <GithubIcon className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm text-text-secondary">Select issue</span>
      </div>

      {/* Content */}
      <div className="min-h-[250px] max-h-[250px] overflow-y-auto p-1">
        {issuesList.isLoading || issuesList.isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
          </div>
        ) : paginatedIssues.length > 0 ? (
          paginatedIssues.map((issue: Issue) => (
            <button
              key={issue.number}
              type="button"
              onClick={() => {
                onSelectIssue(issue);
                onClose();
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-white/10',
                selectedIssue?.number === issue.number && 'bg-white/5'
              )}
            >
              <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              <span className="flex-1 text-sm text-text-secondary truncate">
                #{issue.number}: {issue.title}
              </span>
              {selectedIssue?.number === issue.number && (
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              )}
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-text-tertiary">
            No open issues
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalIssuePages > 1 && (
        <Pagination
          currentPage={issuesPage}
          totalPages={totalIssuePages}
          onPageChange={setIssuesPage}
        />
      )}
    </div>
  );
}

// ============================================================================
// UNIFIED SELECTOR (Mobile Drawer) - Extracted Subcomponents
// ============================================================================

function MobileSelectorHeader({
  step,
  mobileDirectionRef,
  setStep,
  selectedAccount,
  setSelectedAccount,
  installations,
  accountSearchQuery,
  setAccountSearchQuery,
  setAccountsPage,
  branchSearchQuery,
  setBranchSearchQuery,
  setBranchesPage,
  issueQuery,
  setIssueQuery,
  setIssuesPage,
}: {
  step: Step;
  mobileDirectionRef: { current: 'forward' | 'back' };
  setStep: (step: Step) => void;
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  installations: Account[];
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  setAccountsPage: (page: number) => void;
  branchSearchQuery: string;
  setBranchSearchQuery: (query: string) => void;
  setBranchesPage: (page: number) => void;
  issueQuery: string;
  setIssueQuery: (query: string) => void;
  setIssuesPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
      {step !== 'repos' && (
        <button
          type="button"
          onClick={() => {
            mobileDirectionRef.current = 'back';
            if (step === 'issues') {
              setStep('branches');
            } else if (step === 'branches') {
              setStep('repos');
            }
          }}
          className="p-1 -ml-1 rounded hover:bg-white/10 text-text-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {step === 'repos' && !selectedAccount && (
        <>
          <GithubIcon className="w-4 h-4 text-text-tertiary" />
          <input
            className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
            placeholder={
              installations.length === 1
                ? (installations[0]?.accountLogin ?? 'Search accounts...')
                : 'Search accounts...'
            }
            value={accountSearchQuery}
            onChange={(e) => {
              setAccountSearchQuery(e.target.value);
              setAccountsPage(1);
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </>
      )}

      {step === 'repos' && selectedAccount && (
        <>
          <button
            type="button"
            onClick={() => {
              mobileDirectionRef.current = 'back';
              setSelectedAccount(null);
            }}
            className="p-1 -ml-1 rounded hover:bg-white/10 text-text-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <GithubIcon className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">
            {selectedAccount.accountLogin ?? 'Unknown Account'}
          </span>
        </>
      )}

      {step === 'branches' && (
        <>
          <BranchIcon className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">Select branch</span>
          <input
            className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
            placeholder="Search branches..."
            value={branchSearchQuery}
            onChange={(e) => {
              setBranchSearchQuery(e.target.value);
              setBranchesPage(1);
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </>
      )}

      {step === 'issues' && (
        <>
          <GithubIcon className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">Select issue</span>
          <input
            className="flex-1 bg-transparent text-sm text-text-secondary placeholder:text-text-tertiary outline-none"
            placeholder="Search issues..."
            value={issueQuery}
            onChange={(e) => {
              setIssueQuery(e.target.value);
              setIssuesPage(1);
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </>
      )}
    </div>
  );
}

function MobileSelectorBody({
  step,
  selectedAccount,
  setSelectedAccount,
  mobileDirectionRef,
  installationRepos,
  onSelectRepo,
  setStep,
  selectedRepository,
  branchesLoading,
  installations,
  accountsPage,
  filteredBranches,
  branchesPage,
  onSelectBranch,
  selectedBranch,
  filteredIssues,
  issuesPage,
  issuesList,
  onSelectIssue,
  selectedIssue,
}: {
  step: Step;
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  mobileDirectionRef: { current: 'forward' | 'back' };
  installationRepos: InstallationRepos[];
  onSelectRepo: (repo: string) => void;
  setStep: (step: Step) => void;
  selectedRepository: string;
  branchesLoading: boolean;
  installations: Account[];
  accountsPage: number;
  filteredBranches: string[];
  branchesPage: number;
  onSelectBranch: (branch: string) => void;
  selectedBranch: string;
  filteredIssues: Issue[];
  issuesPage: number;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  onSelectIssue: (issue: Issue) => void;
  selectedIssue: { number: number; title: string; url: string } | null;
}) {
  if (step === 'repos') {
    if (selectedAccount) {
      const accountRepos = installationRepos.find(
        (r) => r.installationId === selectedAccount.id
      );
      return (
        <>
          {accountRepos?.repositories &&
          accountRepos.repositories.length > 0 ? (
            accountRepos.repositories.map((repo: string) => (
              <button
                key={repo}
                type="button"
                onClick={() => {
                  mobileDirectionRef.current = 'forward';
                  onSelectRepo(repo);
                  setStep('branches');
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors',
                  'hover:bg-white/10',
                  selectedRepository === repo && 'bg-white/5'
                )}
              >
                <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span className="flex-1 text-sm text-text-secondary truncate">
                  {repo}
                </span>
                {selectedRepository === repo && (
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
                <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-text-tertiary">
              No repositories
            </div>
          )}
        </>
      );
    }

    const paginatedInstallations = installations.slice(
      (accountsPage - 1) * ACCOUNTS_PER_PAGE,
      accountsPage * ACCOUNTS_PER_PAGE
    );

    return (
      <>
        {branchesLoading &&
        !installationRepos.some((r) => r.repositories.length > 0) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
          </div>
        ) : (
          paginatedInstallations.map((account) => {
            const accountRepos = installationRepos.find(
              (r) => r.installationId === account.id
            );
            const count = accountRepos?.repositories.length ?? 0;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  mobileDirectionRef.current = 'forward';
                  setSelectedAccount(account);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-white/10 transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span className="flex-1 text-sm text-text-secondary truncate">
                  {account.accountLogin ?? 'Unknown Account'}
                </span>
                <span className="text-xs text-text-tertiary">{count}</span>
                <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
              </button>
            );
          })
        )}
      </>
    );
  }

  if (step === 'branches') {
    const paginatedBranches = filteredBranches.slice(
      (branchesPage - 1) * BRANCHES_PER_PAGE,
      branchesPage * BRANCHES_PER_PAGE
    );

    return (
      <>
        {branchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
          </div>
        ) : paginatedBranches.length > 0 ? (
          paginatedBranches.map((branch: string) => (
            <button
              key={branch}
              type="button"
              onClick={() => {
                mobileDirectionRef.current = 'forward';
                onSelectBranch(branch);
                setStep('issues');
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-white/10',
                selectedBranch === branch && 'bg-white/5'
              )}
            >
              <BranchIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              <span className="flex-1 text-sm text-text-secondary truncate">
                {branch}
              </span>
              {selectedBranch === branch && (
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              )}
              <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-text-tertiary">
            No branches found
          </div>
        )}
      </>
    );
  }

  if (step === 'issues') {
    const paginatedIssues = filteredIssues.slice(
      (issuesPage - 1) * ISSUES_PER_PAGE,
      issuesPage * ISSUES_PER_PAGE
    );

    return (
      <>
        {issuesList.isLoading || issuesList.isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
          </div>
        ) : paginatedIssues.length > 0 ? (
          paginatedIssues.map((issue: Issue) => (
            <button
              key={issue.number}
              type="button"
              onClick={() => onSelectIssue(issue)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-white/10',
                selectedIssue?.number === issue.number && 'bg-white/5'
              )}
            >
              <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              <span className="flex-1 text-sm text-text-secondary truncate">
                #{issue.number}: {issue.title}
              </span>
              {selectedIssue?.number === issue.number && (
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              )}
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-text-tertiary">
            No open issues
          </div>
        )}
      </>
    );
  }

  return null;
}

// ============================================================================
// UNIFIED SELECTOR (Mobile Drawer) - Main Component
// ============================================================================
function MobileSelectorContent({
  step,
  selectedRepository,
  selectedBranch,
  selectedIssue,
  installations,
  installationRepos,
  filteredBranches,
  filteredIssues,
  branchesLoading,
  issuesList,
  accountSearchQuery,
  setAccountSearchQuery,
  branchSearchQuery,
  setBranchSearchQuery,
  issueQuery,
  setIssueQuery,
  setStep,
  onSelectRepo,
  onSelectBranch,
  onSelectIssue,
  accountsPage,
  setAccountsPage,
  branchesPage,
  setBranchesPage,
  issuesPage,
  setIssuesPage,
}: {
  step: Step;
  selectedRepository: string;
  selectedBranch: string;
  selectedIssue: { number: number; title: string; url: string } | null;
  installations: Account[];
  installationRepos: InstallationRepos[];
  filteredBranches: string[];
  filteredIssues: Issue[];
  branchesLoading: boolean;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  branchSearchQuery: string;
  setBranchSearchQuery: (query: string) => void;
  issueQuery: string;
  setIssueQuery: (query: string) => void;
  setStep: (step: Step) => void;
  onSelectRepo: (repo: string) => void;
  onSelectBranch: (branch: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onClose: () => void;
  accountsPage: number;
  setAccountsPage: (page: number) => void;
  branchesPage: number;
  setBranchesPage: (page: number) => void;
  issuesPage: number;
  setIssuesPage: (page: number) => void;
}) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const mobileDirectionRef = useRef<'forward' | 'back'>('forward');

  const totalAccountPages = Math.ceil(installations.length / ACCOUNTS_PER_PAGE);
  const totalBranchPages = Math.ceil(
    filteredBranches.length / BRANCHES_PER_PAGE
  );
  const totalIssuePages = Math.ceil(filteredIssues.length / ISSUES_PER_PAGE);

  const stepKey =
    step === 'repos' && selectedAccount ? `repos-${selectedAccount.id}` : step;

  const showPagination =
    totalAccountPages > 1 && step === 'repos' && !selectedAccount;
  const showBranchesPagination = totalBranchPages > 1 && step === 'branches';
  const showIssuesPagination = totalIssuePages > 1 && step === 'issues';

  return (
    <div className="flex flex-col">
      <MobileSelectorHeader
        step={step}
        mobileDirectionRef={mobileDirectionRef}
        setStep={setStep}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        installations={installations}
        accountSearchQuery={accountSearchQuery}
        setAccountSearchQuery={setAccountSearchQuery}
        setAccountsPage={setAccountsPage}
        branchSearchQuery={branchSearchQuery}
        setBranchSearchQuery={setBranchSearchQuery}
        setBranchesPage={setBranchesPage}
        issueQuery={issueQuery}
        setIssueQuery={setIssueQuery}
        setIssuesPage={setIssuesPage}
      />
      <div className="min-h-[250px] max-h-[250px] overflow-hidden relative">
        <AnimatePresence initial={false}>
          <motion.div
            key={stepKey}
            initial={
              prefersReducedMotion
                ? false
                : {
                    transform: `translateX(${mobileDirectionRef.current === 'forward' ? 40 : -40}px)`,
                  }
            }
            animate={{
              transform: 'translateX(0px)',
            }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-y-auto p-1 h-[250px]"
          >
            <MobileSelectorBody
              step={step}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              mobileDirectionRef={mobileDirectionRef}
              installationRepos={installationRepos}
              onSelectRepo={onSelectRepo}
              setStep={setStep}
              selectedRepository={selectedRepository}
              branchesLoading={branchesLoading}
              installations={installations}
              accountsPage={accountsPage}
              filteredBranches={filteredBranches}
              branchesPage={branchesPage}
              onSelectBranch={onSelectBranch}
              selectedBranch={selectedBranch}
              filteredIssues={filteredIssues}
              issuesPage={issuesPage}
              issuesList={issuesList}
              onSelectIssue={onSelectIssue}
              selectedIssue={selectedIssue}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {(showPagination || showBranchesPagination || showIssuesPagination) && (
        <>
          {showPagination && (
            <Pagination
              currentPage={accountsPage}
              totalPages={totalAccountPages}
              onPageChange={setAccountsPage}
            />
          )}
          {showBranchesPagination && (
            <Pagination
              currentPage={branchesPage}
              totalPages={totalBranchPages}
              onPageChange={setBranchesPage}
            />
          )}
          {showIssuesPagination && (
            <Pagination
              currentPage={issuesPage}
              totalPages={totalIssuePages}
              onPageChange={setIssuesPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function DesktopRepoDropdown({
  accountsOpen,
  setAccountsOpen,
  selectedRepository,
  installations,
  installationRepos,
  accountsPage,
  setAccountsPage,
  onSelectRepo,
}: {
  accountsOpen: boolean;
  setAccountsOpen: (v: boolean) => void;
  selectedRepository: string;
  installations: Account[];
  installationRepos: InstallationRepos[];
  accountsPage: number;
  setAccountsPage: (v: number) => void;
  onSelectRepo: (repo: string) => void;
}) {
  return (
    <DropdownMenu open={accountsOpen} onOpenChange={setAccountsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
            'hover:bg-white/10',
            accountsOpen && 'bg-white/10'
          )}
        >
          <GithubIcon className="w-4 h-4" />
          {selectedRepository ? (
            <span className="text-sm text-foreground">
              {selectedRepository}
            </span>
          ) : (
            <span className="text-sm">Select repository</span>
          )}
          <ChevronSortIcon className="size-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 border-border-subtle bg-surface-1 text-text-secondary rounded-xl"
        align="start"
        sideOffset={4}
      >
        <AccountsSelectorContent
          installations={installations}
          installationRepos={installationRepos}
          accountsPage={accountsPage}
          setAccountsPage={setAccountsPage}
          onSelectRepo={onSelectRepo}
          onClose={() => setAccountsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopBranchDropdown({
  branchesOpen,
  setBranchesOpen,
  selectedBranch,
  filteredBranches,
  branchesPage,
  setBranchesPage,
  branchesLoading,
  onSelectBranch,
}: {
  branchesOpen: boolean;
  setBranchesOpen: (v: boolean) => void;
  selectedBranch: string;
  filteredBranches: string[];
  branchesPage: number;
  setBranchesPage: (v: number) => void;
  branchesLoading: boolean;
  onSelectBranch: (branch: string) => void;
}) {
  return (
    <DropdownMenu open={branchesOpen} onOpenChange={setBranchesOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
            'hover:bg-white/10',
            branchesOpen && 'bg-white/10'
          )}
        >
          <BranchIcon className="w-3.5 h-3.5" />
          <span className="text-[14px] text-text-muted">{selectedBranch}</span>
          <ChevronSortIcon className="size-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 border-border-subtle bg-surface-1 text-text-secondary rounded-xl"
        align="start"
        sideOffset={4}
      >
        <BranchesSelectorContent
          filteredBranches={filteredBranches}
          branchesPage={branchesPage}
          setBranchesPage={setBranchesPage}
          branchesLoading={branchesLoading}
          onSelectBranch={onSelectBranch}
          onClose={() => setBranchesOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopIssueDropdown({
  issuesOpen,
  setIssuesOpen,
  selectedIssue,
  filteredIssues,
  issuesPage,
  setIssuesPage,
  issuesList,
  onSelectIssue,
}: {
  issuesOpen: boolean;
  setIssuesOpen: (v: boolean) => void;
  selectedIssue: { number: number; title: string; url: string } | null;
  filteredIssues: Issue[];
  issuesPage: number;
  setIssuesPage: (v: number) => void;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  onSelectIssue: (issue: Issue) => void;
}) {
  return (
    <DropdownMenu open={issuesOpen} onOpenChange={setIssuesOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
            'hover:bg-white/10',
            issuesOpen && 'bg-white/10'
          )}
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span className="text-[14px] text-text-muted">
            {selectedIssue ? `#${selectedIssue.number}` : 'Issue'}
          </span>
          <ChevronSortIcon className="size-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 border-border-subtle bg-surface-1 text-text-secondary rounded-xl"
        align="start"
        sideOffset={4}
      >
        <IssuesSelectorContent
          selectedIssue={selectedIssue}
          filteredIssues={filteredIssues}
          issuesPage={issuesPage}
          setIssuesPage={setIssuesPage}
          issuesList={issuesList}
          onSelectIssue={onSelectIssue}
          onClose={() => setIssuesOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileDrawerView({
  mobileOpen,
  setMobileOpen,
  mobileStep,
  setMobileStep,
  selectedRepository,
  selectedBranch,
  selectedIssue,
  installations,
  installationRepos,
  filteredBranches,
  filteredIssues,
  branchesLoading,
  issuesList,
  accountSearchQuery,
  setAccountSearchQuery,
  branchSearchQuery,
  setBranchSearchQuery,
  issueQuery,
  setIssueQuery,
  mobileAccountsPage,
  setMobileAccountsPage,
  mobileBranchesPage,
  setMobileBranchesPage,
  mobileIssuesPage,
  setMobileIssuesPage,
  onSelectRepo,
  onSelectBranch,
  onSelectIssue,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  mobileStep: Step;
  setMobileStep: (v: Step) => void;
  selectedRepository: string;
  selectedBranch: string;
  selectedIssue: { number: number; title: string; url: string } | null;
  installations: Account[];
  installationRepos: InstallationRepos[];
  filteredBranches: string[];
  filteredIssues: Issue[];
  branchesLoading: boolean;
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  branchSearchQuery: string;
  setBranchSearchQuery: (query: string) => void;
  issueQuery: string;
  setIssueQuery: (query: string) => void;
  mobileAccountsPage: number;
  setMobileAccountsPage: (v: number) => void;
  mobileBranchesPage: number;
  setMobileBranchesPage: (v: number) => void;
  mobileIssuesPage: number;
  setMobileIssuesPage: (v: number) => void;
  onSelectRepo: (repo: string) => void;
  onSelectBranch: (branch: string) => void;
  onSelectIssue: (issue: Issue) => void;
}) {
  return (
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setMobileStep('repos');
              setMobileOpen(true);
              setMobileAccountsPage(1);
            }}
            className={cn(
              'flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
              'hover:bg-white/10',
              mobileOpen && mobileStep === 'repos' && 'bg-white/10'
            )}
          >
            <GithubIcon className="w-4 h-4" />
            {selectedRepository ? (
              <span className="text-sm text-foreground">
                {selectedRepository}
              </span>
            ) : (
              <span className="text-sm">Select repository</span>
            )}
            <ChevronSortIcon className="size-2" />
          </button>

          {selectedRepository && (
            <>
              <div className="w-px h-4 bg-surface-3 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  setMobileStep('branches');
                  setMobileOpen(true);
                  setMobileBranchesPage(1);
                }}
                className={cn(
                  'flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
                  'hover:bg-white/10',
                  mobileOpen && mobileStep === 'branches' && 'bg-white/10'
                )}
              >
                <BranchIcon className="w-3.5 h-3.5" />
                <span className="text-[14px] text-text-muted">
                  {selectedBranch}
                </span>
                <ChevronSortIcon className="size-2" />
              </button>
            </>
          )}

          {selectedBranch && (
            <>
              <div className="w-px h-4 bg-surface-3 shrink-0" />
              <button
                type="button"
                onClick={() => {
                  setMobileStep('issues');
                  setMobileOpen(true);
                  setMobileIssuesPage(1);
                }}
                className={cn(
                  'flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5',
                  'hover:bg-white/10',
                  mobileOpen && mobileStep === 'issues' && 'bg-white/10'
                )}
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span className="text-[14px] text-text-muted">
                  {selectedIssue ? `#${selectedIssue.number}` : 'Issue'}
                </span>
                <ChevronSortIcon className="size-2" />
              </button>
            </>
          )}
        </div>
      </DrawerTrigger>
      <DrawerContent className="border-border-subtle bg-surface-1 rounded-t-xl">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-surface-3 shrink-0" />
        <MobileSelectorContent
          step={mobileStep}
          selectedRepository={selectedRepository}
          selectedBranch={selectedBranch}
          selectedIssue={selectedIssue}
          installations={installations}
          installationRepos={installationRepos}
          filteredBranches={filteredBranches}
          filteredIssues={filteredIssues}
          branchesLoading={branchesLoading}
          issuesList={issuesList}
          accountSearchQuery={accountSearchQuery}
          setAccountSearchQuery={setAccountSearchQuery}
          branchSearchQuery={branchSearchQuery}
          setBranchSearchQuery={setBranchSearchQuery}
          issueQuery={issueQuery}
          setIssueQuery={setIssueQuery}
          setStep={setMobileStep}
          onSelectRepo={onSelectRepo}
          onSelectBranch={onSelectBranch}
          onSelectIssue={onSelectIssue}
          onClose={() => setMobileOpen(false)}
          accountsPage={mobileAccountsPage}
          setAccountsPage={setMobileAccountsPage}
          branchesPage={mobileBranchesPage}
          setBranchesPage={setMobileBranchesPage}
          issuesPage={mobileIssuesPage}
          setIssuesPage={setMobileIssuesPage}
        />
      </DrawerContent>
    </Drawer>
  );
}

export function RepoBranchIssueSelector({
  selectedRepository,
  selectedBranch,
  selectedIssue,
  installations,
  installationRepos,
  filteredBranches,
  filteredIssues,
  branchesLoading,
  issuesList,
  accountSearchQuery,
  setAccountSearchQuery,
  branchSearchQuery,
  setBranchSearchQuery,
  issueQuery,
  setIssueQuery,
  onSelectRepo,
  onSelectBranch,
  onSelectIssue,
  openStep = 'repos',
}: RepoBranchIssueSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);

  const [dropdownState, setDropdownState] = useState({
    accountsOpen: false,
    branchesOpen: false,
    issuesOpen: false,
  });

  const [pagination, setPagination] = useState({
    accountsPage: 1,
    branchesPage: 1,
    issuesPage: 1,
    mobileAccountsPage: 1,
    mobileBranchesPage: 1,
    mobileIssuesPage: 1,
  });

  const [mobileNav, setMobileNav] = useState({
    open: false,
    step: openStep as Step,
  });
  const prevOpenStepRef = useRef(openStep);
  if (prevOpenStepRef.current !== openStep) {
    prevOpenStepRef.current = openStep;
    setMobileNav((prev) => ({ ...prev, step: openStep }));
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const prevAccountQueryRef = useRef(accountSearchQuery);
  const prevBranchQueryRef = useRef(branchSearchQuery);
  const prevIssueQRef = useRef(issueQuery);

  if (accountSearchQuery !== prevAccountQueryRef.current) {
    prevAccountQueryRef.current = accountSearchQuery;
    setPagination((prev) => ({
      ...prev,
      accountsPage: 1,
      mobileAccountsPage: 1,
    }));
  }

  if (branchSearchQuery !== prevBranchQueryRef.current) {
    prevBranchQueryRef.current = branchSearchQuery;
    setPagination((prev) => ({
      ...prev,
      branchesPage: 1,
      mobileBranchesPage: 1,
    }));
  }

  if (issueQuery !== prevIssueQRef.current) {
    prevIssueQRef.current = issueQuery;
    setPagination((prev) => ({ ...prev, issuesPage: 1, mobileIssuesPage: 1 }));
  }

  const { accountsOpen, branchesOpen, issuesOpen } = dropdownState;
  const setAccountsOpen = (v: boolean) =>
    setDropdownState((prev) => ({ ...prev, accountsOpen: v }));
  const setBranchesOpen = (v: boolean) =>
    setDropdownState((prev) => ({ ...prev, branchesOpen: v }));
  const setIssuesOpen = (v: boolean) =>
    setDropdownState((prev) => ({ ...prev, issuesOpen: v }));

  const {
    accountsPage,
    branchesPage,
    issuesPage,
    mobileAccountsPage,
    mobileBranchesPage,
    mobileIssuesPage,
  } = pagination;
  const setAccountsPage = (v: number) =>
    setPagination((prev) => ({ ...prev, accountsPage: v }));
  const setBranchesPage = (v: number) =>
    setPagination((prev) => ({ ...prev, branchesPage: v }));
  const setIssuesPage = (v: number) =>
    setPagination((prev) => ({ ...prev, issuesPage: v }));
  const setMobileAccountsPage = (v: number) =>
    setPagination((prev) => ({ ...prev, mobileAccountsPage: v }));
  const setMobileBranchesPage = (v: number) =>
    setPagination((prev) => ({ ...prev, mobileBranchesPage: v }));
  const setMobileIssuesPage = (v: number) =>
    setPagination((prev) => ({ ...prev, mobileIssuesPage: v }));

  const mobileOpen = mobileNav.open;
  const mobileStep = mobileNav.step;
  const setMobileOpen = (v: boolean) =>
    setMobileNav((prev) => ({ ...prev, open: v }));
  const setMobileStep = (v: Step) =>
    setMobileNav((prev) => ({ ...prev, step: v }));

  const handleSelectRepo = (repo: string) => {
    onSelectRepo(repo);
  };

  const handleSelectBranch = (branch: string) => {
    onSelectBranch(branch);
  };

  const handleSelectIssue = (issue: Issue) => {
    onSelectIssue(issue);
    setMobileOpen(false);
  };

  if (openStep === 'branches') {
    return null;
  }
  if (openStep === 'issues') {
    return null;
  }

  if (isMobile) {
    return (
      <MobileDrawerView
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        mobileStep={mobileStep}
        setMobileStep={setMobileStep}
        selectedRepository={selectedRepository}
        selectedBranch={selectedBranch}
        selectedIssue={selectedIssue}
        installations={installations}
        installationRepos={installationRepos}
        filteredBranches={filteredBranches}
        filteredIssues={filteredIssues}
        branchesLoading={branchesLoading}
        issuesList={issuesList}
        accountSearchQuery={accountSearchQuery}
        setAccountSearchQuery={setAccountSearchQuery}
        branchSearchQuery={branchSearchQuery}
        setBranchSearchQuery={setBranchSearchQuery}
        issueQuery={issueQuery}
        setIssueQuery={setIssueQuery}
        mobileAccountsPage={mobileAccountsPage}
        setMobileAccountsPage={setMobileAccountsPage}
        mobileBranchesPage={mobileBranchesPage}
        setMobileBranchesPage={setMobileBranchesPage}
        mobileIssuesPage={mobileIssuesPage}
        setMobileIssuesPage={setMobileIssuesPage}
        onSelectRepo={handleSelectRepo}
        onSelectBranch={handleSelectBranch}
        onSelectIssue={handleSelectIssue}
      />
    );
  }

  return (
    <div className="flex items-center gap-4">
      <DesktopRepoDropdown
        accountsOpen={accountsOpen}
        setAccountsOpen={setAccountsOpen}
        selectedRepository={selectedRepository}
        installations={installations}
        installationRepos={installationRepos}
        accountsPage={accountsPage}
        setAccountsPage={setAccountsPage}
        onSelectRepo={handleSelectRepo}
      />
      {selectedRepository && (
        <DesktopBranchDropdown
          branchesOpen={branchesOpen}
          setBranchesOpen={setBranchesOpen}
          selectedBranch={selectedBranch}
          filteredBranches={filteredBranches}
          branchesPage={branchesPage}
          setBranchesPage={setBranchesPage}
          branchesLoading={branchesLoading}
          onSelectBranch={handleSelectBranch}
        />
      )}
      {selectedBranch && (
        <DesktopIssueDropdown
          issuesOpen={issuesOpen}
          setIssuesOpen={setIssuesOpen}
          selectedIssue={selectedIssue}
          filteredIssues={filteredIssues}
          issuesPage={issuesPage}
          setIssuesPage={setIssuesPage}
          issuesList={issuesList}
          onSelectIssue={handleSelectIssue}
        />
      )}
    </div>
  );
}
