'use client';

import NumberFlow from '@bounty/ui/components/number-flow';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export function WaitlistCount() {
  const { data: waitlistData } = useQuery(
    trpc.earlyAccess.getWaitlistCount.queryOptions()
  );

  const count = waitlistData?.count || 0;

  return (
    <span className="font-display-book font-medium text-green-400">
      <NumberFlow value={count} />+ people are already on the waitlist
    </span>
  );
}
