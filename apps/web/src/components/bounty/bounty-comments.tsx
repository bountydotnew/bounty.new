"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import BountyCommentForm from "@/components/bounty/bounty-comment-form";
import BountyComment from "@/components/bounty/bounty-comment";
import CommentEditDialog from "@/components/bounty/comment-edit-dialog";
import { MessageCircle } from "lucide-react";
import { authClient } from "@bounty/auth/client";

export interface BountyCommentsProps {
  bountyId: string;
  pageSize?: number;
}

export default function BountyComments({ bountyId, pageSize = 10 }: BountyCommentsProps) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "top">("newest");

  const key = trpc.bounties.getBountyComments.queryKey({ bountyId });
  const commentsQuery = useQuery(trpc.bounties.getBountyComments.queryOptions({ bountyId }));

  const addComment = useMutation({ ...trpc.bounties.addBountyComment.mutationOptions() });
  const toggleLike = useMutation({ ...trpc.bounties.toggleCommentLike.mutationOptions() });
  const updateComment = useMutation({ ...trpc.bounties.updateBountyComment.mutationOptions() });
  const deleteComment = useMutation({ ...trpc.bounties.deleteBountyComment.mutationOptions() });
  const [editState, setEditState] = useState<{ id: string; initial: string } | null>(null);

  const sorted = useMemo(() => {
    const items = (commentsQuery.data || []).slice();
    if (sort === "top") {
      items.sort((a: any, b: any) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    return items;
  }, [commentsQuery.data, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  const pagerRef = useRef<HTMLDivElement | null>(null);
  const [showFloatingPager, setShowFloatingPager] = useState(false);

  const prevPageRef = useRef(page);
  const [entering, setEntering] = useState(false);
  const [animDir, setAnimDir] = useState<1 | -1>(1);

  useEffect(() => {
    const onScroll = () => {
      const el = pagerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setShowFloatingPager(rect.top > window.innerHeight || rect.bottom < 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const old = prevPageRef.current;
    const dir = page >= old ? 1 : -1;
    setAnimDir(dir);
    setEntering(true);
    const id = requestAnimationFrame(() => setEntering(false));
    prevPageRef.current = page;
    return () => cancelAnimationFrame(id);
  }, [page]);

  const postComment = (content: string, parentId?: string) => {
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const optimistic: import("@/types/comments").BountyCommentCacheItem[] = [
      {
        id: `temp-${Date.now()}`,
        content,
        parentId: parentId ?? null,
        createdAt: new Date().toISOString(),
        user: session?.user ? { id: session.user.id, name: session.user.name || "You", image: session.user.image || null } : { id: "me", name: "You", image: null },
        likeCount: 0,
        isLiked: false,
        editCount: 0,
      },
      ...previous,
    ];
    queryClient.setQueryData(key, optimistic);
    addComment.mutate(
      { bountyId, content, parentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  const likeComment = (commentId: string) => {
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.map((c) => (c.id === commentId ? { ...c, likeCount: Number(c.likeCount || 0) + (c.isLiked ? -1 : 1), isLiked: !c.isLiked } : c));
    queryClient.setQueryData(key, next);
    toggleLike.mutate(
      { commentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  const onEditComment = (commentId: string, newContent: string) => {
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.map((c) => (c.id === commentId ? { ...c, content: newContent, editCount: Number(c.editCount || 0) + 1 } : c));
    queryClient.setQueryData(key, next);
    updateComment.mutate(
      { commentId, content: newContent },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  const onDeleteComment = (commentId: string) => {
    const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
    const next = previous.filter((c) => c.id !== commentId);
    queryClient.setQueryData(key, next);
    deleteComment.mutate(
      { commentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  return (
    <div className="mb-8 p-6 rounded-lg bg-[#1D1D1D] border border-[#383838]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Comments <span className="text-sm text-neutral-400">({commentsQuery.data?.length ?? 0})</span></h2>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            className={`px-2 py-1 rounded-md border ${sort === "newest" ? "border-neutral-700 bg-neutral-800/60" : "border-transparent"}`}
            onClick={() => setSort("newest")}
          >
            Newest
          </button>
          <button
            className={`px-2 py-1 rounded-md border ${sort === "top" ? "border-neutral-700 bg-neutral-800/60" : "border-transparent"}`}
            onClick={() => setSort("top")}
          >
            Top
          </button>
        </div>
        <div className="text-xs text-neutral-400">
          Page {page} / {pages}
        </div>
      </div>

      <BountyCommentForm maxChars={245} isSubmitting={addComment.isPending} onSubmit={(content) => postComment(content)} />

      <CommentEditDialog
        open={Boolean(editState)}
        onOpenChange={(o) => {
          if (!o) setEditState(null);
        }}
        initialValue={editState?.initial || ""}
        onSave={(val) => {
          if (!editState) return;
          onEditComment(editState.id, val);
          setEditState(null);
        }}
        isSaving={updateComment.isPending}
      />

      <div
        className={`space-y-2 mt-4 transition-all duration-200 ${entering ? (animDir > 0 ? "opacity-0 translate-y-2" : "opacity-0 -translate-y-2") : "opacity-100 translate-y-0"}`}
      >
        {current.map((c) => (
          <BountyComment
            key={c.id}
            comment={c as any}
            isOwner={Boolean((c as any).user?.id && session?.user?.id && (c as any).user?.id === session.user.id)}
            onLike={likeComment}
            onEdit={(id) => setEditState({ id, initial: (c as any).content || "" })}
            onDelete={onDeleteComment}
          />
        ))}
      </div>

      <div ref={pagerRef} className="mt-4 flex items-center justify-between">
        <button
          className="px-3 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-xs text-neutral-300 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-xs text-neutral-300 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          disabled={page >= pages}
        >
          Next
        </button>
      </div>

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-full border border-neutral-800 bg-neutral-900/90 backdrop-blur px-3.5 py-3 shadow transition-all duration-200 ease-out ${showFloatingPager ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-2 scale-95 pointer-events-none"}`}
        aria-hidden={!showFloatingPager}
      >
        <div className="flex items-center gap-3">
          <button
            className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-[11px] text-neutral-300 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-[11px] text-neutral-400">{page} / {pages}</span>
          <button
            className="px-2 py-1 rounded-md border border-neutral-700 bg-neutral-800/60 text-[11px] text-neutral-300 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
