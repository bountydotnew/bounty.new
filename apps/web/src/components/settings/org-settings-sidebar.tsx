'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from '@bounty/ui/components/link';
import { CardIcon, BellIcon } from '@bounty/ui';
import { Users } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';

const ORG_SETTINGS_ITEMS = [
  { title: 'Billing', path: '/settings/billing', icon: CardIcon },
  { title: 'Members', path: '/settings/members', icon: Users },
];

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
