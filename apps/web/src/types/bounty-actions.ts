import type { ReactNode } from 'react';

export interface ActionItem {
  key: string;
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface BountyActionsProps {
  bountyId: string;
  canEdit: boolean;
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  onEdit: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  actions?: ActionItem[];
}

export interface UpvoteButtonProps {
  isVoted: boolean;
  voteCount: number;
  onUpvote: () => void;
  className?: string;
}

export interface ActionsDropdownProps {
  onShare?: () => void;
  onBookmark?: () => void;
  actions?: ActionItem[];
  ariaLabel?: string;
  bookmarked?: boolean;
}
