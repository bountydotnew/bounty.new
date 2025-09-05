import { DollarSign, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatLargeNumber } from '@/lib/utils';
import type {
  ActivityItem,
  Bounty,
  RecommendedBounty,
} from '@/types/dashboard';

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
      <Card className="border border-[#383838]/20 bg-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="animate-pulse" key={i}>
                  <div className="mb-1 h-4 w-3/4 rounded bg-[#383838]" />
                  <div className="h-3 w-1/2 rounded bg-[#383838]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div className="flex items-start gap-3" key={activity.id}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-white">
                      {activity.title}
                    </p>
                    <p
                      className="truncate text-gray-400 text-xs"
                      title={activity.description}
                    >
                      {activity.description}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-gray-400 text-sm">No recent activity</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[#383838]/20 bg-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-white">Recommended</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((bounty) => (
              <div
                className="cursor-pointer rounded-lg border border-[#383838]/20 p-3 transition-colors hover:bg-[#2A2A28]"
                key={bounty.id}
              >
                <h4 className="mb-1 font-medium text-sm text-white">
                  {bounty.title}
                </h4>
                <p
                  className="mb-2 text-gray-400 text-xs"
                  title={bounty.description}
                >
                  {bounty.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    className="border-[#383838] text-gray-400 text-xs"
                    variant="outline"
                  >
                    {bounty.technology}
                  </Badge>
                  <span className="font-medium text-green-400 text-sm">
                    ${formatLargeNumber(bounty.amount)}
                  </span>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-gray-400 text-sm">No recommendations yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#383838]/20 bg-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp aria-hidden="true" className="h-5 w-5 text-white" />
            My Bounties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingMyBounties ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="animate-pulse" key={i}>
                  <div className="mb-1 h-4 w-3/4 rounded bg-[#383838]" />
                  <div className="h-3 w-1/2 rounded bg-[#383838]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {myBounties.map((b, index) => (
                <div key={b.id}>
                  <div
                    aria-label={
                      onBountyClick ? `View bounty: ${b.title}` : undefined
                    }
                    className="-m-2 cursor-pointer space-y-2 rounded p-2 transition-colors hover:bg-[#2A2A28]"
                    onClick={() => onBountyClick?.(b)}
                    role={onBountyClick ? 'button' : undefined}
                    tabIndex={onBountyClick ? 0 : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <h4
                        className="truncate pr-2 font-medium text-sm text-white"
                        title={b.title}
                      >
                        {b.title}
                      </h4>
                      <Badge
                        aria-label={`Status: ${b.status}`}
                        className="flex-shrink-0 border-[#383838] text-gray-400"
                        variant={
                          b.status === 'open' || b.status === 'in_progress'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <DollarSign
                        aria-hidden="true"
                        className="h-3 w-3 text-green-400"
                      />
                      <span
                        aria-label={`Amount: $${b.amount}`}
                        className="font-medium text-green-400"
                      >
                        ${formatLargeNumber(b.amount)}
                      </span>
                    </div>
                  </div>
                  {index < myBounties.length - 1 && (
                    <Separator className="mt-4 bg-[#383838]" />
                  )}
                </div>
              ))}
              {myBounties.length === 0 && (
                <p className="text-gray-400 text-sm">No bounties created yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
