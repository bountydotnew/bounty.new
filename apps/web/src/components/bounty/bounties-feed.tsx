import { memo } from "react";
import { BountyCard } from "@/components/bounty/bounty-card";
import { BountySkeleton } from "@/components/dashboard/skeletons/bounty-skeleton";
import { LOADING_SKELETON_COUNTS } from "@/constants/dashboard";
import type { Bounty } from "@/types/dashboard";

interface BountiesFeedProps {
  title?: string;
  bounties?: Bounty[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  layout?: "grid" | "list";
  onBountyClick?: (bounty: Bounty) => void;
  className?: string;
}

export const BountiesFeed = memo(function BountiesFeed({
  title = "",
  bounties,
  isLoading,
  isError,
  error,
  layout = "list",
  // onBountyClick,
  className = "",
}: BountiesFeedProps) {
  const isGrid = layout === "grid";

  if (isLoading) {
    return (
      <div className={className}>
        {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
        <BountySkeleton
          count={LOADING_SKELETON_COUNTS.BOUNTIES}
          grid={isGrid}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
        <div className="text-center py-8" role="alert">
          <p className="text-destructive">
            Error: {error?.message || "Failed to load bounties"}
          </p>
        </div>
      </div>
    );
  }

  if (!bounties || bounties.length === 0) {
    return (
      <div className={className}>
        {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No bounties available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
      <div
        className={
          isGrid
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }
      >
        {bounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
});
