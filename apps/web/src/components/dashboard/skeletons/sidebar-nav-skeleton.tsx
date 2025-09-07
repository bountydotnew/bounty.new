'use client';

import { Skeleton } from '@bounty/ui/components/skeleton';

export const SidebarNavSkeleton = () => {
  return (
    <div className="space-y-2 p-2">
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
};
