'use client';

import * as React from 'react';
import {
  ArrowDownIcon,
  BountiesIcon,
  BookmarksIcon,
  HomeIcon as HugeHomeIcon,
  NotificationsIcon,
  SettingsGearIcon,
  SidebarToggleIcon,
} from '@bounty/ui';
import { cn } from '@bounty/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@bounty/ui/components/sidebar';
import { authClient } from '@bounty/auth/client';
import { usePathname, useRouter } from 'next/navigation';
import { AccessGate } from '@/components/access-gate';
import { SidebarNavSkeleton } from '@/components/dashboard/skeletons/sidebar-nav-skeleton';
import { NavMain } from '@/components/dual-sidebar/nav-main';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { AccountDropdown } from '@/components/billing/account-dropdown';
import { LINKS } from '@/constants';
import { FileUser } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Home', url: LINKS.DASHBOARD, icon: HugeHomeIcon },
  { title: 'Bounties', url: LINKS.BOUNTIES, icon: BountiesIcon },
  { title: 'Bookmarks', url: LINKS.BOOKMARKS, icon: BookmarksIcon },
];

const FALLBACK_USER = {
  name: 'Guest',
  email: 'guest@example.com',
  image: null,
};

const WorkspaceSwitcher = () => {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name ?? 'grim';
  const initials = userName.charAt(0).toLowerCase();
  const workspaceLabel = userName.split(' ')[0] || 'grim';
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
      <AccountDropdown
        onUpgradeClick={() => {
          // Handle upgrade
        }}
        onOpenChange={setIsDropdownOpen}
        user={{
          name: userName,
          email: session?.user?.email ?? FALLBACK_USER.email,
          image: session?.user?.image ?? FALLBACK_USER.image,
        }}
      >
        <button
          className={cn(
            'group inline-flex items-center gap-[10px] rounded-[11px] px-[5px] py-[5px] text-left transition-colors group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]',
            isDropdownOpen
              ? 'bg-[#292828] hover:bg-[#2f2e2e]'
              : 'bg-transparent hover:bg-[#292828]'
          )}
          type="button"
        >
          <div className="relative flex h-[27px] w-[27px] items-center justify-center rounded-[6px] bg-[#E66700] text-base font-normal text-white shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)] outline outline-[#C95900] -outline-offset-1 group-data-[collapsible=icon]:size-5 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
            <span className="pb-1.5">{initials}</span>
          </div>
          <div className="flex items-center gap-[7px] group-data-[collapsible=icon]:hidden">
            <span className="text-[18px] font-semibold leading-[150%] text-[#F2F2F2]">
              {workspaceLabel}
            </span>
            <ArrowDownIcon className="h-4 w-4 text-[#929292] transition-colors group-hover:text-white" />
          </div>
        </button>
      </AccountDropdown>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-[#929292]" />
      </SidebarTrigger>
    </div>
  );
};

const SidebarFooterActions = () => {
  const router = useRouter();

  return (
    <div className="flex items-end justify-between gap-2 px-[15px] py-0">
      <button
        className="inline-flex items-center gap-2 rounded-[10px] bg-[#191919] px-3.5 py-1.5 text-[#929292] transition-colors hover:text-white group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]"
        onClick={() => router.push(LINKS.SETTINGS)}
        type="button"
      >
        <SettingsGearIcon className="h-[19px] w-[19px]" />
        <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em] group-data-[collapsible=icon]:hidden">
          Settings
        </span>
      </button>
      <NotificationsDropdown triggerClassName="flex h-auto w-auto items-center justify-center rounded-[10px] bg-[#191919] px-3.5 py-1.5 text-[#929292] transition-colors hover:text-white group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]">
        <NotificationsIcon className="h-[19px] w-[19px]" />
      </NotificationsDropdown>
    </div>
  );
};

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: pathname === item.url,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="flex h-full flex-col gap-[15px] px-0 group-data-[collapsible=icon]:px-[9px] py-4 md:py-0 lg:py-0">
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:px-[5px] group-data-[collapsible=icon]:py-[15px]">
          <SidebarTrigger
            aria-label="Toggle sidebar layout"
            className="flex size-[26px] items-center justify-center rounded-[10px] bg-[#191919] p-[3px] hover:bg-[#141414] hover:text-white"
          >
            <SidebarToggleIcon className="h-5 w-5 text-[#929292]" />
          </SidebarTrigger>
        </div>
        <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <AccessGate
            fallback={
              <NavMain
                items={[
                  {
                    title: 'Apply for Beta Testing',
                    url: LINKS.DASHBOARD,
                    icon: FileUser,
                  },
                ]}
              />
            }
            skeleton={<SidebarNavSkeleton />}
            stage="beta"
          >
            <NavMain items={navItems} />
          </AccessGate>
        </SidebarContent>
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0">
          <SidebarFooterActions />
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
};

export const AdminAppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path;
  }

  const adminNav = [
    {
      title: 'Overview',
      url: '/admin',
      icon: HugeHomeIcon,
      isActive: isActive('/admin'),
    },
    {
      title: 'Beta Applications',
      url: '/admin/beta-applications',
      icon: FileUser,
      isActive: isActive('/admin/beta-applications'),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="flex h-screen flex-col gap-[7px] px-0 py-[15px] group-data-[collapsible=icon]:px-0">
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-[15px]">
          <SidebarTrigger
            aria-label="Toggle sidebar layout"
            className="flex size-[26px] items-center justify-center rounded-[10px] bg-[#191919] p-[3px] hover:bg-[#141414] hover:text-white"
          >
            <SidebarToggleIcon className="h-5 w-5 text-[#929292]" />
          </SidebarTrigger>
        </div>
        <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <WorkspaceSwitcher />
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <NavMain items={adminNav} />
        </SidebarContent>
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0">
          <SidebarFooterActions />
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
};
