import { cn } from "@/lib/utils";
import { BountyStatistic } from "./bounty-statistic";

export function BountyStatistics({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-8", className)}>
      <BountyStatistic label="paid out today" value={75700} />
      <BountyStatistic label="active bounties" value={207} />
      {/* <BountyStatistic label="in bounties" value={125921} /> */}
    </div>
  );
}