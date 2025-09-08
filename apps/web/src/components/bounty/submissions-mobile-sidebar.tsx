'use client';

import { PanelRightIcon } from 'lucide-react';
import { useState } from 'react';
import SubmissionCard from '@/components/bounty/submission-card';
import { Button } from '@bounty/ui/components/button';
import { Sheet, SheetContent, SheetTrigger } from '@bounty/ui/components/sheet';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { cn } from '@bounty/ui/lib/utils';

interface SubmissionsMobileSidebarProps {
  className?: string;
  inline?: boolean;
}

export function SubmissionsMobileSidebar({
  className,
  inline = false,
}: SubmissionsMobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  if (!isMobile) {
    return null;
  }

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        {inline ? (
          <button
            aria-label="Open submissions"
            className={cn(
              'flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/70 px-2.5 py-1.5 text-neutral-300 text-xs hover:bg-neutral-800/80',
              className
            )}
          >
            <span>Submissions</span>
            <PanelRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            aria-label="Open submissions"
            className={cn(
              'fixed right-4 bottom-20 z-40 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-neutral-300 text-xs backdrop-blur transition-colors hover:bg-neutral-800/90',
              className
            )}
          >
            <span>Submissions</span>
            <PanelRightIcon className="h-4 w-4" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        className="w-[320px] rounded-l-2xl border-none bg-[#151515] p-0 shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]"
        side="right"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-[#383838]/20 border-b p-4">
            <h2 className="font-medium text-lg text-white">Submissions</h2>
            <Button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              Add submission
            </Button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <SubmissionCard
              avatarSrc="/placeholder.svg?height=40&width=40"
              className="w-full"
              description="Here is my submission for the shadcn styling, in the ss you can se how the user can select the theme"
              hasBadge
              previewSrc="/placeholder.svg?height=80&width=80"
              rank="Rank 5"
              user="Fishy"
            />
            <SubmissionCard
              avatarSrc="/placeholder.svg?height=40&width=40"
              className="w-full"
              description="I one shotted this with v0"
              hasBadge
              previewSrc="/placeholder.svg?height=80&width=80"
              rank="Rank 2"
              user="Sergio"
            />
            <SubmissionCard
              avatarSrc="/placeholder.svg?height=40&width=40"
              className="w-full"
              description="There is my try"
              hasBadge={false}
              previewSrc="/placeholder.svg?height=80&width=80"
              rank="New user"
              user="Ahmet"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
