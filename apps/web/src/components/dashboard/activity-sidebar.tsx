import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatLargeNumber } from "@/lib/utils";
import type { ActivityItem, RecommendedBounty } from "@/types/dashboard";

interface ActivitySidebarProps {
  activities?: ActivityItem[];
  recommendations?: RecommendedBounty[];
  isLoading?: boolean;
}

// Mock data - in real app this would come from API
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    type: "comment",
    title: "New comment on bounty",
    description: "Build a React component...",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "completion",
    title: "Bounty completed",
    description: "API integration task",
    timestamp: "1 day ago",
  },
  {
    id: "3",
    type: "payment",
    title: "Payment received",
    description: "$500 for mobile app bug fix",
    timestamp: "3 days ago",
  },
];

const MOCK_RECOMMENDATIONS: RecommendedBounty[] = [
  {
    id: "1",
    title: "Frontend React Task",
    description: "Build responsive dashboard",
    technology: "React",
    amount: 300,
  },
  {
    id: "2",
    title: "API Integration",
    description: "Connect payment gateway",
    technology: "Node.js",
    amount: 450,
  },
];

export const ActivitySidebar = memo(function ActivitySidebar({
  activities = MOCK_ACTIVITIES,
  recommendations = MOCK_RECOMMENDATIONS,
  isLoading = false,
}: ActivitySidebarProps) {
  if (isLoading) {
    return (
      <div className="space-y-6 lg:pr-2">
        <Card className="bg-[#1D1D1D] border border-[#383838]/20">
          <CardHeader>
            <div className="h-6 bg-[#383838] rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-[#383838] rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-[#383838] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:pr-2">
      <Card className="bg-[#1D1D1D] border border-[#383838]/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p
                    className="text-xs text-gray-400 truncate"
                    title={activity.description}
                  >
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1D1D1D] border border-[#383838]/20">
        <CardHeader>
          <CardTitle className="text-white">Recommended</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((bounty) => (
              <div
                key={bounty.id}
                className="border border-[#383838]/20 rounded-lg p-3 hover:bg-[#2A2A28] transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                tabIndex={0}
                role="button"
                aria-label={`View recommended bounty: ${bounty.title}`}
              >
                <h4 className="text-sm font-medium mb-1 text-white">{bounty.title}</h4>
                <p
                  className="text-xs text-gray-400 mb-2"
                  title={bounty.description}
                >
                  {bounty.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs border-[#383838] text-gray-400">
                    {bounty.technology}
                  </Badge>
                  <span className="text-sm font-medium text-green-400">
                    ${formatLargeNumber(bounty.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
