'use client';

import { formatDistanceToNow } from 'date-fns';
import { PlusCircleIcon } from 'lucide-react';
import Link from 'next/link';
import type { ActivityItem } from '@bounty/types';
import { CommentsIcon } from '@bounty/ui';

interface ActivityListProps {
  activities: ActivityItem[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-[#232323] border-dashed bg-[#191919]/50">
        <p className="text-sm text-[#5A5A5A]">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => {
        const isBounty = activity.type === 'bounty_created';
        
        return (
          <div 
            key={`${activity.type}-${activity.id}`}
            className="flex gap-4 rounded-xl border border-[#232323] bg-[#191919] p-4 transition-colors hover:bg-[#1F1F1F]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isBounty ? 'bg-transparent text-white' : 'bg-transparent text-white'
            }`}>
              {isBounty ? (
                <PlusCircleIcon className="h-5 w-5" />
              ) : (
                <CommentsIcon className="h-5 w-5" />
              )}
            </div>
            
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#CFCFCF]">
                  {isBounty ? 'Created a bounty' : 'Commented on'}
                </span>
                <span className="text-xs text-[#5A5A5A]">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <Link 
                href={`/bounty/${isBounty ? activity.id : activity.data.bountyId}`}
                className="text-base font-semibold text-white hover:underline truncate"
              >
                {activity.title}
              </Link>
              
              {isBounty ? (
                <span className="text-sm text-[#5A5A5A]">
                  {Number(activity.data.amount).toLocaleString()} {activity.data.currency}
                </span>
              ) : (
                <p className="text-sm text-[#929292] line-clamp-2">
                  "{activity.data.content}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

