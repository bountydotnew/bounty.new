'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { BountyCard } from '@/components/bounty/bounty-card';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import type { Bounty } from '@/types/dashboard';
import { trpc } from '@/utils/trpc';

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useQuery(
    trpc.bounties.listBookmarkedBounties.queryOptions({ page, limit })
  );

  const items = useMemo(() => data?.data ?? [], [data]);
  const totalPages = data?.pagination?.totalPages ?? 1;
  const skeletonKeys = useMemo(() => ['a', 'b', 'c'], []);

  return (
    <>
      <Header />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-medium text-white text-xl">Bookmarks</h1>
          {totalPages > 1 && (
            <div className="text-neutral-400 text-xs">
              Page {page} / {totalPages}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {skeletonKeys.map((k) => (
              <div
                className="animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3"
                key={k}
              >
                <div className="mb-2 h-4 w-24 rounded bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="text-neutral-400 text-sm">No bookmarks yet.</div>
        )}
        {!isLoading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((bounty) => (
              <BountyCard bounty={bounty as Bounty} key={bounty.id} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300 text-xs disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300 text-xs disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
