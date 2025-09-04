"use client";

import { ArrowUpIcon, Bookmark, Edit, MoreHorizontal, Share2 } from "lucide-react";
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
  actions?: ActionItem[];
}

interface UpvoteButtonProps {
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  className?: string;
}

export type ActionItem = {
  key: string;
  label: string;
  onSelect: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
};

interface ActionsDropdownProps {
  onShare?: () => void;
  onBookmark?: () => void;
  actions?: ActionItem[];
  ariaLabel?: string;
}

export function UpvoteButton({ isVoted, voteCount, onUpvote, className }: UpvoteButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onUpvote();
      }}
      aria-pressed={isVoted}
      aria-label="Upvote bounty"
      className={`flex items-center gap-1 rounded-md px-2 py-1 border border-neutral-700 bg-neutral-800/40 text-xs text-neutral-300 hover:bg-neutral-700/40 ${isVoted ? "border-neutral-700/40 bg-[#343333] text-white" : ""} ${className ?? ""}`}
    >
      <ArrowUpIcon className={`h-4 w-4 ${isVoted ? "text-white" : ""}`} />
      <span>{voteCount}</span>
    </button>
  );
}

export function ActionsDropdown({ onShare, onBookmark, actions, ariaLabel }: ActionsDropdownProps) {
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
          aria-label={ariaLabel ?? "Open actions"}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-10 w-44 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
        {actions?.map((action) => (
          <DropdownMenuItem
            key={action.key}
            className="text-neutral-200 hover:bg-neutral-800"
            onClick={action.onSelect}
            disabled={action.disabled}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
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

export default function BountyActions({ bountyId, canEdit, isVoted, voteCount, onUpvote, onEdit, onShare, onBookmark, actions }: BountyActionsProps) {
  const baseActions: ActionItem[] = canEdit
    ? [{ key: "edit", label: "Edit", onSelect: onEdit, icon: <Edit className="h-3.5 w-3.5" /> }]
    : [];
  const mergedActions = [...baseActions, ...(actions ?? [])];
  return (
    <div className="flex items-center gap-2">
      <UpvoteButton isVoted={isVoted} voteCount={voteCount} onUpvote={onUpvote} />
      <ActionsDropdown onShare={onShare} onBookmark={onBookmark} actions={mergedActions} ariaLabel="Open bounty actions" />
    </div>
  );
}
