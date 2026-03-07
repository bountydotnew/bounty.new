'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from '@bounty/ui/components/link';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon, HourglassIcon } from '@bounty/ui';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@bounty/ui/components/sidebar';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';

const RECENT_BOUNTIES_KEY = 'recent_bounties';

interface RecentBounty {
  id: string;
  title: string;
  timestamp: number;
}

export function addRecentBounty(bounty: { id: string; title: string }) {
  const stored = localStorage.getItem(RECENT_BOUNTIES_KEY);
  const recent: RecentBounty[] = stored ? JSON.parse(stored) : [];
  const filtered = recent.filter((b) => b.id !== bounty.id);
  const updated = [{ ...bounty, timestamp: Date.now() }, ...filtered].slice(
    0,
    5
  );
  localStorage.setItem(RECENT_BOUNTIES_KEY, JSON.stringify(updated));
}

function parseStoredBounties(raw: string | null): RecentBounty[] {
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as RecentBounty[];
  } catch {
    return [];
  }
}

export function RecentBountiesGroup() {
  const [recentBounties, setRecentBounties] = useState<RecentBounty[]>(() =>
    typeof window !== 'undefined'
      ? parseStoredBounties(localStorage.getItem(RECENT_BOUNTIES_KEY))
      : []
  );
  const { session, isAuthenticated } = useSession();
  const userId = session?.user?.id;

  const { data } = useQuery({
    ...trpc.bounties.getBountiesByUserId.queryOptions({
      userId: userId ?? '',
    }),
    enabled: isAuthenticated && !!userId,
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECENT_BOUNTIES_KEY) {
        setRecentBounties(parseStoredBounties(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_BOUNTIES_KEY);
    setRecentBounties([]);
  }, []);

  const startedBounties = data?.data?.slice(0, 5) ?? [];

  // Create a Set of IDs from started bounties to filter out duplicates
  const startedBountyIds = new Set(startedBounties.map((b) => b.id));

  // Filter out viewed bounties that are already in started bounties
  const filteredRecentBounties = recentBounties.filter(
    (b) => !startedBountyIds.has(b.id)
  );

  if (filteredRecentBounties.length === 0 && startedBounties.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="mt-4">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Recent Bounties</SidebarGroupLabel>
        {filteredRecentBounties.length > 0 && (
          <button
            type="button"
            onClick={clearRecent}
            className="px-1.5 py-0.5 rounded-md text-[11px] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <SidebarMenu className="flex flex-col gap-[8px] w-full">
        {startedBounties.map((bounty) => (
          <SidebarMenuItem key={`started-${bounty.id}`}>
            <SidebarMenuButton asChild tooltip={bounty.title}>
              <Link
                href={`/bounty/${bounty.id}`}
                className="flex items-center gap-2"
              >
                <HourglassIcon className="h-[19px] w-[19px]" />
                <span className="truncate text-sm">{bounty.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {filteredRecentBounties.map((bounty) => (
          <SidebarMenuItem key={`viewed-${bounty.id}`}>
            <SidebarMenuButton asChild tooltip={bounty.title}>
              <Link
                href={`/bounty/${bounty.id}`}
                className="flex items-center gap-2"
              >
                <ClockIcon className="h-[19px] w-[19px]" />
                <span className="truncate text-sm">{bounty.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
