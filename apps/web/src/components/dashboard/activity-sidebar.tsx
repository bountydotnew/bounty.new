import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
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
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
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
      <Card className="bountyCard border-none shadow-none">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    title={activity.description}
                  >
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bountyCard border-none shadow-none">
        <CardHeader>
          <CardTitle>Recommended</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((bounty) => (
              <div
                key={bounty.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                tabIndex={0}
                role="button"
                aria-label={`View recommended bounty: ${bounty.title}`}
              >
                <h4 className="text-sm font-medium mb-1">{bounty.title}</h4>
                <p
                  className="text-xs text-muted-foreground mb-2"
                  title={bounty.description}
                >
                  {bounty.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {bounty.technology}
                  </Badge>
                  <span className="text-sm font-medium text-primary">
                    ${formatNumber(bounty.amount)}
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
