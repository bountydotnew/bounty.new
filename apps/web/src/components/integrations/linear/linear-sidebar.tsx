'use client';

import type * as React from 'react';
import { cn } from '@bounty/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@bounty/ui/components/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { LinearIcon, LinearIssuesIcon, LinearProjectsIcon } from '@bounty/ui';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgSlug } from '@/context/org-slug-context';

const BackButton = () => {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const integrationsPath = orgSlug
    ? `/${orgSlug}/integrations`
    : '/integrations';

  return (
    <button
      type="button"
      onClick={() => router.push(integrationsPath)}
      className={cn(
        'w-fit text-sm font-medium',
        'inline-flex items-center justify-center gap-0.5 whitespace-nowrap',
        'relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        'text-text-tertiary hover:text-foreground transition-colors',
        'bg-transparent hover:bg-surface-2',
        'h-[28px] px-[6px] py-[4px] rounded-lg'
      )}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span className="ml-0.5">Back</span>
    </button>
  );
};

const LinearAppSidebar = () => {
  const pathname = usePathname();
  const { linearWorkspace } = useIntegrations();
  const orgSlug = useOrgSlug();
  const prefix = orgSlug ? `/${orgSlug}` : '';

  const workspaceId = linearWorkspace?.id;
  const baseUrl = workspaceId
    ? `${prefix}/integrations/linear/${workspaceId}`
    : `${prefix}/integrations/linear`;

  const navItems = [
    {
      title: 'Overview',
      url: baseUrl,
      icon: () => <HomeIcon className="size-5" />,
    },
    {
      title: 'Issues',
      url: `${baseUrl}/issues`,
      icon: () => <LinearIssuesIcon className="size-5" />,
    },
    {
      title: 'Projects',
      url: `${baseUrl}/projects`,
      icon: () => <LinearProjectsIcon className="size-5" />,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <div className="flex h-full flex-col gap-[15px] px-0 group-data-[collapsible=icon]:px-[9px] py-4 md:py-0 lg:py-0">
        <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <BackButton />
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-3 mb-6 px-[2px]">
            <div className="size-8 rounded-lg bg-surface-2 flex items-center justify-center">
              <LinearIcon className="size-5 text-text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Linear</h1>
          </div>
          <SidebarGroup>
            <SidebarMenu className="flex flex-col gap-[8px] w-full">
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        {IconComponent && <IconComponent />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0" />
      </div>
      <SidebarRail />
    </Sidebar>
  );
};

export const LinearSidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider variant="sidebar">
      <LinearAppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-dashboard-bg">
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
