'use client';

import { formatDistanceToNow } from 'date-fns';
import { GitPullRequestIcon, PlusCircleIcon } from 'lucide-react';
import Link from 'next/link';
import type { ActivityItem } from '@bounty/types';
import { CommentsIcon } from '@bounty/ui';

interface ActivityListProps {
  activities: ActivityItem[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-border-subtle border-dashed bg-surface-1/50">
        <p className="text-sm text-text-tertiary">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => {
        const icon =
          activity.type === 'bounty_created' ? (
            <PlusCircleIcon className="h-5 w-5" />
          ) : activity.type === 'submission_created' ? (
            <GitPullRequestIcon className="h-5 w-5" />
          ) : (
            <CommentsIcon className="h-5 w-5" />
          );

        const label =
          activity.type === 'bounty_created'
            ? 'Created a bounty'
            : activity.type === 'submission_created'
              ? 'Submitted to'
              : 'Commented on';

        const href =
          activity.type === 'bounty_created'
            ? `/bounty/${activity.id}`
            : `/bounty/${activity.data.bountyId}`;

        return (
          <div
            key={`${activity.type}-${activity.id}`}
            className="flex gap-4 rounded-xl border border-border-subtle bg-surface-1 p-4 transition-colors hover:bg-surface-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-transparent text-foreground">
              {icon}
            </div>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">
                  {label}
                </span>
                <span className="text-xs text-text-tertiary">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <Link
                href={href}
                className="text-base font-semibold text-foreground hover:underline truncate"
              >
                {activity.title}
              </Link>

              {activity.type === 'bounty_created' ||
              activity.type === 'submission_created' ? (
                <span className="text-sm text-text-tertiary">
                  {Number(activity.data.amount).toLocaleString()}{' '}
                  {activity.data.currency}
                </span>
              ) : (
                <p className="text-sm text-text-tertiary line-clamp-2">
                  &ldquo;{activity.data.content}&rdquo;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
