'use client';

import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { StandardBountyCard } from '@/components/bounty/bounty-card';
import { Spinner } from '@bounty/ui';
import type { Bounty } from '@/types/dashboard';
import { EmptyState } from './empty-state';

interface ProfileBountiesProps {
  userId: string;
}

export function ProfileBounties({ userId }: ProfileBountiesProps) {
  const bountiesData = useQuery(
    api.functions.bounties.getBountiesByUserId,
    userId ? { userId } : 'skip'
  );

  if (bountiesData === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!bountiesData?.data || bountiesData.data.length === 0) {
    return <EmptyState message="No bounties created yet" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {bountiesData.data.map((bounty: Bounty) => (
        <StandardBountyCard key={bounty._id} bounty={bounty} />
      ))}
    </div>
  );
}
