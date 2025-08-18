import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, DollarSign } from "lucide-react";
import { BountySkeleton } from "./skeletons/bounty-skeleton";
import {
  LOADING_SKELETON_COUNTS,
  PAGINATION_LIMITS,
} from "@/constants/dashboard";
import { formatNumber } from "@/lib/utils";
import type { Bounty } from "@/types/dashboard";

interface MyBountiesSidebarProps {
  myBounties?: Bounty[];
  isLoading: boolean;
  onBountyClick?: (bounty: Bounty) => void;
}

export const MyBountiesSidebar = memo(function MyBountiesSidebar({
  myBounties,
  isLoading,
  onBountyClick,
}: MyBountiesSidebarProps) {
  const displayBounties = myBounties?.slice(
    0,
    PAGINATION_LIMITS.MY_BOUNTIES_SIDEBAR,
  );

  return (
    <Card className="bountyCard border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" aria-hidden="true" />
          My Bounties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <BountySkeleton count={LOADING_SKELETON_COUNTS.MY_BOUNTIES} />
        )}

        {!isLoading &&
          displayBounties &&
          displayBounties.length > 0 &&
          displayBounties.map((bounty, index) => (
            <div key={bounty.id}>
              <div
                className="space-y-2 cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                onClick={() => onBountyClick?.(bounty)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onBountyClick?.(bounty);
                  }
                }}
                tabIndex={onBountyClick ? 0 : undefined}
                role={onBountyClick ? "button" : undefined}
                aria-label={
                  onBountyClick ? `View bounty: ${bounty.title}` : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <h4
                    className="text-sm font-medium truncate pr-2"
                    title={bounty.title}
                  >
                    {bounty.title}
                  </h4>
                  <Badge
                    variant={
                      bounty.status === "open" ||
                      bounty.status === "in_progress"
                        ? "default"
                        : "secondary"
                    }
                    className="flex-shrink-0"
                    aria-label={`Status: ${bounty.status}`}
                  >
                    {bounty.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" aria-hidden="true" />
                  <span aria-label={`Amount: $${bounty.amount}`}>
                    ${formatNumber(bounty.amount)}
                  </span>
                </div>
              </div>
              {index < displayBounties.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}

        {!isLoading && (!myBounties || myBounties.length === 0) && (
          <p className="text-sm text-muted-foreground">
            No bounties created yet
          </p>
        )}
      </CardContent>
    </Card>
  );
});
