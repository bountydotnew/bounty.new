'use client';

import { Bell, CreditCard, DollarSign, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@bounty/ui/lib/utils';

interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  comingSoon?: boolean;
}

const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'general',
    label: 'Profile',
    href: '/settings',
    icon: User,
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/settings/payments',
    icon: DollarSign,
  },
  {
    id: 'security',
    label: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    disabled: true,
    comingSoon: true,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-background">
      {/* Back Button */}
      <div className="border-border border-b p-4">
        <Link
          className="inline-flex h-[28px] w-fit items-center justify-center gap-0.5 whitespace-nowrap rounded-lg bg-interactive-state px-[6px] py-[4px] text-foreground text-sm font-medium transition-colors hover:bg-interactive-state-hover focus:shadow-focus-ring-blue focus:outline-none active:bg-interactive-state-pressed disabled:bg-interactive-state-disabled disabled:text-foreground-muted [&_span:first-child]:pl-[3px] [&_span:last-child]:pr-[3px] [&_svg]:box-border [&_svg]:h-[var(--icon-frame)] [&_svg]:w-[var(--icon-frame)] [&_svg]:shrink-0 [&_svg]:p-[var(--icon-pad)] [&_svg]:align-middle [&_svg]:text-icon [&_svg]:pointer-events-none [--icon-frame:20px] [--icon-pad:2px]"
          href="/dashboard"
        >
          <svg
            className=""
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.66667 3.83334L2.5 7.99999L6.66667 12.1667M3 7.99999H13.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <span className="ml-0.5">Back</span>
        </Link>
      </div>

      {/* Account Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 px-2 font-semibold text-foreground text-xs uppercase tracking-wider">
              Account
            </h3>
            <nav className="space-y-1">
              {SETTINGS_NAV.slice(0, 1).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      item.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    href={item.disabled ? '#' : item.href}
                    key={item.id}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.comingSoon && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Administration Section */}
          <div>
            <h3 className="mb-2 px-2 font-semibold text-foreground text-xs uppercase tracking-wider">
              Administration
            </h3>
            <nav className="space-y-1">
              {SETTINGS_NAV.slice(1, 4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      item.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    href={item.disabled ? '#' : item.href}
                    key={item.id}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.comingSoon && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Other Section */}
          <div>
            <h3 className="mb-2 px-2 font-semibold text-foreground text-xs uppercase tracking-wider">
              Other
            </h3>
            <nav className="space-y-1">
              {SETTINGS_NAV.slice(4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      item.disabled && 'cursor-not-allowed opacity-50'
                    )}
                    href={item.disabled ? '#' : item.href}
                    key={item.id}
                    onClick={(e) => item.disabled && e.preventDefault()}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.comingSoon && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
