'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LINKS } from '@/constants';
import { trpc } from '@/utils/trpc';
import { useActiveOrg } from '@/hooks/use-active-org';
import styles from './command-menu.module.css';
import {
  Avatar,
  AvatarImage,
  BookmarksIcon,
  BountiesIcon,
  CommentsIcon,
  HomeIcon,
  SettingsGearIcon,
  Spinner,
} from '@bounty/ui';
import type { BountyCommandItemProps, CommandMenuProps } from '@bounty/types';

const NAV_ITEMS = [
  {
    value: 'home',
    label: 'Home',
    icon: HomeIcon,
    description: 'Go to dashboard',
    action: LINKS.DASHBOARD,
  },
  {
    value: 'bounties',
    label: 'Bounties',
    icon: BountiesIcon,
    description: 'Browse bounties',
    action: LINKS.BOUNTIES,
  },
  {
    value: 'bookmarks',
    label: 'Bookmarks',
    icon: BookmarksIcon,
    description: 'View saved items',
    action: LINKS.BOOKMARKS,
  },
];

function BountyCommandItem({
  bounty,
  commentCount,
  isLoading,
  onSelect,
}: BountyCommandItemProps) {
  const bountyValue = `bounty-${bounty.id}`;
  const amount =
    typeof bounty.amount === 'string'
      ? Number.parseFloat(bounty.amount)
      : bounty.amount;
  const formattedAmount = amount ? `$${amount.toLocaleString()}` : '';

  return (
    <Command.Item key={bounty.id} value={bountyValue} onSelect={onSelect}>
      {isLoading ? (
        <Spinner size="sm" className="mr-3 h-5 w-5 text-foreground" />
      ) : bounty.creator?.image ? (
        <Avatar>
          <AvatarImage src={bounty.creator.image} />
        </Avatar>
      ) : (
        <div className="flex items-center justify-center mr-3 h-5 w-5 rounded-full bg-surface-3">
          <BountiesIcon className="h-4 w-4 text-foreground" />
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[15px] text-foreground truncate">
          {bounty.title}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <CommentsIcon className="h-3.5 w-3.5" />
          <span>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
      {formattedAmount && (
        <span className="ml-auto text-xs font-medium text-green-400 whitespace-nowrap">
          {formattedAmount}
        </span>
      )}
    </Command.Item>
  );
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { activeOrgSlug } = useActiveOrg();

  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [loadingValue, setLoadingValue] = useState<string | null>(null);
  const [bountySearchMode, setBountySearchMode] = useState(false);

  const hasActions = selectedValue === 'bounties' && !bountySearchMode;

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedValue('');
      setLoadingValue(null);
      setBountySearchMode(false);
    }
  }, [open]);

  // Track selected item using cmdk's onValueChange
  const handleValueChange = (value: string) => {
    // Track all values, but only non-bounty values affect hasActions
    if (value) {
      setSelectedValue(value);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to enter bounty search mode
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === 'Enter' &&
        hasActions
      ) {
        event.preventDefault();
        event.stopPropagation();
        setBountySearchMode(true);
        setSearch(''); // Clear search when entering bounty mode
        return;
      }

      // Handle Backspace to exit bounty search mode when search is empty
      if (event.key === 'Backspace' && bountySearchMode && !search) {
        event.preventDefault();
        event.stopPropagation();
        setBountySearchMode(false);
        setSelectedValue('bounties'); // Reset to bounties selection
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to intercept before cmdk
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, hasActions, bountySearchMode, search]);

  const handleActionsClick = () => {
    if (hasActions) {
      setBountySearchMode(true);
      setSearch(''); // Clear search when entering bounty mode
    }
  };

  const bountySearchQuery = useQuery({
    ...trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 15,
      search: search || undefined,
    }),
    enabled: bountySearchMode,
  });

  const bountyIds = useMemo(
    () => bountySearchQuery.data?.data?.map((bounty) => bounty.id) || [],
    [bountySearchQuery.data?.data]
  );

  const bountyStatsQuery = useQuery({
    ...trpc.bounties.getBountyStatsMany.queryOptions({ bountyIds }),
    enabled: bountySearchMode && bountyIds.length > 0,
  });

  const statsMap = useMemo(() => {
    const map = new Map<string, { commentCount: number }>();
    for (const stat of bountyStatsQuery.data?.stats || []) {
      map.set(stat.bountyId, { commentCount: stat.commentCount });
    }
    return map;
  }, [bountyStatsQuery.data]);

  const selectedLabel = useMemo(() => {
    if (bountySearchMode) {
      const selectedBounty = bountySearchQuery.data?.data?.find(
        (bounty) => `bounty-${bounty.id}` === selectedValue
      );
      if (selectedBounty) {
        return `Open ${selectedBounty.title}`;
      }
      return 'Select a bounty';
    }
    const navItem = NAV_ITEMS.find((item) => item.value === selectedValue);
    if (navItem) {
      return `Open ${navItem.label}`;
    }
    if (selectedValue === 'create-bounty') {
      return 'Create Bounty';
    }
    if (selectedValue === 'settings') {
      return 'Open Settings';
    }
    return 'Open';
  }, [selectedValue, bountySearchMode, bountySearchQuery.data]);

  const handleSelect = (value: string) => {
    // Don't navigate if selecting bounties item while in bounty search mode
    if (value === 'bounties' && bountySearchMode) {
      return;
    }

    setLoadingValue(value);

    switch (value) {
      case 'home':
        router.push(LINKS.DASHBOARD);
        break;
      case 'bounties':
        if (!bountySearchMode) {
          router.push(LINKS.BOUNTIES);
        }
        break;
      case 'bookmarks':
        router.push(LINKS.BOOKMARKS);
        break;
      case 'settings':
        if (activeOrgSlug) {
          router.push(`/${activeOrgSlug}/settings/account`);
        } else {
          router.push(LINKS.DASHBOARD);
        }
        break;
      case 'create-bounty':
        router.push('/dashboard#focus-textarea');
        break;
      default:
        if (value.startsWith('bounty-')) {
          router.push(`${LINKS.BOUNTY.VIEW}/${value.replace('bounty-', '')}`);
        }
        break;
    }

    // Close menu after a brief delay to show loading state
    setTimeout(() => {
      onOpenChange(false);
      setLoadingValue(null);
      setBountySearchMode(false);
    }, 100);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-9999 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Global Command Menu"
        className={`${styles.dialog} fixed left-1/2 top-[20%] z-10000 w-[660px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-[15px] border border-border-subtle bg-surface-1 shadow-lg`}
      >
        <Command
          className="flex flex-col h-full"
          value={selectedValue}
          onValueChange={handleValueChange}
        >
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={
              bountySearchMode
                ? 'Search all bounties...'
                : 'Search for apps and commands...'
            }
            className={`${styles.input} h-[54px] border-b border-border-subtle bg-transparent px-4 text-[15px] font-medium text-foreground placeholder:text-text-tertiary outline-none`}
          />

          <Command.List
            className={`${styles.list} h-full overflow-y-auto items-center px-2 py-3`}
          >
            {bountySearchMode ? (
              <>
                <Command.Empty>No bounties found.</Command.Empty>
                {bountySearchQuery.data?.data &&
                  bountySearchQuery.data.data.length > 0 && (
                    <Command.Group heading="Bounties" className={styles.group}>
                      {bountySearchQuery.data.data.map((bounty) => {
                        const bountyValue = `bounty-${bounty.id}`;
                        const isLoading = loadingValue === bountyValue;
                        const commentCount =
                          statsMap.get(bounty.id)?.commentCount ?? 0;
                        return (
                          <BountyCommandItem
                            key={bounty.id}
                            bounty={bounty}
                            commentCount={commentCount}
                            isLoading={isLoading}
                            onSelect={handleSelect}
                          />
                        );
                      })}
                    </Command.Group>
                  )}
              </>
            ) : (
              <>
                <Command.Empty>No results found.</Command.Empty>

                <Command.Group heading="Navigation" className={styles.group}>
                  {NAV_ITEMS.map((item) => {
                    const isLoading = loadingValue === item.value;
                    const IconComponent = item.icon;
                    return (
                      <Command.Item
                        key={item.value}
                        value={item.value}
                        keywords={[item.label.toLowerCase()]}
                        onSelect={handleSelect}
                      >
                        {isLoading ? (
                          <Spinner
                            size="sm"
                            className="mr-3 h-5 w-5 text-foreground"
                          />
                        ) : (
                          <IconComponent className="mr-3 h-5 w-5 text-foreground" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-[15px] text-foreground">
                            {item.label}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {item.description}
                          </span>
                        </div>
                        <span className="ml-auto text-xs text-text-tertiary">
                          Application
                        </span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                <Command.Group heading="Actions" className={styles.group}>
                  <Command.Item value="create-bounty" onSelect={handleSelect}>
                    {loadingValue === 'create-bounty' ? (
                      <Spinner
                        size="sm"
                        className="mr-3 h-5 w-5 text-foreground"
                      />
                    ) : (
                      <Plus className="mr-3 h-5 w-5 text-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[15px] text-foreground">
                        Create Bounty
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Start a new bounty
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-text-tertiary">
                      Command
                    </span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings" className={styles.group}>
                  <Command.Item value="settings" onSelect={handleSelect}>
                    {loadingValue === 'settings' ? (
                      <Spinner
                        size="sm"
                        className="mr-3 h-5 w-5 text-foreground"
                      />
                    ) : (
                      <SettingsGearIcon className="mr-3 h-5 w-5 text-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[15px] text-foreground">
                        Settings
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Manage your workspace
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-text-tertiary">
                      Command
                    </span>
                  </Command.Item>
                </Command.Group>
              </>
            )}
          </Command.List>

          <div className="flex h-[44px] items-center gap-3 border-t border-border-subtle bg-surface-2 px-4 text-xs text-text-tertiary">
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-surface-1 px-2 py-0.5 text-text-tertiary text-[15px]">
                ↵
              </kbd>
              <span>{selectedLabel}</span>
            </div>

            {!bountySearchMode && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleActionsClick}
                  className={`flex items-center gap-2 px-3 py-1 text-xs transition ${
                    hasActions
                      ? 'cursor-pointer text-foreground hover:text-foreground'
                      : 'cursor-not-allowed text-text-muted'
                  }`}
                  disabled={!hasActions}
                >
                  Actions
                  <span className="flex items-center gap-1 text-text-tertiary">
                    <kbd className="rounded bg-surface-1 px-1 py-0.5">⌘</kbd>
                    <kbd className="rounded bg-surface-1 px-1 py-0.5">↵</kbd>
                  </span>
                </button>
              </div>
            )}
          </div>
        </Command>
      </Command.Dialog>
    </>
  );
}
