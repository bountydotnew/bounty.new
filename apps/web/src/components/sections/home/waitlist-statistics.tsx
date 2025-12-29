'use client';

import { cn } from '@bounty/ui/lib/utils';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export function WaitlistStatistics({ className }: { className?: string }) {
  const { data: waitlistData, isLoading, isError } = useQuery(
    trpc.earlyAccess.getWaitlistCount.queryOptions()
  );

  let waitlistStatus: React.ReactNode;
  if (isError) {
    waitlistStatus = (
      <span className="font-display-book font-medium text-orange-400">
        Unable to load waitlist count
      </span>
    );
  } else if (isLoading) {
    waitlistStatus = (
      <span className="font-display-book font-medium text-gray-400">
        Loading waitlist count...
      </span>
    );
  } else {
    waitlistStatus = (
      <span className="font-display-book font-medium text-green-400">
        <NumberFlow value={waitlistData?.count || 0} />+ people already joined
      </span>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {waitlistStatus}
    </div>
  );
}
