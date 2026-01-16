'use client';

import type * as React from 'react';
import {
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
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@bounty/ui/components/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { LINKS } from '@/constants';
import { BellIcon, UserIcon, DollarBillIcon, SecurityIcon, CardIcon, SettingsGearIcon } from '@bounty/ui';
import { ArrowLeftIcon } from 'lucide-react';

const NAV_ITEMS = [
  { title: 'Profile', url: '/settings/profile', icon: UserIcon },
  { title: 'Billing', url: '/settings/billing', icon: CardIcon },
  { title: 'Payments', url: '/settings/payments', icon: DollarBillIcon },
  { title: 'Integrations', url: '/settings/integrations', icon: SettingsGearIcon },
  { title: 'Security', url: '/settings/security', icon: SecurityIcon },
  { title: 'Notifications', url: '/settings/notifications', icon: BellIcon, disabled: true },
];

const BackButton = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        onClick={() => router.push(LINKS.DASHBOARD)}
        className={cn(
          'w-fit text-sm font-medium',
          'inline-flex items-center justify-center gap-0.5 whitespace-nowrap',
          'relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          'text-[#929292] hover:text-white transition-colors',
          'bg-transparent hover:bg-[#292828]',
          'h-[28px] px-[6px] py-[4px] rounded-lg'
        )}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="ml-0.5">Back</span>
      </button>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-[#929292]" />
      </SidebarTrigger>
    </div>
  );
};

const renderNavItems = (
  items: typeof NAV_ITEMS,
  pathname: string
) => {
  return (
    <SidebarMenu className="flex flex-col gap-[8px] w-full">
      {items.map((item) => {
        const isActive = pathname === item.url;
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            {item.disabled ? (
              <SidebarMenuButton
                disabled
                isActive={isActive}
                tooltip={item.title}
              >
                {IconComponent && <IconComponent className="h-5 w-5" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
              >
                <Link href={item.url}>
                  {IconComponent && <IconComponent className="h-5 w-5" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

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
          <SidebarGroup>
            {renderNavItems(NAV_ITEMS, pathname || '')}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0" />
      </div>
      <SidebarRail />
    </Sidebar>
  );
};

