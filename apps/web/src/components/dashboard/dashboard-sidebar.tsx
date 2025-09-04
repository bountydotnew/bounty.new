import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, DollarSign } from "lucide-react";
import { formatLargeNumber } from "@/lib/utils";
import type { ActivityItem, RecommendedBounty } from "@/types/dashboard";
import type { Bounty } from "@/types/dashboard";

interface DashboardSidebarProps {
  activities?: ActivityItem[];
  recommendations?: RecommendedBounty[];
  myBounties?: Bounty[];
  isLoadingActivities?: boolean;
  isLoadingMyBounties?: boolean;
  onBountyClick?: (bounty: Bounty) => void;
}

export const DashboardSidebar = memo(function DashboardSidebar({
  activities = [],
  recommendations = [],
  myBounties = [],
  isLoadingActivities = false,
  isLoadingMyBounties = false,
  onBountyClick,
}: DashboardSidebarProps) {
  return (
    <div className="space-y-6 lg:pr-2">
      <Card className="bg-[#1D1D1D] border border-[#383838]/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-[#383838] rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-[#383838] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-gray-400 truncate" title={activity.description}>
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-400">No recent activity</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1D1D1D] border border-[#383838]/20">
        <CardHeader>
          <CardTitle className="text-white">Recommended</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((bounty) => (
              <div key={bounty.id} className="border border-[#383838]/20 rounded-lg p-3 hover:bg-[#2A2A28] transition-colors cursor-pointer">
                <h4 className="text-sm font-medium mb-1 text-white">{bounty.title}</h4>
                <p className="text-xs text-gray-400 mb-2" title={bounty.description}>
                  {bounty.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-[#383838] text-gray-400">
                    {bounty.technology}
                  </Badge>
                  <span className="text-sm font-medium text-green-400">${formatLargeNumber(bounty.amount)}</span>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-sm text-gray-400">No recommendations yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1D1D1D] border border-[#383838]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-white" aria-hidden="true" />
            My Bounties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingMyBounties ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-[#383838] rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-[#383838] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {myBounties.map((b, index) => (
                <div key={b.id}>
                  <div
                    className="space-y-2 cursor-pointer hover:bg-[#2A2A28] rounded p-2 -m-2 transition-colors"
                    onClick={() => onBountyClick?.(b)}
                    tabIndex={onBountyClick ? 0 : undefined}
                    role={onBountyClick ? "button" : undefined}
                    aria-label={onBountyClick ? `View bounty: ${b.title}` : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate pr-2 text-white" title={b.title}>
                        {b.title}
                      </h4>
                      <Badge
                        variant={b.status === "open" || b.status === "in_progress" ? "default" : "secondary"}
                        className="flex-shrink-0 border-[#383838] text-gray-400"
                        aria-label={`Status: ${b.status}`}
                      >
                        {b.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <DollarSign className="h-3 w-3 text-green-400" aria-hidden="true" />
                      <span aria-label={`Amount: $${b.amount}`} className="text-green-400 font-medium">
                        ${formatLargeNumber(b.amount)}
                      </span>
                    </div>
                  </div>
                  {index < myBounties.length - 1 && <Separator className="mt-4 bg-[#383838]" />}
                </div>
              ))}
              {myBounties.length === 0 && (
                <p className="text-sm text-gray-400">No bounties created yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});


