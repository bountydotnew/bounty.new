'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';
import { CommandMenu } from '@/components/command-menu';
import type { Bounty } from '@/types/dashboard';

interface HeaderProps {
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
}

export const Header = (_props: HeaderProps = {}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const pathname = usePathname();
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

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
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <header
        className={cn(
          'flex h-[72px] items-center justify-between bg-[#0E0E0E] border-b border-[#232323]',
          'px-4 sm:px-6'
        )}
      >
        {/* Left side - empty spacer */}
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger />}
        </div>

        {/* Center - Search bar */}
        <div className="flex h-7 flex-1 justify-center px-4">
          {/* Search Bar Trigger - hidden on mobile */}
          <button
            className="hidden sm:relative sm:flex w-[270px] h-9 items-center rounded-lg border cursor-pointer border-[#232323] bg-[#191919] py-[10px] pl-[10px] pr-[53px] text-left transition-colors hover:bg-[#141414]"
            onClick={() => setCommandMenuOpen(true)}
            type="button"
          >
            <span className="flex-1 bg-transparent text-[16px] font-medium leading-[150%] tracking-[-0.03em] text-[#5A5A5A] flex items-center">
              Search for anything...
            </span>
            <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
              <div className="flex h-[23px] w-[43px] items-center justify-center rounded-full bg-[#232323]">
                <span className="text-[16px] font-medium leading-[150%] text-[#5A5A5A]">
                  ⌘K
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Right side - Create Bounty button */}
        <div className="flex min-w-0 items-center">
          {/* Create Bounty Button - icon only on mobile */}
          <button
            className="flex items-center gap-[7px] rounded-lg bg-[#2A2A28] px-2 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#383838]"
            onClick={handleCreateBounty}
            type="button"
          >
            <Plus className="h-4 w-4 text-[#CFCFCF]" />
            <span className="hidden md:inline text-sm font-semibold leading-[150%] tracking-[0.01em] text-[#CFCFCF]">
              Create a bounty
            </span>
          </button>
        </div>
      </header>
      <CommandMenu onOpenChange={setCommandMenuOpen} open={commandMenuOpen} />
    </>
  );
};
