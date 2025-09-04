"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { BountyCard } from "@/components/bounty/bounty-card";
import { Header } from "@/components/dual-sidebar/sidebar-header";

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useQuery(trpc.bounties.listBookmarkedBounties.queryOptions({ page, limit }));

  const items = useMemo(() => data?.data ?? [], [data]);
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <>
      <Header />
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-medium text-white">Bookmarks</h1>
        {totalPages > 1 && (
          <div className="text-xs text-neutral-400">Page {page} / {totalPages}</div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3">
              <div className="h-4 w-24 bg-neutral-800 rounded mb-2" />
              <div className="h-3 w-full bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-neutral-400">No bookmarks yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty as any} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="px-3 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-xs text-neutral-300 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-xs text-neutral-300 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
}


