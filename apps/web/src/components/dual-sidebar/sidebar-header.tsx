'use client';

import { Plus } from 'lucide-react';
import { SidebarTrigger } from '@bounty/ui/components/sidebar';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { cn } from '@bounty/ui/lib/utils';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import { MobileSidebar } from '@/components/dual-sidebar/mobile-sidebar';
import type { Bounty } from '@/types/dashboard';

interface HeaderProps {
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
}

export const Header = ({
  myBounties,
  isMyBountiesLoading,
}: HeaderProps = {}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();

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
          {/* Search Bar */}
          <div className="relative flex items-center rounded-lg border border-[#232323] bg-[#191919] py-[5px] pl-[10px] pr-[53px]">
            <input
              className="h-[29px] flex-1 bg-transparent text-[16px] font-medium leading-[150%] tracking-[-0.03em] text-[#5A5A5A] placeholder:text-[#5A5A5A] outline-none"
              placeholder="Search for anything..."
              type="text"
            />
            {/* Keyboard Shortcut Badge */}
            <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
              <div className="flex h-[23px] w-[43px] items-center justify-center rounded-full bg-[#232323]">
                <span className="text-[16px] font-medium leading-[150%] text-[#5A5A5A]">
                  ⌘K
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Bounty Button */}
          <button
            className="flex items-center gap-[7px] rounded-[12px] border border-[#232323] bg-[#191919] py-[5px] px-[10px] transition-colors hover:bg-[#141414]"
            onClick={() => openCreateModal()}
            type="button"
          >
            <Plus className="h-4 w-4 text-[#CFCFCF]" />
            <span className="text-[16px] font-semibold leading-[150%] tracking-[0.01em] text-[#CFCFCF]">
              Create Bounty
            </span>
          </button>
          <MobileSidebar
            isMyBountiesLoading={isMyBountiesLoading}
            myBounties={myBounties}
          />
        </div>
      </header>
      <CreateBountyModal
        onOpenChange={closeCreateModal}
        open={createModalOpen}
      />
    </>
  );
};
