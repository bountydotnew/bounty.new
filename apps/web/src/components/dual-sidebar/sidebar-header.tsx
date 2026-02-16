'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';
import { Button } from '@bounty/ui/components/button';
import { CommandMenu } from '@/components/command-menu';
import type { Bounty } from '@/types/dashboard';
import { Button } from "@bounty/ui"

interface HeaderProps {
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
}

export const Header = (_props: HeaderProps = {}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const pathname = usePathname();
  //const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  const handleCreateBounty = () => {
    const isOnDashboard = pathname === '/dashboard';
    if (isOnDashboard) {
      // Already on dashboard - scroll to top and focus textarea
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Use hash to trigger focus in dashboard component
      window.location.hash = '#focus-textarea';
      // Small delay to ensure scroll completes before focusing
      setTimeout(() => {
        const event = new CustomEvent('focus-textarea');
        window.dispatchEvent(event);
      }, 300);
    } else {
      // Navigate to dashboard with hash
      router.push('/dashboard#focus-textarea');
    }
  };

  // Toggle the menu when ⌘K is pressed
  // useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault();
  //       setCommandMenuOpen((open) => !open);
  //     }
  //   };

  //   document.addEventListener('keydown', down);
  //   return () => document.removeEventListener('keydown', down);
  // }, []);

  return (
    <>
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

        {/* Center - Search bar */}
        {/* <div className="flex h-7 flex-1 justify-center px-4">
          <button
            className="hidden sm:relative sm:flex w-[270px] h-9 items-center rounded-lg border cursor-pointer border-border-subtle bg-surface-1 py-[10px] pl-[10px] pr-[53px] text-left transition-colors hover:bg-surface-2"
            onClick={() => setCommandMenuOpen(true)}
            type="button"
          >
            <span className="flex-1 bg-transparent text-[16px] font-medium leading-[150%] tracking-[-0.03em] text-text-tertiary flex items-center">
              Search for anything...
            </span>
            <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
              <div className="flex h-[23px] w-[43px] items-center justify-center rounded-full bg-surface-3">
                <span className="text-[16px] font-medium leading-[150%] text-text-tertiary">
                  ⌘K
                </span>
              </div>
            </div>
          </button>
        </div> */}

        {/* Right side - Create Bounty button */}
        <div className="flex min-w-0 items-center">
          {/* Create Bounty Button - icon only on mobile */}
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
      {/* <CommandMenu onOpenChange={setCommandMenuOpen} open={commandMenuOpen} /> */}
    </>
  );
};
