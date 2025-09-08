'use client';

import { AccessGate } from '@/components/access-gate';
import { HeaderNavSkeleton } from '@/components/dashboard/skeletons/header-nav-skeleton';
import { MobileSidebar } from '@/components/dual-sidebar/mobile-sidebar';
import Link from '@bounty/ui/components/link';
import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { LINKS } from '@/constants';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';
import type { Bounty } from '@/types/dashboard';

type NavItem = { href: string; label: string };

interface HeaderProps {
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
}

const NavLinks = ({ items }: { items: readonly NavItem[] }) => (
  <ul className="flex items-center gap-6">
    {items.map(({ href, label }) => (
      <li key={href}>
        <Link
          className={cn(
            'font-medium text-sm transition-colors hover:text-primary',
            'text-muted-foreground hover:text-foreground'
          )}
          href={href}
        >
          {label}
        </Link>
      </li>
    ))}
  </ul>
);

const betaNavigationLinks = [
  { href: LINKS.DASHBOARD, label: 'Dashboard' },
  { href: LINKS.BOUNTIES, label: 'Bounties' },
];

const productionNavigationLinks = [
  { href: LINKS.DASHBOARD, label: 'Apply for Beta Testing' },
];

export const Header = ({
  myBounties,
  isMyBountiesLoading,
}: HeaderProps = {}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'px-4 sm:px-6'
      )}
    >
      <div className="flex items-center gap-6">
        {isMobile && <SidebarTrigger />}
        <nav className="flex items-center">
          <AccessGate
            fallback={<NavLinks items={productionNavigationLinks} />}
            skeleton={<HeaderNavSkeleton />}
            stage="beta"
          >
            <NavLinks items={betaNavigationLinks} />
          </AccessGate>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <MobileSidebar
          isMyBountiesLoading={isMyBountiesLoading}
          myBounties={myBounties}
        />
      </div>
    </header>
  );
};
