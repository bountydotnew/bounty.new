'use client';

import { useContext } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { DashboardSidebarContext } from './context';

/**
 * DashboardSidebar ActivityCard
 *
 * Compound component that displays recent activity.
 * Must be used within DashboardSidebarProvider.
 *
 * @example
 * ```tsx
 * <DashboardSidebarProvider {...props}>
 *   <DashboardSidebar.ActivityCard />
 * </DashboardSidebarProvider>
 * ```
 */
export function ActivityCard() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error('ActivityCard must be used within DashboardSidebarProvider');
  }

  const { state } = context;
  const { activities, isLoadingActivities } = state;

  return (
    <Card className="border border-border-strong/20 bg-surface-1">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingActivities ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="animate-pulse" key={i}>
                <div className="mb-1 h-4 w-3/4 rounded bg-surface-3" />
                <div className="h-3 w-1/2 rounded bg-surface-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div className="flex items-start gap-3" key={activity.id}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground">
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
  );
}
