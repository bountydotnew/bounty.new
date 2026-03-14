'use client';

import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { ActivityList } from './activity-list';
import { Spinner } from '@bounty/ui';
import type { ActivityItem } from '@bounty/types';
import { EmptyState } from './empty-state';

interface ProfileActivityProps {
  userId: string;
}

export function ProfileActivity({ userId }: ProfileActivityProps) {
  const activityData = useQuery(
    api.functions.user.getUserActivity,
    userId ? { userId, limit: 10 } : 'skip'
  );

  if (activityData === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!activityData || activityData.length === 0) {
    return <EmptyState message="No recent activity" />;
  }

  // Transform the data to match ActivityItem type
  const activities: ActivityItem[] = activityData.map((item) => ({
    type: item.type as ActivityItem['type'],
    id: item.id,
    title: item.title,
    createdAt: new Date(item.createdAt),
    data: item.data,
  }));

  return <ActivityList activities={activities} />;
}
