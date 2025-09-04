"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import BountyCommentForm from "@/components/bounty/bounty-comment-form";
import BountyComment from "@/components/bounty/bounty-comment";
import CommentEditDialog from "@/components/bounty/comment-edit-dialog";
import { MessageCircle, ChevronDown } from "lucide-react";
import { authClient } from "@bounty/auth/client";
import type { BountyCommentCacheItem } from "@/types/comments";

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

  const roots = useMemo(() => (commentsQuery.data || []).filter((c: any) => !c.parentId), [commentsQuery.data]);
  const sortedRoots = useMemo(() => {
    const items = roots.slice();
    if (sort === "top") {
      items.sort((a: any, b: any) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else {
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return items;
  }, [roots, sort]);

  const pages = Math.max(1, Math.ceil(sortedRoots.length / pageSize));
  const current = useMemo(() => sortedRoots.slice((page - 1) * pageSize, page * pageSize), [sortedRoots, page, pageSize]);
  const hasComments = (commentsQuery.data?.length ?? 0) > 0;
  const hasPages = pages > 1;
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const toggleThread = (id: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorKey, setFormErrorKey] = useState(0);

  const postComment = (content: string, parentId?: string) => {
    const previous: BountyCommentCacheItem[] = (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
    const trimmed = content.trim();
    const userId = session?.user?.id;
    if (userId) {
      if (!parentId) {
        const hasDuplicateRoot = previous.some(
          (c) => !c.parentId && c.user?.id === userId && c.content.trim() === trimmed,
        );
        if (hasDuplicateRoot) {
          setFormError("You've already said this.");
          setFormErrorKey((k) => k + 1);
          return;
        }
      } else {
        const duplicateRepliesCount = previous.filter(
          (c) => c.parentId && c.user?.id === userId && c.content.trim() === trimmed,
        ).length;
        if (duplicateRepliesCount >= 2) {
          setFormError("Duplicate reply limit reached (2 per bounty).");
          setFormErrorKey((k) => k + 1);
          return;
        }
      }
    }
    const optimistic: BountyCommentCacheItem[] = [
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
    setFormError(null);
    addComment.mutate(
      { bountyId, content, parentId },
      {
        onError: (err: any) => {
          if (err?.message?.toLowerCase().includes("duplicate")) {
            setFormError("Duplicate comment on this bounty");
            setFormErrorKey((k) => k + 1);
          }
          queryClient.setQueryData(key, previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      },
    );
  };

  const likeComment = (commentId: string) => {
    const previous: BountyCommentCacheItem[] = (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
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
    const previous: BountyCommentCacheItem[] = (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
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
    const previous: BountyCommentCacheItem[] = (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
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
    <div className="mb-8 rounded-lg bg-none border-none">
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
        {hasPages && (
        <div className="text-xs text-neutral-400">
            Page {page} / {pages}
          </div>
        )}
      </div>

      {!replyTo && (
        <BountyCommentForm
          maxChars={245}
          isSubmitting={addComment.isPending}
          onSubmit={(content) => postComment(content)}
          error={formError}
          errorKey={formErrorKey}
          placeholder="Add a comment"
          submitLabel="Post"
        />
      )}

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
        {commentsQuery.isLoading ? (
          <div className="space-y-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3">
                <div className="h-4 w-24 bg-neutral-800 rounded mb-2" />
                <div className="h-3 w-full bg-neutral-800 rounded" />
              </div>
            ))}
          </div>
        ) : current
          .filter((c: any) => !c.parentId)
          .map((root: any) => {
            const children = (commentsQuery.data || []).filter((x: any) => x.parentId === root.id);
            const expanded = expandedThreads.has(root.id);
            return (
              <div key={root.id} className="space-y-2">
                <BountyComment
                  comment={root}
                  isOwner={Boolean(root.user?.id && session?.user?.id && root.user?.id === session.user.id)}
                  onLike={likeComment}
                  onEdit={(id) => setEditState({ id, initial: (root as any).content || "" })}
                  onDelete={onDeleteComment}
                  onReply={(id) => { setFormError(null); setFormErrorKey((k) => k + 1); setReplyTo(id); }}
                  allowReply={true}
                />
                {replyTo === root.id && (
                  <div className="ml-4 mt-2">
                    <BountyCommentForm
                      maxChars={245}
                      isSubmitting={addComment.isPending}
                      onSubmit={(content) => { postComment(content, root.id); setReplyTo(null); setFormError(null); setExpandedThreads((prev) => new Set(prev).add(root.id)); }}
                      error={formError}
                      errorKey={formErrorKey}
                      placeholder={`Reply to ${root.user?.name || "user"}`}
                      submitLabel="Reply"
                      onCancel={() => { setReplyTo(null); setFormError(null); setFormErrorKey((k) => k + 1); }}
                      autoFocus
                    />
                  </div>
                )}
                {children.length > 0 && (
                  <div className="ml-4">
                    <button
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                      onClick={() => toggleThread(root.id)}
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      {expanded ? "Hide replies" : `Show ${children.length} ${children.length === 1 ? "reply" : "replies"}`}
                    </button>
                    <div className={`mt-2 pl-3 border-l border-neutral-800 space-y-2 transition-all duration-200 ${expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                        {children.map((child: any) => (
                          <BountyComment
                            key={child.id}
                            comment={child}
                            isOwner={Boolean(child.user?.id && session?.user?.id && child.user?.id === session.user.id)}
                            onLike={likeComment}
                            onEdit={(id) => setEditState({ id, initial: (child as any).content || "" })}
                            onDelete={(id) => {
                              const key = trpc.bounties.getBountyComments.queryKey({ bountyId });
                              const previous = queryClient.getQueryData<import("@/types/comments").BountyCommentCacheItem[]>(key) || [];
                              const next = previous.map((c) => (c.id === id ? { ...c, _removing: true } as any : c));
                              queryClient.setQueryData(key, next);
                              onDeleteComment(id);
                            }}
                            allowReply={false}
                            parentRef={{ userName: root.user?.name || "Anonymous", snippet: String(root.content).slice(0, 40) + (String(root.content).length > 40 ? "…" : "") }}
                            isRemoving={(child as any)._removing}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {hasPages && (
        <div ref={pagerRef} className="mt-4 flex items-center justify-end gap-2">
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
      )}

      {hasPages && (
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
      )}
    </div>
  );
}
