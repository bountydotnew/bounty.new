'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { BountyCard } from '@/components/bounty/bounty-card';
import { Spinner } from '@bounty/ui';
import type { Bounty } from '@/types/dashboard';
import { EmptyState } from './empty-state';

interface ProfileBountiesProps {
  userId: string;
}

export function ProfileBounties({ userId }: ProfileBountiesProps) {
  const { data: bountiesData, isLoading } = useQuery({
    ...trpc.bounties.getBountiesByUserId.queryOptions({ userId }),
    enabled: !!userId,
  });

  if (isLoading) {
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
        <BountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  );
}
