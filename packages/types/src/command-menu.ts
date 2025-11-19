export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface BountyCommandItemBounty {
  id: string;
  title: string;
  amount: number | string;
  creator?: {
    image?: string | null;
  } | null;
}

export interface BountyCommandItemProps {
  bounty: BountyCommandItemBounty;
  commentCount: number;
  isLoading: boolean;
  onSelect: (value: string) => void;
}
