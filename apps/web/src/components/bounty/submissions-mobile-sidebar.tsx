"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelRightIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import SubmissionCard from "@/components/bounty/submission-card";

interface SubmissionsMobileSidebarProps {
  className?: string;
}

export function SubmissionsMobileSidebar({ className }: SubmissionsMobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)");

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-xs text-neutral-300 backdrop-blur transition-colors hover:bg-neutral-800/90",
            className,
          )}
          aria-label="Open submissions"
        >
          <PanelRightIcon className="h-4 w-4" />
          <span>Submissions</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[320px] bg-[#151515] border-none p-0 rounded-l-2xl shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-[#383838]/20">
            <h2 className="text-lg font-medium text-white">Submissions</h2>
            <Button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">Add submission</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <SubmissionCard
              user="Fishy"
              rank="Rank 5"
              description="Here is my submission for the shadcn styling, in the ss you can se how the user can select the theme"
              avatarSrc="/placeholder.svg?height=40&width=40"
              hasBadge
              previewSrc="/placeholder.svg?height=80&width=80"
              className="w-full"
            />
            <SubmissionCard
              user="Sergio"
              rank="Rank 2"
              description="I one shotted this with v0"
              avatarSrc="/placeholder.svg?height=40&width=40"
              hasBadge
              previewSrc="/placeholder.svg?height=80&width=80"
              className="w-full"
            />
            <SubmissionCard
              user="Ahmet"
              rank="New user"
              description="There is my try"
              avatarSrc="/placeholder.svg?height=40&width=40"
              hasBadge={false}
              previewSrc="/placeholder.svg?height=80&width=80"
              className="w-full"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
