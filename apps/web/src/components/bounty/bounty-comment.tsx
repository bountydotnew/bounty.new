"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BountyCommentCacheItem } from "@/types/comments";
import { formatRelativeTime } from "@/lib/utils";

interface BountyCommentProps {
    comment: BountyCommentCacheItem;
    isOwner: boolean;
    onLike: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function BountyComment({ comment, isOwner, onLike, onEdit, onDelete }: BountyCommentProps) {
    const edits = Number(comment.editCount || 0);
    return (
        <div className="rounded-md border border-neutral-800 bg-neutral-900/30 p-3">
            <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.user?.image || ""} />
                    <AvatarFallback>{comment.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-neutral-300">{comment.user?.name || "Anonymous"}</span>
                <span className="text-xs text-neutral-600">•</span>
                <span className="text-xs text-neutral-500">{formatRelativeTime(comment.createdAt)}</span>
                {edits > 0 && <span className="bg-neutral-800 rounded-md px-1 py-0.5 text-[10px] text-neutral-500">edited</span>}
                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={() => onLike(comment.id)}
                        aria-pressed={Boolean(comment.isLiked)}
                        className={`flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700/40 ${comment.isLiked ? "bg-neutral-700/40" : ""}`}
                        aria-label="Like comment"
                    >
                        <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? "text-red-400 fill-red-400 stroke-black" : ""}`} />
                        <span>{comment.likeCount || 0}</span>
                    </button>
                    {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-md border border-neutral-700 bg-neutral-800/40 p-1 text-neutral-300 hover:bg-neutral-700/40"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="z-10 w-40 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
                                <DropdownMenuItem
                                    className={`${edits >= 1 ? "text-neutral-500 cursor-not-allowed" : "text-neutral-200 hover:bg-neutral-800"}`}
                                    disabled={edits >= 1}
                                    onClick={() => {
                                        if (edits >= 1) return;
                                        onEdit(comment.id);
                                    }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit {edits >= 1 ? "(0 left)" : "(1 left)"}
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
            <div className="text-sm text-neutral-200 whitespace-pre-wrap">{comment.content}</div>
        </div>
    );
}
