import { cn } from "@/lib/utils";
import { BountyStatistic } from "./bounty-statistic";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function BountyStatistics({ className }: { className?: string }) {
  const { data: stats } = useQuery(trpc.bounties.getBountyStats.queryOptions());

  return (
    <div className={cn("flex gap-8", className)}>
      <BountyStatistic 
        label="in bounties" 
        value={stats?.data.totalBountiesValue || 0} 
        color="text-green-400" 
      />
      <BountyStatistic 
        label="active bounties" 
        value={stats?.data.activeBounties || 0} 
        color="text-blue-400" 
        showDollar={false}
      />
    </div>
  );
}