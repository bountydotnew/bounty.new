import { cn } from '@bounty/ui/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { BountyStatistic } from './bounty-statistic';

export function BountyStatistics({ className }: { className?: string }) {
  const { data: stats } = useQuery(trpc.bounties.getBountyStats.queryOptions());

  return (
    <div className={cn('flex flex-col gap-8 md:flex-row', className)}>
      <BountyStatistic
        color="text-green-400"
        label="in bounties"
        value={stats?.data.totalBountiesValue || 0}
      />
      <BountyStatistic
        color="text-blue-400"
        label="active bounties"
        showDollar={false}
        value={stats?.data.activeBounties || 0}
      />
    </div>
  );
}
