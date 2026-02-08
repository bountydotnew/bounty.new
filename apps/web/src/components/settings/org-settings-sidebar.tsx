'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { CardIcon } from '@bounty/ui';
import { Users } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';

const ORG_SETTINGS_ITEMS = [
  { title: 'Billing', path: '/settings/billing', icon: CardIcon },
  { title: 'Members', path: '/settings/members', icon: Users },
];

/**
 * Desktop sidebar for org settings.
 * Hidden on mobile — use OrgSettingsTabBar instead.
 */
export function OrgSettingsSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  return (
    <nav className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-border-subtle py-4 px-3 gap-1">
      <div className="px-2 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
        Team Settings
      </div>
      {ORG_SETTINGS_ITEMS.map((item) => {
        const href = `/${slug}${item.path}`;
        const isActive = pathname === href;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.path}
            href={href}
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
    </nav>
  );
}

/**
 * Mobile tab bar for org settings.
 * Visible only on smaller screens (< lg breakpoint).
 */
export function OrgSettingsTabBar() {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  return (
    <nav className="flex border-b border-border-subtle px-4 gap-4 overflow-x-auto">
      {ORG_SETTINGS_ITEMS.map((item) => {
        const href = `/${slug}${item.path}`;
        const isActive = pathname === href;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.path}
            href={href}
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
