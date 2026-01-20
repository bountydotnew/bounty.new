'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { GithubIcon } from '@bounty/ui';
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

interface RepoSelectorProps {
  selectedRepository: string;
  installations: Account[];
  installationRepos: InstallationRepos[];
  reposLoading: boolean;
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  repoSearchQuery: string;
  setRepoSearchQuery: (query: string) => void;
  onSelect: (repo: string) => void;
}

// Shared content component for both desktop and mobile
function RepoSelectorContent({
  installations,
  installationRepos,
  selectedRepository,
  reposLoading,
  selectedAccount,
  setSelectedAccount,
  accountSearchQuery,
  setAccountSearchQuery,
  onSelectRepo,
}: {
  installations: Account[];
  installationRepos: InstallationRepos[];
  selectedRepository: string;
  reposLoading: boolean;
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  accountSearchQuery: string;
  setAccountSearchQuery: (query: string) => void;
  repoSearchQuery: string;
  setRepoSearchQuery: (query: string) => void;
  onSelectRepo: (repo: string) => void;
  onClose: () => void;
}) {
  const selectedAccountRepos = selectedAccount
    ? installationRepos.find((r) => r.installationId === selectedAccount.id)
    : null;

  return (
    <div className="flex flex-col">
      {/* Header with search or back button */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#232323]">
        {selectedAccount ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedAccount(null);
                setAccountSearchQuery('');
              }}
              className="p-1 -ml-1 rounded hover:bg-[#141414] text-[#CFCFCF]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <GithubIcon className="w-4 h-4 text-[#5A5A5A]" />
            <span className="text-sm text-[#CFCFCF]">
              {selectedAccount.accountLogin ?? 'Unknown Account'}
            </span>
          </>
        ) : (
          <input
            className="flex-1 bg-transparent text-sm text-[#CFCFCF] placeholder:text-[#5A5A5A] outline-none"
            placeholder={installations.length === 1
              ? installations[0]?.accountLogin ?? 'Search...'
              : 'Search accounts...'}
            value={accountSearchQuery}
            onChange={(e) => setAccountSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-h-[250px] overflow-y-auto p-1">
        {reposLoading && !selectedAccount ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[#5A5A5A]" />
          </div>
        ) : selectedAccount ? (
          // Repos
          selectedAccountRepos?.repositories && selectedAccountRepos.repositories.length > 0 ? (
            selectedAccountRepos.repositories.map((repo: string) => (
              <button
                key={repo}
                type="button"
                onClick={() => {
                  onSelectRepo(repo);
                  setSelectedAccount(null);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left transition-colors",
                  "hover:bg-[#141414]",
                  selectedRepository === repo && "bg-[#141414]"
                )}
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#5A5A5A] shrink-0" />
                <span className="flex-1 text-sm text-[#CFCFCF] truncate">
                  {repo}
                </span>
                {selectedRepository === repo && (
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-[#5A5A5A]">
              No repositories
            </div>
          )
        ) : (
          // Accounts
          installations.map((account) => {
            const count = installationRepos.find((r) => r.installationId === account.id)?.repositories.length ?? 0;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelectedAccount(account)}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-left hover:bg-[#141414] transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 text-[#5A5A5A] shrink-0" />
                <span className="flex-1 text-sm text-[#CFCFCF] truncate">
                  {account.accountLogin ?? 'Unknown Account'}
                </span>
                <span className="text-xs text-[#5A5A5A]">{count}</span>
                <ChevronRight className="w-3 h-3 text-[#5A5A5A] shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RepoSelector({
  selectedRepository,
  installations,
  installationRepos,
  reposLoading,
  accountSearchQuery,
  setAccountSearchQuery,
  repoSearchQuery,
  setRepoSearchQuery,
  onSelect,
}: RepoSelectorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!open) setSelectedAccount(null);
  }, [open]);

  const handleSelectRepo = (repo: string) => {
    onSelect(repo);
    setOpen(false);
    setSelectedAccount(null);
  };

  const TriggerButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-[#5A5A5A] hover:text-[#888] transition-colors"
    >
      <GithubIcon className="w-4 h-4" />
      {selectedRepository ? (
        <span className="text-sm text-white">{selectedRepository}</span>
      ) : (
        <span className="text-sm">Select repository</span>
      )}
      <ChevronRight className="w-3 h-3" />
    </button>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent className="border-[#232323] bg-[#191919] rounded-t-xl">
          <RepoSelectorContent
            installations={installations}
            installationRepos={installationRepos}
            selectedRepository={selectedRepository}
            reposLoading={reposLoading}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            accountSearchQuery={accountSearchQuery}
            setAccountSearchQuery={setAccountSearchQuery}
            repoSearchQuery={repoSearchQuery}
            setRepoSearchQuery={setRepoSearchQuery}
            onSelectRepo={handleSelectRepo}
            onClose={() => setOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dropdown
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl"
        align="start"
        sideOffset={4}
      >
        <RepoSelectorContent
          installations={installations}
          installationRepos={installationRepos}
          selectedRepository={selectedRepository}
          reposLoading={reposLoading}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          accountSearchQuery={accountSearchQuery}
          setAccountSearchQuery={setAccountSearchQuery}
          repoSearchQuery={repoSearchQuery}
          setRepoSearchQuery={setRepoSearchQuery}
          onSelectRepo={handleSelectRepo}
          onClose={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
