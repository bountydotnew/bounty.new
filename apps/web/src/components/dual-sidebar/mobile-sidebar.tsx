"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PanelRightIcon, X } from "lucide-react";
import { ActivitySidebar } from "@/components/dashboard/activity-sidebar";
import { MyBountiesSidebar } from "@/components/dashboard/my-bounties-sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Bounty } from "@/types/dashboard";

interface MobileSidebarProps {
  className?: string;
  myBounties?: Bounty[];
  isMyBountiesLoading?: boolean;
}

export function MobileSidebar({ 
  className, 
  myBounties, 
  isMyBountiesLoading = false 
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  if (!isMobile) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="text"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 text-white hover:bg-[#383838] hover:text-white",
            className
          )}
        >
          <PanelRightIcon className="h-4 w-4" />
          <span className="sr-only">Open activity sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[320px] bg-[#151515] border-none p-0 rounded-l-2xl shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#383838]/20">
            <h2 className="text-lg font-medium text-white">Activity & Bounties</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-4">
              <ActivitySidebar />
            </div>
            
            <div className="space-y-4">
              <MyBountiesSidebar 
                myBounties={myBounties}
                isLoading={isMyBountiesLoading}
                onBountyClick={(bounty) => {
                  console.log("Bounty clicked:", bounty);
                  setIsOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
