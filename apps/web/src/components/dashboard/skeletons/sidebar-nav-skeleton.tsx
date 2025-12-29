'use client';

import { Skeleton } from '@bounty/ui/components/skeleton';

export const SidebarNavSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-auto w-full rounded-[10px] bg-sidebar-bg px-3 py-1.5" />
      <Skeleton className="h-auto w-full rounded-[10px] bg-sidebar-bg px-3 py-1.5" />
      <Skeleton className="h-auto w-full rounded-[10px] bg-sidebar-bg px-3 py-1.5" />
    </div>
  );
};
