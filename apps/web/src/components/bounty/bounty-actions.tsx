"use client";

import { ArrowUpCircle, Bookmark, Edit, MoreHorizontal, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface BountyActionsProps {
  bountyId: string;
  canEdit: boolean;
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  onEdit: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export default function BountyActions({ bountyId, canEdit, isVoted, voteCount, onUpvote, onEdit, onShare, onBookmark }: BountyActionsProps) {
  const handleShare = () => {
    if (onShare) return onShare();
    try {
      if (typeof window !== "undefined" && navigator.share) navigator.share({ url: window.location.href });
    } catch {}
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-md border border-neutral-700 bg-neutral-800/40 p-1 text-neutral-300 hover:bg-neutral-700/40"
          aria-label="Open bounty actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-10 w-44 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
        <DropdownMenuItem
          className={`text-neutral-200 hover:bg-neutral-800 ${isVoted ? "bg-neutral-800/50" : ""}`}
          onClick={onUpvote}
          aria-pressed={isVoted}
        >
          <ArrowUpCircle className={`h-3.5 w-3.5 ${isVoted ? "text-neutral-200 fill-neutral-200 stroke-black" : ""}`} />
          Upvote
          <span className="ml-auto text-neutral-500">{voteCount}</span>
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem className="text-neutral-200 hover:bg-neutral-800" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="text-neutral-200 hover:bg-neutral-800" onClick={handleShare}>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem className="text-neutral-200 hover:bg-neutral-800" onClick={onBookmark}>
          <Bookmark className="h-3.5 w-3.5" />
          Bookmark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
