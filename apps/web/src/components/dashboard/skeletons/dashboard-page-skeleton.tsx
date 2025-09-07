'use client';

import { Skeleton } from '@bounty/ui/components/skeleton';

export const DashboardPageSkeleton = () => {
  return (
    <div className="bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      
      <div className="container mx-auto rounded-lg px-4 py-4">
        <div className="mb-4 flex items-center justify-end">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 rounded-lg py-4 lg:grid-cols-3">
          <div className="flex flex-col rounded-lg lg:col-span-2">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          
          <div className="hidden rounded-lg lg:col-span-1 lg:block">
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
