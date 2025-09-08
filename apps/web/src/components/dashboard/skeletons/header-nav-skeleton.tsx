'use client';

import { Skeleton } from '@bounty/ui/components/skeleton';

export const HeaderNavSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  );
};
