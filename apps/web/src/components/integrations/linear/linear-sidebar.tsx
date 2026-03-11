'use client';

import type * as React from 'react';
import { cn } from '@bounty/ui/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { LinearIssuesIcon, LinearProjectsIcon } from '@bounty/ui';
import { ArrowLeftIcon, HomeIcon } from 'lucide-react';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgSlug } from '@/context/org-slug-context';

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

export { LinearTabBar };
