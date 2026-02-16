'use client';

import { Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';
import { Button } from '@bounty/ui/components/button';

export const Header = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const pathname = usePathname();

  const handleCreateBounty = () => {
    const isOnDashboard = pathname === '/dashboard';
    if (isOnDashboard) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.hash = '#focus-textarea';
      setTimeout(() => {
        const event = new CustomEvent('focus-textarea');
        window.dispatchEvent(event);
      }, 300);
    } else {
      router.push('/dashboard#focus-textarea');
    }
  };

  return (
    <header
      className={cn(
        'flex h-[72px] items-center justify-between bg-background border-b border-border-subtle',
        'px-4 sm:px-6'
      )}
    >
      {/* Left side - empty spacer */}
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
      </div>

      {/* Right side - Create Bounty button */}
      <div className="flex min-w-0 items-center">
        <Button
          className="flex items-center gap-[7px] rounded-lg bg-surface-hover px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-3"
          onClick={handleCreateBounty}
          variant="outline"
          type="button"
          aria-label="Create new bounty"
        >
          <Plus className="h-4 w-4 text-text-secondary md:hidden" />
          <span className="hidden md:inline text-sm font-semibold leading-[150%] tracking-[0.01em] text-text-secondary">
            New bounty
          </span>
        </Button>
      </div>
    </header>
  );
};
