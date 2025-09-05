'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageSquareReply,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import type { BountyCommentCacheItem } from '@/types/comments';

interface BountyCommentProps {
  comment: BountyCommentCacheItem;
  isOwner: boolean;
  onLike: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply?: (id: string) => void;
  allowReply?: boolean;
  parentRef?: { userName: string; snippet: string } | null;
  isRemoving?: boolean;
}

export default function BountyComment({
  comment,
  isOwner,
  onLike,
  onEdit,
  onDelete,
  onReply,
  allowReply = false,
  parentRef,
  isRemoving = false,
}: BountyCommentProps) {
  const edits = Number(comment.editCount || 0);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={`overflow-x-hidden rounded-md border border-neutral-800 bg-[#222222] p-3 transition-all duration-200 will-change-transform ${entered && !isRemoving ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'} ${isRemoving ? '-translate-y-1 opacity-0' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.user?.image || ''} />
          <AvatarFallback>{comment.user?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <span className="text-neutral-300 text-xs">
          {comment.user?.name || 'Anonymous'}
        </span>
        <span className="text-neutral-600 text-xs">•</span>
        <span className="text-neutral-500 text-xs">
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </span>
        {edits > 0 && (
          <span className="rounded-md bg-neutral-800 px-1 py-0.5 text-[10px] text-neutral-500">
            edited
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Like comment"
            aria-pressed={Boolean(comment.isLiked)}
            className={`flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700/40 ${comment.isLiked ? 'bg-neutral-700/40' : ''}`}
            onClick={() => onLike(comment.id)}
          >
            <Heart
              className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-red-400 stroke-black text-red-400' : ''}`}
            />
            <span>{comment.likeCount || 0}</span>
          </button>
          {allowReply && onReply && (
            <div className="hidden sm:block">
              <button
                aria-label="Reply to comment"
                className="flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700/40"
                onClick={() => onReply(comment.id)}
              >
                <MessageSquareReply className="h-3.5 w-3.5" />
                Reply
              </button>
            </div>
          )}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-6 rounded-lg border border-neutral-700 bg-[#222222] p-1 text-neutral-300 hover:bg-neutral-700/40"
                  size="icon"
                  variant="outline"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-10 w-40 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
                {allowReply && onReply && (
                  <DropdownMenuItem
                    className="text-neutral-200 hover:bg-neutral-800 sm:hidden"
                    onClick={() => onReply(comment.id)}
                  >
                    <MessageSquareReply className="h-3.5 w-3.5" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className={`${edits >= 1 ? 'cursor-not-allowed text-neutral-500' : 'text-neutral-200 hover:bg-neutral-800'}`}
                  disabled={edits >= 1}
                  onClick={() => {
                    if (edits >= 1) {
                      return;
                    }
                    onEdit(comment.id);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit {edits >= 1 ? '(0 left)' : '(1 left)'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 hover:bg-red-950/40"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {parentRef && (
        <div className="mb-1 text-[11px] text-neutral-500">
          replying to{' '}
          <span className="text-neutral-300">{parentRef.userName}</span>:{' '}
          {parentRef.snippet}
        </div>
      )}
      <div className="whitespace-pre-wrap text-wrap break-normal text-neutral-200 text-sm">
        {comment.content}
      </div>
    </div>
  );
}
