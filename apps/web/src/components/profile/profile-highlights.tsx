'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { StandardBountyCard } from '@/components/bounty/bounty-card';
import { Spinner } from '@bounty/ui';
import type { Bounty } from '@/types/dashboard';
import { EmptyState } from './empty-state';

interface ProfileHighlightsProps {
  userId: string;
}

export function ProfileHighlights({ userId }: ProfileHighlightsProps) {
  const { data: highlightsData, isLoading } = useQuery({
    ...trpc.bounties.getHighlights.queryOptions({ userId }),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!highlightsData?.data || highlightsData.data.length === 0) {
    return <EmptyState message="No highlighted bounties" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {highlightsData.data.map((bounty: Bounty) => (
        <StandardBountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  );
}
