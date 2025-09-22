import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { BountyCard } from '@/components/bounty/bounty-card';
import { BountySkeleton } from '@/components/dashboard/skeletons/bounty-skeleton';
import { LOADING_SKELETON_COUNTS } from '@/constants';
import type { Bounty } from '@/types/dashboard';
import { trpc } from '@/utils/trpc';

interface BountiesFeedProps {
  title?: string;
  bounties?: Bounty[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  layout?: 'grid' | 'list';
  onBountyClick?: (bounty: Bounty) => void;
  className?: string;
}

export const BountiesFeed = memo(function BountiesFeed({
  title = '',
  bounties,
  isLoading,
  isError,
  error,
  layout = 'list',
  className = '',
}: BountiesFeedProps) {
  const isGrid = layout === 'grid';

  const ids = useMemo(() => (bounties || []).map((b) => b.id), [bounties]);
  const statsQuery = useQuery({
    ...trpc.bounties.getBountyStatsMany.queryOptions({ bountyIds: ids }),
    enabled: ids.length > 0,
  });
  const statsMap = useMemo(() => {
    const m = new Map<
      string,
      {
        commentCount: number;
        voteCount: number;
        isVoted: boolean;
        bookmarked: boolean;
      }
    >();
    (statsQuery.data?.stats || []).forEach((s: {
      bountyId: string;
      commentCount: number;
      voteCount: number;
      isVoted: boolean;
      bookmarked: boolean;
    }) => m.set(s.bountyId, s));
    return m;
  }, [statsQuery.data]);

  if (isLoading) {
    return (
      <div className={className}>
        {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
        <BountySkeleton
          count={LOADING_SKELETON_COUNTS.BOUNTIES}
          grid={isGrid}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
        <div className="py-8 text-center" role="alert">
          <p className="text-destructive">
            Error: {error?.message || 'Failed to load bounties'}
          </p>
        </div>
      </div>
    );
  }

  if (!bounties || bounties.length === 0) {
    return (
      <div className={className}>
        {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            No bounties available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
      <div
        className={
          isGrid
            ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-4'
        }
      >
        {bounties.map((bounty) => (
          <BountyCard
            bounty={bounty}
            key={bounty.id}
            stats={statsMap.get(bounty.id)}
          />
        ))}
      </div>
    </div>
  );
});
