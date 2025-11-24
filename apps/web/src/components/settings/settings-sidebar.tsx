'use client';

import type * as React from 'react';
import {
  Bell,
  CreditCard,
  DollarSign,
  Shield,
  User,
} from 'lucide-react';
import { SidebarToggleIcon } from '@bounty/ui';
import { usePathname } from 'next/navigation';
import { cn } from '@bounty/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@bounty/ui/components/sidebar';
import { NavMain } from '@/components/dual-sidebar/nav-main';
import { LINKS } from '@/constants';

interface SettingsNavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    title: 'Profile',
    url: '/settings/profile',
    icon: User,
  },
  {
    title: 'Billing',
    url: '/settings/billing',
    icon: CreditCard,
  },
  {
    title: 'Payments',
    url: '/settings/payments',
    icon: DollarSign,
  },
  {
    title: 'Security',
    url: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    url: '/settings/notifications',
    icon: Bell,
    disabled: true,
  },
];

const BackButton = () => {
  return (
    <div className="flex items-center justify-between py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
      <a
        href={LINKS.DASHBOARD}
        className={cn(
          'w-fit text-sm font-medium [&_span:last-child]:pr-[3px] [&_span:first-child]:pl-[3px]',
          'inline-flex items-center justify-center gap-0.5 whitespace-nowrap',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:align-middle [&_svg]:box-border',
          '[&_svg]:w-[var(--icon-frame)] [&_svg]:h-[var(--icon-frame)] [&_svg]:p-[var(--icon-pad)]',
          'relative focus:outline-none focus-visible:shadow-focus-ring-blue disabled:shadow-none',
          'disabled:text-foreground-muted [&_svg]:disabled:text-foreground-muted',
          'text-foreground [&_svg]:text-icon',
          'bg-interactive-state hover:bg-interactive-state-hover active:bg-interactive-state-pressed',
          'data-[state=open]:bg-interactive-state-active disabled:bg-interactive-state-disabled',
          'h-[28px] px-[6px] py-[4px] rounded-lg',
          '[--icon-frame:20px] [--icon-pad:2px]'
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <title>Back arrow</title>
          <path
            d="M6.66667 3.83334L2.5 7.99999L6.66667 12.1667M3 7.99999H13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="ml-0.5">Back</span>
      </a>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-[#929292]" />
      </SidebarTrigger>
    </div>
  );
};

export const SettingsSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  const navItems = SETTINGS_NAV_ITEMS.map((item) => ({
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
          <BackButton />
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <NavMain items={navItems} />
        </SidebarContent>
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0" />
      </div>
      <SidebarRail />
    </Sidebar>
  );
};

