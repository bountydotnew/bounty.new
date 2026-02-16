'use client';

import type * as React from 'react';
import { cn } from '@bounty/ui/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { LinearIcon, LinearIssuesIcon, LinearProjectsIcon } from '@bounty/ui';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgSlug } from '@/context/org-slug-context';

/**
 * Linear integration sidebar navigation.
 * Uses a plain <nav> element (like OrgSettingsSidebar) instead of the
 * SidebarProvider/Sidebar/SidebarInset pattern to avoid creating a
 * nested sidebar context inside the main app's SidebarProvider.
 */

function LinearNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { linearWorkspace } = useIntegrations();
  const orgSlug = useOrgSlug();
  const prefix = `/${orgSlug}`;

  const integrationsPath = `${prefix}/integrations`;
  const workspaceId = linearWorkspace?.id;
  const baseUrl = workspaceId
    ? `${prefix}/integrations/linear/${workspaceId}`
    : `${prefix}/integrations/linear`;

  const navItems = [
    {
      title: 'Overview',
      url: baseUrl,
      icon: HomeIcon,
    },
    {
      title: 'Issues',
      url: `${baseUrl}/issues`,
      icon: LinearIssuesIcon,
    },
    {
      title: 'Projects',
      url: `${baseUrl}/projects`,
      icon: LinearProjectsIcon,
    },
  ];

  return (
    <nav className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-border-subtle py-4 px-3 gap-1">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push(integrationsPath)}
        className={cn(
          'w-fit text-sm font-medium mb-3',
          'inline-flex items-center justify-center gap-0.5 whitespace-nowrap',
          'text-text-tertiary hover:text-foreground transition-colors',
          'bg-transparent hover:bg-surface-2',
          'h-[28px] px-[6px] py-[4px] rounded-lg'
        )}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span className="ml-0.5">Back</span>
      </button>

      {/* Linear branding */}
      <div className="flex items-center gap-3 mb-4 px-[2px]">
        <div className="size-8 rounded-lg bg-surface-2 flex items-center justify-center">
          <LinearIcon className="size-5 text-text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Linear</h1>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-surface-2 text-foreground'
                  : 'text-text-secondary hover:text-foreground hover:bg-surface-hover'
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile tab bar for Linear navigation.
 * Visible only on smaller screens (< lg breakpoint).
 */
function LinearTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { linearWorkspace } = useIntegrations();
  const orgSlug = useOrgSlug();
  const prefix = `/${orgSlug}`;

  const integrationsPath = `${prefix}/integrations`;
  const workspaceId = linearWorkspace?.id;
  const baseUrl = workspaceId
    ? `${prefix}/integrations/linear/${workspaceId}`
    : `${prefix}/integrations/linear`;

  const navItems = [
    { title: 'Overview', url: baseUrl, icon: HomeIcon },
    { title: 'Issues', url: `${baseUrl}/issues`, icon: LinearIssuesIcon },
    { title: 'Projects', url: `${baseUrl}/projects`, icon: LinearProjectsIcon },
  ];

  return (
    <nav className="flex border-b border-border-subtle px-4 gap-4 overflow-x-auto items-center">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push(integrationsPath)}
        className="flex items-center gap-0.5 py-3 text-sm font-medium text-text-tertiary hover:text-foreground transition-colors whitespace-nowrap"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
      </button>

      <div className="h-4 w-px bg-border-subtle shrink-0" />

      {navItems.map((item) => {
        const isActive = pathname === item.url;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.title}
            href={item.url}
            className={cn(
              'flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              isActive
                ? 'border-foreground text-foreground'
                : 'border-transparent text-text-secondary hover:text-foreground'
            )}
          >
            <IconComponent className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { LinearNav, LinearTabBar };
