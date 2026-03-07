import { BountySkeleton } from '@/components/dashboard/skeletons/bounty-skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
      <div className="h-px w-full shrink-0 bg-surface-3" />

      {/* Task input skeleton */}
      <div className="flex w-full shrink-0 flex-col px-4 lg:max-w-[805px] xl:px-0 mx-auto min-w-0 max-w-full">
        <div className="w-full flex flex-col mt-3 mb-3 md:mt-10 md:mb-6 min-w-0">
          <div className="animate-pulse">
            <div className="h-[100px] w-full rounded-lg bg-surface-3/30" />
            <div className="flex gap-2 mt-3">
              <div className="h-8 w-20 rounded-md bg-surface-3/20" />
              <div className="h-8 w-20 rounded-md bg-surface-3/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-surface-3" />

      {/* Bounty list skeleton */}
      <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0 max-w-full">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
            <BountySkeleton count={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
