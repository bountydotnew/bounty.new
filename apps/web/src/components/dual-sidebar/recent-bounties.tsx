'use client';

import { useEffect, useState } from 'react';
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
  const updated = [
    { ...bounty, timestamp: Date.now() },
    ...filtered
  ].slice(0, 5);
  localStorage.setItem(RECENT_BOUNTIES_KEY, JSON.stringify(updated));
}

function RecentlyViewedSection() {
  const [recentBounties, setRecentBounties] = useState<RecentBounty[]>([]);

  useEffect(() => {
    const loadRecentBounties = () => {
      const stored = localStorage.getItem(RECENT_BOUNTIES_KEY);
      if (stored) {
        try {
          const parsed: RecentBounty[] = JSON.parse(stored);
          setRecentBounties(parsed);
        } catch {
          setRecentBounties([]);
        }
      }
    };

    loadRecentBounties();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECENT_BOUNTIES_KEY && e.newValue) {
        try {
          const parsed: RecentBounty[] = JSON.parse(e.newValue);
          setRecentBounties(parsed);
        } catch {
          setRecentBounties([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (recentBounties.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel>Recently Viewed</SidebarGroupLabel>
      <SidebarMenu className="flex flex-col gap-[8px] w-full">
        {recentBounties.map((bounty) => (
          <SidebarMenuItem key={bounty.id}>
            <SidebarMenuButton
              asChild
              tooltip={bounty.title}
            >
              <a
                href={`/bounty/${bounty.id}`}
                className="flex items-center gap-2"
              >
                <ClockIcon className="h-[19px] w-[19px]" />
                <span className="truncate text-sm">{bounty.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function RecentlyStartedSection() {
  const { session, isAuthenticated } = useSession();
  const userId = session?.user?.id;

  const { data } = useQuery({
    ...trpc.bounties.getBountiesByUserId.queryOptions({
      userId: userId ?? '',
    }),
    enabled: isAuthenticated && !!userId,
  });

  const bounties = data?.data?.slice(0, 5) ?? [];

  if (bounties.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel>Recently Started</SidebarGroupLabel>
      <SidebarMenu className="flex flex-col gap-[8px] w-full">
        {bounties.map((bounty) => (
          <SidebarMenuItem key={bounty.id}>
            <SidebarMenuButton
              asChild
              tooltip={bounty.title}
            >
              <a
                href={`/bounty/${bounty.id}`}
                className="flex items-center gap-2"
              >
                <HourglassIcon className="h-[19px] w-[19px]" />
                <span className="truncate text-sm">{bounty.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function RecentBountiesGroup() {
  return (
    <>
      <RecentlyViewedSection />
      <RecentlyStartedSection />
    </>
  );
}
