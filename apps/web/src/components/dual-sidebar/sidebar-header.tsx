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
        <div className="flex flex-1 items-center justify-center gap-6">
          {isMobile && <SidebarTrigger />}
          {/* Search Bar Trigger */}
          <button
            className="relative flex w-[270px] items-center rounded-lg border cursor-pointer border-[#232323] bg-[#191919] py-[5px] pl-[10px] pr-[53px] text-left transition-colors hover:bg-[#141414]"
            onClick={() => setCommandMenuOpen(true)}
            type="button"
          >
            <span className="flex-1 bg-transparent text-[16px] font-medium leading-[150%] tracking-[-0.03em] text-[#5A5A5A] flex items-center">
              Search for anything...
            </span>
            {/* Keyboard Shortcut Badge */}
            <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
              <div className="flex h-[23px] w-[43px] items-center justify-center rounded-full bg-[#232323]">
                <span className="text-[16px] font-medium leading-[150%] text-[#5A5A5A]">
                  ⌘K
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Bounty Button */}
          <button
            className="hidden md:flex lg:flex items-center gap-[7px] rounded-[12px] border border-[#232323] bg-[#191919] py-[5px] px-[10px] transition-colors hover:bg-[#141414]"
            onClick={handleCreateBounty}
            type="button"
          >
            <Plus className="h-4 w-4 text-[#CFCFCF]" />
            <span className="text-[16px] font-semibold leading-[150%] tracking-[0.01em] text-[#CFCFCF]">
              Create Bounty
            </span>
          </button>
        </div>
      </header>
      <CommandMenu onOpenChange={setCommandMenuOpen} open={commandMenuOpen} />
    </>
  );
};
