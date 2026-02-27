'use client';

import { useContext } from 'react';
import { BountiesFeedContext } from './context';
import { StandardBountyCard } from '@/components/bounty/bounty-card';
import { BountySkeleton } from '@/components/dashboard/skeletons/bounty-skeleton';
import { LOADING_SKELETON_COUNTS } from '@/constants';
import { useSession } from '@/context/session-context';

/**
 * BountiesFeed Grid View
 *
 * Explicit variant for displaying bounties in a grid layout.
 * This replaces the `layout="grid"` boolean prop pattern.
 *
 * @example
 * ```tsx
 * <BountiesFeedProvider {...props}>
 *   <BountiesFeed.GridView />
 * </BountiesFeedProvider>
 * ```
 */
export function GridView() {
  const context = useContext(BountiesFeedContext);
  if (!context) {
    throw new Error('GridView must be used within BountiesFeedProvider');
  }

  const { state, actions, meta } = context;
  const { bounties, isLoading, isError, error, statsMap, title } = state;
  const { deleteBounty } = actions;
  const { className } = meta;
  const { session } = useSession();

  if (isLoading) {
    return (
      <div className={className}>
        {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
        <BountySkeleton count={LOADING_SKELETON_COUNTS.BOUNTIES} grid={true} />
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

  if (bounties.length === 0) {
    return (
      <div className={className}>
        {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No bounties available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h1 className="mb-4 font-semibold text-2xl">{title}</h1>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bounties.map((bounty) => {
          const canDelete = session?.user?.id
            ? bounty.creator.id === session.user.id
            : false;
          return (
            <StandardBountyCard
              bounty={bounty}
              key={bounty.id}
              onDelete={canDelete ? () => deleteBounty(bounty.id) : undefined}
              stats={statsMap.get(bounty.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
