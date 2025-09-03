"use client";

import { ArrowUpCircle, Bookmark, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BountyActionsProps {
  bountyId: string;
  canEdit: boolean;
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export default function BountyActions({ bountyId, canEdit, isVoted, voteCount, onUpvote, onEdit, onShare }: BountyActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={onUpvote}
        aria-pressed={isVoted}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A28] hover:bg-[#383838] text-gray-200 transition-colors ${isVoted ? "border border-[#1D1D1D] bg-[#383838] text-neutral-200" : ""}`}
      >
        <ArrowUpCircle className={`w-4 h-4 ${isVoted ? "fill-green-400 stroke-black" : ""}`} />
        <span>{voteCount}</span>
      </Button>
      {canEdit && (
        <Button
          variant="default"
          size="sm"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      )}
      <Button
        variant="default"
        onClick={onShare}
        size="sm"
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A28] hover:bg-[#383838] text-gray-200 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
      <Button
        variant="default"
        size="sm"
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-gray-100 text-black transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Bookmark
      </Button>
    </div>
  );
}
