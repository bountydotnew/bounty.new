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
  BellIcon,
  FileIcon,
  DiscordIcon,
} from '@bounty/ui';
import { cn } from '@bounty/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@bounty/ui/components/sidebar';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { useSession } from '@/context/session-context';
import { usePathname, useRouter } from 'next/navigation';
import { NavMain } from '@/components/dual-sidebar/nav-main';
import { RecentBountiesGroup } from '@/components/dual-sidebar/recent-bounties';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { AccountDropdown } from '@/components/billing/account-dropdown';
import { FundBountyModal } from '@/components/payment/fund-bounty-modal';
import { LINKS } from '@/constants';
import { Clock, UsersIcon } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Home', url: LINKS.DASHBOARD, icon: HugeHomeIcon },
  { title: 'Bounties', url: LINKS.BOUNTIES, icon: BountiesIcon },
  { title: 'Bookmarks', url: LINKS.BOOKMARKS, icon: BookmarksIcon },
  { title: 'Integrations', url: '/integrations', icon: SettingsGearIcon },
];

const FALLBACK_USER = {
  name: 'Guest',
  email: 'guest@example.com',
  image: null,
};

const WorkspaceSwitcher = () => {
  const { session } = useSession();
  const userName = session?.user?.name ?? 'grim';
  const userImage = session?.user?.image ?? null;
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
              ? 'bg-surface-2 hover:bg-surface-hover'
              : 'bg-transparent hover:bg-surface-2'
          )}
          type="button"
        >
          <Avatar className="h-[27px] w-[27px] rounded-[6px] border-2 border-brand-primary shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)] group-data-[collapsible=icon]:size-5 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
            {userImage && (
              <AvatarImage
                alt={userName}
                src={userImage}
                className="rounded-[6px]"
              />
            )}
            <AvatarFacehash
              name={userName}
              size={27}
              className="rounded-[6px]"
            />
          </Avatar>
          <div className="flex items-center gap-[7px] group-data-[collapsible=icon]:hidden">
            <span className="text-[18px] font-semibold leading-[150%] text-foreground">
              {workspaceLabel}
            </span>
            <ArrowDownIcon className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-foreground" />
          </div>
        </button>
      </AccountDropdown>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
      </SidebarTrigger>
    </div>
  );
};

const SidebarFooterActions = () => {
  const { session, isPending } = useSession();
  const isAuthenticated = !!session?.user;
  const [showFundModal, setShowFundModal] = React.useState(false);

  return (
    <>
      <div className="flex items-end justify-between gap-2 py-0">
        {/* Links column: Docs, Discord */}
        <div className="flex flex-col gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-[10px] bg-surface-1 px-3.5 py-1.5 text-text-tertiary transition-colors hover:text-foreground group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]"
            onClick={() => window.open('https://docs.bounty.new', '_blank')}
            type="button"
          >
            <FileIcon className="h-[19px] w-[19px]" />
            <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em] group-data-[collapsible=icon]:hidden">
              Docs
            </span>
          </button>
          <div className="flex items-center gap-0">
            <button
              className="inline-flex items-center gap-2 rounded-[10px] bg-surface-1 px-3.5 py-1.5 text-text-tertiary transition-colors hover:text-foreground group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]"
              onClick={() =>
                window.open('https://discord.gg/bountynew', '_blank')
              }
              type="button"
            >
              <DiscordIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em] group-data-[collapsible=icon]:hidden">
                Discord
              </span>
            </button>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 animate-pulse" />
            </span>
          </div>
        </div>
        {/* Notifications toggle */}
        {isAuthenticated && !isPending && (
          <NotificationsDropdown triggerClassName="flex h-auto w-auto items-center justify-center rounded-[10px] bg-surface-1 px-3.5 py-1.5 text-text-tertiary transition-colors hover:text-foreground group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]">
            <NotificationsIcon className="h-[19px] w-[19px]" />
          </NotificationsDropdown>
        )}
      </div>
      <FundBountyModal
        open={showFundModal}
        onOpenChange={setShowFundModal}
        onSkip={() => {
          console.log('Skipped payment');
          setShowFundModal(false);
        }}
        onPayWithStripe={() => {
          console.log('Pay with Stripe');
          setShowFundModal(false);
        }}
        onPayWithBalance={() => {
          console.log('Pay with balance');
          setShowFundModal(false);
        }}
      />
    </>
  );
};

const UnauthenticatedWorkspaceSwitcher = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
      <button
        className="group inline-flex items-center gap-[10px] rounded-[11px] px-[5px] py-[5px] text-left transition-colors bg-transparent hover:bg-surface-2 group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]"
        onClick={() => router.push('/login')}
        type="button"
      >
        <Avatar className="h-[27px] w-[27px] rounded-[6px] border-2 border-border-subtle shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)] group-data-[collapsible=icon]:size-5 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
          <AvatarFacehash name="guest" size={27} className="rounded-[6px]" />
        </Avatar>
        <div className="flex items-center gap-[7px] group-data-[collapsible=icon]:hidden">
          <span className="text-[18px] font-semibold leading-[150%] text-text-tertiary">
            Sign in
          </span>
          <ArrowDownIcon className="h-4 w-4 text-text-tertiary transition-colors group-hover:text-foreground" />
        </div>
      </button>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
      </SidebarTrigger>
    </div>
  );
};

const UnauthenticatedNavItems = () => {
  const router = useRouter();

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: false, // Never active when unauthenticated
  }));

  return (
    <SidebarGroup>
      <SidebarMenu className="flex flex-col gap-[8px] w-full">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              className="cursor-not-allowed opacity-50"
              disabled
              asChild={false}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <div className="mt-4 rounded-[10px] bg-surface-1 p-4 group-data-[collapsible=icon]:hidden">
        <p className="mb-3 text-[13px] font-medium leading-[150%] text-text-tertiary">
          Sign in to access your dashboard, bounties, and more
        </p>
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-[14px] font-semibold leading-[150%] text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={() => router.push('/login')}
          type="button"
        >
          Sign In
        </button>
      </div>
    </SidebarGroup>
  );
};

const UnauthenticatedFooterActions = () => {
  return (
    <div className="flex items-end justify-between gap-2 py-0">
      <button
        className="inline-flex items-center gap-2 rounded-[10px] bg-surface-1 px-3.5 py-1.5 text-text-tertiary opacity-50 transition-colors group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]"
        disabled
        type="button"
      >
        <SettingsGearIcon className="h-[19px] w-[19px]" />
        <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em] group-data-[collapsible=icon]:hidden">
          Settings
        </span>
      </button>
    </div>
  );
};

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();
  const { session, isPending } = useSession();
  const isAuthenticated = !!session?.user;

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
            className="flex size-[26px] items-center justify-center rounded-[10px] bg-surface-1 p-[3px] hover:bg-surface-2 hover:text-foreground"
          >
            <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
          </SidebarTrigger>
        </div>
        {isAuthenticated && !isPending ? (
          <>
            <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
              <WorkspaceSwitcher />
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
              <NavMain items={navItems} />
              <RecentBountiesGroup />
            </SidebarContent>
            <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0">
              <SidebarFooterActions />
            </SidebarFooter>
          </>
        ) : (
          !isPending && (
            <>
              <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
                <UnauthenticatedWorkspaceSwitcher />
              </SidebarHeader>
              <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
                <UnauthenticatedNavItems />
              </SidebarContent>
              <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0">
                <UnauthenticatedFooterActions />
              </SidebarFooter>
            </>
          )
        )}
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
      title: 'Users',
      url: '/admin/users',
      icon: UsersIcon,
      isActive: isActive('/admin/users'),
    },
    {
      title: 'Waitlist',
      url: '/admin/waitlist',
      icon: Clock,
      isActive: isActive('/admin/waitlist'),
    },
    {
      title: 'Notifications',
      url: '/admin/notifications',
      icon: BellIcon,
      isActive: isActive('/admin/notifications'),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="flex h-screen flex-col gap-[7px] px-0 py-[15px] group-data-[collapsible=icon]:px-0">
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-[15px]">
          <SidebarTrigger
            aria-label="Toggle sidebar layout"
            className="flex size-[26px] items-center justify-center rounded-[10px] bg-surface-1 p-[3px] hover:bg-surface-2 hover:text-foreground"
          >
            <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
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
