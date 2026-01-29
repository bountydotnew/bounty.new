'use client';

import { Button } from '@bounty/ui/components/button';
import { Sheet, SheetContent, SheetTrigger } from '@bounty/ui/components/sheet';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';
import { PanelRightIcon } from 'lucide-react';
import { useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import type { Bounty } from '@/types/dashboard';

interface MobileSidebarProps {
  className?: string;
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
  trigger?: React.ReactNode;
}

export function MobileSidebar({
  className,
  myBounties,
  isMyBountiesLoading = false,
  trigger,
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  if (!isMobile) {
    return null;
  }

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            className={cn(
              'h-8 w-8 p-0 text-white hover:bg-[#383838] hover:text-white',
              className
            )}
            size="sm"
            variant="text"
          >
            <PanelRightIcon className="h-4 w-4" />
            <span className="sr-only">Open activity sidebar</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        className="w-[320px] rounded-l-2xl border-none bg-[#151515] p-0 shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)] pt-4"
        side="right"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-[#383838]/20 border-b p-4">
            <h2 className="font-medium text-lg text-white">
              Activity & Bounties
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <DashboardSidebar
              isLoadingMyBounties={isMyBountiesLoading}
              myBounties={myBounties}
              onBountyClick={(_bounty: Bounty) => {
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
