'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';

export function ActivityTable() {
  const { data: activityResponse, isLoading } = useQuery(
    trpc.connect.getActivity.queryOptions({ page: 1, limit: 20 })
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activities = activityResponse?.data ?? [];

  if (activities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No activity yet. Complete or create a bounty to see your activity here!
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center gap-9.5 px-4 py-2 border-b border-border">
        <div className="flex justify-between items-center gap-4 flex-1">
          <span className="text-sm font-medium tracking-wider text-muted-foreground">
            Type
          </span>
          <span className="text-sm font-medium tracking-wider text-muted-foreground">
            Amount
          </span>
        </div>
        <div className="flex justify-between items-center gap-4 flex-1">
          <span className="text-sm font-medium tracking-wider text-muted-foreground">
            Date
          </span>
          <span className="text-sm font-medium tracking-wider text-muted-foreground">
            Organization
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {activities.map((activity: {
          id: string;
          type: string;
          amount: string;
          createdAt: string;
          bounty: {
            id: string;
            githubRepoOwner?: string | null;
            githubRepoName?: string | null;
            title?: string;
          } | null;
        }) => (
          <div
            key={activity.id}
            className="flex items-center gap-9.5 px-4 py-2 border-b border-border last:border-0"
          >
            <div className="flex justify-between items-center gap-4 flex-1">
              <span className="text-xs font-medium">
                {activity.type === 'payout' ? 'Bounty awarded' : 'Bounty created'}
              </span>
              <span className={`text-xs font-medium ${
                activity.type === 'payout' ? 'text-green-500' : ''
              }`}>
                {activity.type === 'payout' ? '+' : '-'}$
                {Number(activity.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4 flex-1">
              <span className="text-xs font-medium">
                {new Date(activity.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <div className="flex items-center gap-1">
                {activity.bounty?.githubRepoOwner ? (
                  <>
                    <div
                      className="size-3 rounded-full bg-muted"
                      style={{
                        backgroundImage: `url(https://github.com/${activity.bounty.githubRepoOwner}.png)`,
                        backgroundSize: 'cover',
                      }}
                    />
                    <span className="text-xs font-medium">
                      {activity.bounty.githubRepoOwner}
                      {activity.bounty.githubRepoName && `/${activity.bounty.githubRepoName}`}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">bounty.new</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
