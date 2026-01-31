'use client';

import { useState, useEffect } from 'react';
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

// Minimal pagination: prev/next arrows with page count
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
  const ACCOUNTS_PER_PAGE = 5;
  const totalAccountPages = Math.ceil(installations.length / ACCOUNTS_PER_PAGE);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        {selectedAccount ? (
          <>
            <button
              type="button"
              onClick={() => setSelectedAccount(null)}
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
              placeholder={installations.length === 1
                ? installations[0]?.accountLogin ?? 'Search accounts...'
                : 'Search accounts...'}
              autoComplete="off"
              spellCheck={false}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[250px] max-h-[250px] overflow-y-auto p-1">
        {!selectedAccount ? (
          // Accounts list
          installations.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-tertiary">
              No accounts found
            </div>
          ) : (
            installations
              .slice((accountsPage - 1) * ACCOUNTS_PER_PAGE, accountsPage * ACCOUNTS_PER_PAGE)
              .map((account) => {
                const accountRepos = installationRepos.find((r) => r.installationId === account.id);
                const count = accountRepos?.repositories.length ?? 0;
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccount(account)}
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
          )
        ) : (
          // Repos list for selected account
          (() => {
            const accountRepos = installationRepos.find((r) => r.installationId === selectedAccount.id);
            return (
              <>
                {accountRepos?.repositories && accountRepos.repositories.length > 0 ? (
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
                      <span className="flex-1 text-sm text-text-secondary truncate">{repo}</span>
                      <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-text-tertiary">No repositories</div>
                )}
              </>
            );
          })()
        )}
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
  const BRANCHES_PER_PAGE = 10;
  const totalBranchPages = Math.ceil(filteredBranches.length / BRANCHES_PER_PAGE);
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
              <span className="flex-1 text-sm text-text-secondary truncate">{branch}</span>
            </button>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-text-tertiary">No branches found</div>
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
  const ISSUES_PER_PAGE = 10;
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
                "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors",
                "hover:bg-white/10",
                selectedIssue?.number === issue.number && "bg-white/5"
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
          <div className="px-3 py-2 text-sm text-text-tertiary">No open issues</div>
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
// UNIFIED SELECTOR (Mobile Drawer)
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
  const ACCOUNTS_PER_PAGE = 5;
  const BRANCHES_PER_PAGE = 10;
  const ISSUES_PER_PAGE = 10;

  // Calculate total pages
  const totalAccountPages = Math.ceil(installations.length / ACCOUNTS_PER_PAGE);
  const totalBranchPages = Math.ceil(filteredBranches.length / BRANCHES_PER_PAGE);
  const totalIssuePages = Math.ceil(filteredIssues.length / ISSUES_PER_PAGE);

  // Header based on current step
  const renderHeader = () => {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle">
        {step !== 'repos' && (
          <button
            type="button"
            onClick={() => {
              if (step === 'issues') setStep('branches');
              else if (step === 'branches') setStep('repos');
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
              placeholder={installations.length === 1
                ? installations[0]?.accountLogin ?? 'Search accounts...'
                : 'Search accounts...'}
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
              onClick={() => setSelectedAccount(null)}
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
  };

  // Content based on current step
  const renderContent = () => {
    // REPOS STEP - Accounts or Repos
    if (step === 'repos') {
      if (selectedAccount) {
        const accountRepos = installationRepos.find((r) => r.installationId === selectedAccount.id);
        return (
          <>
            {accountRepos?.repositories && accountRepos.repositories.length > 0 ? (
              accountRepos.repositories.map((repo: string) => (
                <button
                  key={repo}
                  type="button"
                  onClick={() => {
                    onSelectRepo(repo);
                    setStep('branches');
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors",
                    "hover:bg-white/10",
                    selectedRepository === repo && "bg-white/5"
                  )}
                >
                  <GithubIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <span className="flex-1 text-sm text-text-secondary truncate">{repo}</span>
                  {selectedRepository === repo && (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  )}
                  <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-text-tertiary">No repositories</div>
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
          {branchesLoading && !installationRepos.some((r) => r.repositories.length > 0) ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
            </div>
          ) : (
            paginatedInstallations.map((account) => {
              const accountRepos = installationRepos.find((r) => r.installationId === account.id);
              const count = accountRepos?.repositories.length ?? 0;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedAccount(account)}
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

    // BRANCHES STEP
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
                  onSelectBranch(branch);
                  setStep('issues');
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors",
                  "hover:bg-white/10",
                  selectedBranch === branch && "bg-white/5"
                )}
              >
                <BranchIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span className="flex-1 text-sm text-text-secondary truncate">{branch}</span>
                {selectedBranch === branch && (
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
                <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-text-tertiary">No branches found</div>
          )}
        </>
      );
    }

    // ISSUES STEP
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
                  "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors",
                  "hover:bg-white/10",
                  selectedIssue?.number === issue.number && "bg-white/5"
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
            <div className="px-3 py-2 text-sm text-text-tertiary">No open issues</div>
          )}
        </>
      );
    }

    return null;
  };

  // Calculate which pagination to show
  const showPagination = totalAccountPages > 1 && step === 'repos' && !selectedAccount;
  const showBranchesPagination = totalBranchPages > 1 && step === 'branches';
  const showIssuesPagination = totalIssuePages > 1 && step === 'issues';

  return (
    <div className="flex flex-col">
      {renderHeader()}
      <div className="min-h-[250px] max-h-[250px] overflow-y-auto p-1">
        {renderContent()}
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

  // Desktop: separate state for each dropdown
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);

  // Desktop pagination states
  const [accountsPage, setAccountsPage] = useState(1);
  const [branchesPage, setBranchesPage] = useState(1);
  const [issuesPage, setIssuesPage] = useState(1);

  // Mobile: unified drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<Step>(openStep);
  const [mobileAccountsPage, setMobileAccountsPage] = useState(1);
  const [mobileBranchesPage, setMobileBranchesPage] = useState(1);
  const [mobileIssuesPage, setMobileIssuesPage] = useState(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset pagination when search queries change
  useEffect(() => {
    setAccountsPage(1);
    setMobileAccountsPage(1);
  }, [accountSearchQuery]);

  useEffect(() => {
    setBranchesPage(1);
    setMobileBranchesPage(1);
  }, [branchSearchQuery]);

  useEffect(() => {
    setIssuesPage(1);
    setMobileIssuesPage(1);
  }, [issueQuery]);

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

  // If opening from specific trigger, hide other triggers (for standalone usage)
  if (openStep === 'branches') {
    // Only show branch selector (not implemented here, would need separate component)
    return null;
  }
  if (openStep === 'issues') {
    // Only show issue selector (not implemented here, would need separate component)
    return null;
  }

  // ============================================================================
  // MOBILE: Unified Drawer
  // ============================================================================
  if (isMobile) {
    return (
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerTrigger asChild>
          <div className="flex items-center gap-4">
            {/* Repo trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileStep('repos');
                setMobileOpen(true);
                setMobileAccountsPage(1);
              }}
              className={cn(
                "flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
                "hover:bg-white/10",
                mobileOpen && mobileStep === 'repos' && "bg-white/10"
              )}
            >
              <GithubIcon className="w-4 h-4" />
              {selectedRepository ? (
                <span className="text-sm text-foreground">{selectedRepository}</span>
              ) : (
                <span className="text-sm">Select repository</span>
              )}
              <ChevronSortIcon className="size-2" />
            </button>

            {/* Branch trigger */}
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
                    "flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
                    "hover:bg-white/10",
                    mobileOpen && mobileStep === 'branches' && "bg-white/10"
                  )}
                >
                  <BranchIcon className="w-3.5 h-3.5" />
                  <span className="text-[14px] text-text-muted">{selectedBranch}</span>
                  <ChevronSortIcon className="size-2" />
                </button>
              </>
            )}

            {/* Issue trigger */}
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
                    "flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
                    "hover:bg-white/10",
                    mobileOpen && mobileStep === 'issues' && "bg-white/10"
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
            onSelectRepo={handleSelectRepo}
            onSelectBranch={handleSelectBranch}
            onSelectIssue={handleSelectIssue}
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

  // ============================================================================
  // DESKTOP: Separate Dropdowns for each scope
  // ============================================================================

  // Repo/Accounts Dropdown
  const AccountsDropdown = (
    <DropdownMenu open={accountsOpen} onOpenChange={setAccountsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
            "hover:bg-white/10",
            accountsOpen && "bg-white/10"
          )}
        >
          <GithubIcon className="w-4 h-4" />
          {selectedRepository ? (
            <span className="text-sm text-foreground">{selectedRepository}</span>
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
          onSelectRepo={handleSelectRepo}
          onClose={() => setAccountsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Branches Dropdown
  const BranchesDropdown = selectedRepository ? (
    <DropdownMenu open={branchesOpen} onOpenChange={setBranchesOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
            "hover:bg-white/10",
            branchesOpen && "bg-white/10"
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
          onSelectBranch={handleSelectBranch}
          onClose={() => setBranchesOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  // Issues Dropdown
  const IssuesDropdown = selectedBranch ? (
    <DropdownMenu open={issuesOpen} onOpenChange={setIssuesOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 text-text-tertiary transition-colors rounded-full py-0.5 px-1.5",
            "hover:bg-white/10",
            issuesOpen && "bg-white/10"
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
          onSelectIssue={handleSelectIssue}
          onClose={() => setIssuesOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  return (
    <div className="flex items-center gap-4">
      {AccountsDropdown}
      {BranchesDropdown}
      {IssuesDropdown}
    </div>
  );
}
