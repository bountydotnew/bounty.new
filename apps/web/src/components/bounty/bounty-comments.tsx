'use client';

import type { AppRouter } from '@bounty/api';
import { authClient } from '@bounty/auth/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import BountyComment from '@/components/bounty/bounty-comment';
import BountyCommentForm from '@/components/bounty/bounty-comment-form';
import CommentEditDialog from '@/components/bounty/comment-edit-dialog';
import type { BountyCommentCacheItem } from '@/types/comments';
import { trpc } from '@/utils/trpc';

export interface BountyCommentsProps {
  bountyId: string;
  pageSize?: number;
  initialComments?: BountyCommentCacheItem[];
}

export default function BountyComments({
  bountyId,
  pageSize = 10,
  initialComments,
}: BountyCommentsProps) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'top'>('newest');

  const key = trpc.bounties.getBountyComments.queryKey({ bountyId });
  const commentsQuery = useQuery({
    ...trpc.bounties.getBountyComments.queryOptions({ bountyId }),
    initialData: initialComments?.map((c) => ({
      ...c,
      originalContent: c.originalContent ?? null,
    })),
    staleTime: Infinity,
  });

  const addComment = useMutation({
    ...trpc.bounties.addBountyComment.mutationOptions(),
  });
  const toggleLike = useMutation({
    ...trpc.bounties.toggleCommentLike.mutationOptions(),
  });
  const updateComment = useMutation({
    ...trpc.bounties.updateBountyComment.mutationOptions(),
  });
  const [editError, setEditError] = useState<string | null>(null);
  const deleteComment = useMutation({
    ...trpc.bounties.deleteBountyComment.mutationOptions(),
  });
  const [editState, setEditState] = useState<{
    id: string;
    initial: string;
  } | null>(null);

  const roots = useMemo(
    () =>
      (commentsQuery.data || []).filter(
        (c: BountyCommentCacheItem) => !c.parentId
      ),
    [commentsQuery.data]
  );
  const sortedRoots = useMemo(() => {
    const items = roots.slice();
    if (sort === 'top') {
      items.sort(
        (a: BountyCommentCacheItem, b: BountyCommentCacheItem) =>
          (b.likeCount ?? 0) - (a.likeCount ?? 0)
      );
    } else {
      items.sort(
        (a: BountyCommentCacheItem, b: BountyCommentCacheItem) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return items;
  }, [roots, sort]);

  const pages = Math.max(1, Math.ceil(sortedRoots.length / pageSize));
  const current = useMemo(
    () => sortedRoots.slice((page - 1) * pageSize, page * pageSize),
    [sortedRoots, page, pageSize]
  );
  const hasPages = pages > 1;
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );
  const toggleThread = (id: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      setShowFloatingPager(rect.top > window.innerHeight || rect.bottom < 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
    const previous: BountyCommentCacheItem[] =
      (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
    const trimmed = content.trim();
    const userId = session?.user?.id;
    if (userId) {
      if (parentId) {
        const duplicateRepliesCount = previous.filter(
          (c) =>
            c.parentId && c.user?.id === userId && c.content.trim() === trimmed
        ).length;
        if (duplicateRepliesCount >= 2) {
          setFormError('Duplicate reply limit reached (2 per bounty).');
          setFormErrorKey((k) => k + 1);
          return;
        }
      } else {
        const hasDuplicateRoot = previous.some(
          (c) =>
            !c.parentId && c.user?.id === userId && c.content.trim() === trimmed
        );
        if (hasDuplicateRoot) {
          setFormError("You've already said this.");
          setFormErrorKey((k) => k + 1);
          return;
        }
      }
    }
    const optimistic: BountyCommentCacheItem[] = [
      {
        id: `temp-${Date.now()}`,
        content,
        originalContent: null,
        parentId: parentId ?? null,
        createdAt: new Date().toISOString(),
        user: session?.user
          ? {
              id: session.user.id,
              name: session.user.name || 'You',
              image: session.user.image || null,
            }
          : { id: 'me', name: 'You', image: null },
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
        onError: (err: TRPCClientErrorLike<AppRouter>) => {
          if (err?.message?.toLowerCase().includes('duplicate')) {
            setFormError('Duplicate comment on this bounty');
            setFormErrorKey((k) => k + 1);
          }
          queryClient.setQueryData(key, previous);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };

  const likeComment = (commentId: string) => {
    const previous: BountyCommentCacheItem[] =
      (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
    const next = previous.map((c) =>
      c.id === commentId
        ? {
            ...c,
            likeCount: Number(c.likeCount || 0) + (c.isLiked ? -1 : 1),
            isLiked: !c.isLiked,
          }
        : c
    );
    queryClient.setQueryData(key, next);
    toggleLike.mutate(
      { commentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };

  const onEditComment = (commentId: string, newContent: string) => {
    const previous: BountyCommentCacheItem[] =
      (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
    const current = previous.find((c) => c.id === commentId);
    const trimmedNew = newContent.trim();
    if (!current || current.content.trim() === trimmedNew) {
      return;
    }
    const next = previous.map((c) =>
      c.id === commentId
        ? {
            ...c,
            originalContent: c.originalContent ?? c.content,
            content: trimmedNew,
            editCount: Number(c.editCount || 0) + 1,
          }
        : c
    );
    queryClient.setQueryData(key, next);
    setEditError(null);
    updateComment.mutate(
      { commentId, content: trimmedNew },
      {
        onSuccess: () => {
          setEditState(null);
        },
        onError: (err: TRPCClientErrorLike<AppRouter>) => {
          queryClient.setQueryData(key, previous);
          if (err?.message?.toLowerCase?.().includes('inappropriate')) {
            setEditError(
              'Inappropriate content detected. Please review your comment and try again.'
            );
          }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };

  const onDeleteComment = (commentId: string) => {
    const previous: BountyCommentCacheItem[] =
      (commentsQuery.data as BountyCommentCacheItem[] | undefined) || [];
    const next = previous.filter((c) => c.id !== commentId);
    queryClient.setQueryData(key, next);
    deleteComment.mutate(
      { commentId },
      {
        onError: () => queryClient.setQueryData(key, previous),
        onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
      }
    );
  };

  return (
    <div className="mb-8 rounded-lg border-none bg-none">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium text-white text-xl">
          Comments{' '}
          <span className="text-neutral-400 text-sm">
            ({commentsQuery.data?.length ?? 0})
          </span>
        </h2>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <button
            className={`rounded-md border px-2 py-1 ${sort === 'newest' ? 'border-neutral-700 bg-neutral-800/60' : 'border-transparent'}`}
            onClick={() => setSort('newest')}
          >
            Newest
          </button>
          <button
            className={`rounded-md border px-2 py-1 ${sort === 'top' ? 'border-neutral-700 bg-neutral-800/60' : 'border-transparent'}`}
            onClick={() => setSort('top')}
          >
            Top
          </button>
        </div>
        {hasPages && (
          <div className="text-neutral-400 text-xs">
            Page {page} / {pages}
          </div>
        )}
      </div>

      {!replyTo && (
        <BountyCommentForm
          error={formError}
          errorKey={formErrorKey}
          isSubmitting={addComment.isPending}
          maxChars={245}
          onSubmit={(content) => postComment(content)}
          placeholder="Add a comment"
          submitLabel="Post"
        />
      )}

      <CommentEditDialog
        error={editError}
        initialValue={editState?.initial || ''}
        isSaving={updateComment.isPending}
        onOpenChange={(o) => {
          if (!o) {
            setEditState(null);
            setEditError(null);
          }
        }}
        onSave={(val) => {
          if (!editState) {
            return;
          }
          onEditComment(editState.id, val);
          setEditState(null);
        }}
        open={Boolean(editState)}
      />

      <div
        className={`mt-4 space-y-2 transition-all duration-200 ${entering ? (animDir > 0 ? 'translate-y-2 opacity-0' : '-translate-y-2 opacity-0') : 'translate-y-0 opacity-100'}`}
      >
        {commentsQuery.isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                className="animate-pulse rounded-md border border-neutral-800 bg-neutral-900/30 p-3"
                key={i}
              >
                <div className="mb-2 h-4 w-24 rounded bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : (
          current
            .filter((c: BountyCommentCacheItem) => !c.parentId)
            .map((root: BountyCommentCacheItem) => {
              const children = (commentsQuery.data || []).filter(
                (x: BountyCommentCacheItem) => x.parentId === root.id
              );
              const expanded = expandedThreads.has(root.id);
              return (
                <div className="space-y-2" key={root.id}>
                  <BountyComment
                    allowReply={true}
                    comment={root}
                    isOwner={Boolean(
                      root.user?.id &&
                        session?.user?.id &&
                        root.user?.id === session.user.id
                    )}
                    onDelete={onDeleteComment}
                    onEdit={(id) =>
                      setEditState({
                        id,
                        initial: (root as BountyCommentCacheItem).content || '',
                      })
                    }
                    onLike={likeComment}
                    onReply={(id) => {
                      setFormError(null);
                      setFormErrorKey((k) => k + 1);
                      setReplyTo(id);
                    }}
                  />
                  {replyTo === root.id && (
                    <div className="mt-2 ml-4">
                      <BountyCommentForm
                        autoFocus
                        error={formError}
                        errorKey={formErrorKey}
                        isSubmitting={addComment.isPending}
                        maxChars={245}
                        onCancel={() => {
                          setReplyTo(null);
                          setFormError(null);
                          setFormErrorKey((k) => k + 1);
                        }}
                        onSubmit={(content) => {
                          postComment(content, root.id);
                          setReplyTo(null);
                          setFormError(null);
                          setExpandedThreads((prev) =>
                            new Set(prev).add(root.id)
                          );
                        }}
                        placeholder={`Reply to ${root.user?.name || 'user'}`}
                        submitLabel="Reply"
                      />
                    </div>
                  )}
                  {children.length > 0 && (
                    <div className="ml-4">
                      <button
                        className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
                        onClick={() => toggleThread(root.id)}
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                        {expanded
                          ? 'Hide replies'
                          : `Show ${children.length} ${children.length === 1 ? 'reply' : 'replies'}`}
                      </button>
                      <div
                        className={`mt-2 space-y-2 border-neutral-800 border-l pl-3 transition-all duration-200 ${expanded ? 'max-h-[999px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                      >
                        {children.map((child: BountyCommentCacheItem) => (
                          <BountyComment
                            allowReply={false}
                            comment={child}
                            isOwner={Boolean(
                              child.user?.id &&
                                session?.user?.id &&
                                child.user?.id === session.user.id
                            )}
                            isRemoving={
                              (
                                child as unknown as BountyCommentCacheItem & {
                                  _removing: boolean;
                                }
                              )._removing
                            }
                            key={child.id}
                            onDelete={(id) => {
                              const key =
                                trpc.bounties.getBountyComments.queryKey({
                                  bountyId,
                                });
                              const previous =
                                queryClient.getQueryData<
                                  BountyCommentCacheItem[]
                                >(key) || [];
                              const next = previous.map((c) =>
                                c.id === id
                                  ? ({
                                      ...c,
                                      _removing: true,
                                    } as BountyCommentCacheItem)
                                  : c
                              );
                              queryClient.setQueryData(key, next);
                              onDeleteComment(id);
                            }}
                            onEdit={(id) =>
                              setEditState({
                                id,
                                initial:
                                  (child as BountyCommentCacheItem).content ||
                                  '',
                              })
                            }
                            onLike={likeComment}
                            parentRef={{
                              userName: root.user?.name || 'Anonymous',
                              snippet:
                                String(root.content).slice(0, 40) +
                                (String(root.content).length > 40 ? '…' : ''),
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {hasPages && (
        <div
          className="mt-4 flex items-center justify-end gap-2"
          ref={pagerRef}
        >
          <button
            className="rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300 text-xs disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300 text-xs disabled:opacity-50"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {hasPages && (
        <div
          aria-hidden={!showFloatingPager}
          className={`-translate-x-1/2 fixed bottom-6 left-1/2 z-30 rounded-full border border-neutral-800 bg-neutral-900/90 px-3.5 py-3 shadow backdrop-blur transition-all duration-200 ease-out ${showFloatingPager ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0'}`}
        >
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-1 text-[11px] text-neutral-300 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-[11px] text-neutral-400">
              {page} / {pages}
            </span>
            <button
              className="rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-1 text-[11px] text-neutral-300 disabled:opacity-50"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
