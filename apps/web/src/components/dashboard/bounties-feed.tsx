import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BountyCard } from "./bounty-card";
import { BountySkeleton } from "./skeletons/bounty-skeleton";
import { LOADING_SKELETON_COUNTS } from "@/constants/dashboard";
import type { Bounty } from "@/types/dashboard";

interface BountiesFeedProps {
  bounties?: Bounty[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onBountyClick?: (bounty: Bounty) => void;
}

export const BountiesFeed = memo(function BountiesFeed({
  bounties,
  isLoading,
  isError,
  error,
  onBountyClick,
}: BountiesFeedProps) {
  return (
    <div className="lg:pr-2">
      <Card>
        <CardHeader>
          <CardTitle>All Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && (
              <BountySkeleton count={LOADING_SKELETON_COUNTS.BOUNTIES} />
            )}

            {isError && (
              <div className="text-center py-8" role="alert">
                <p className="text-destructive">
                  Error: {error?.message || "Failed to load bounties"}
                </p>
              </div>
            )}

            {!isLoading && !isError && bounties && (
              <>
                {bounties.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No bounties available at the moment.</p>
                  </div>
                ) : (
                  bounties.map((bounty) => (
                    <BountyCard
                      key={bounty.id}
                      bounty={bounty}
                      onClick={onBountyClick}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});