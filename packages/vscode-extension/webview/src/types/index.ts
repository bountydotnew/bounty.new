export interface Bounty {
  id: string;
  title: string;
  description: string | null;
  status: BountyStatus;
  difficulty: BountyDifficulty;
  amount: number | null;
  currency: string | null;
  deadline: Date | string | null;
  tags: string[] | null;
  repositoryUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  creator: {
    id: string;
    name: string | null;
    image: string | null;
  };
  // Engagement stats
  commentCount?: number;
  voteCount?: number;
  isVoted?: boolean;
  bookmarked?: boolean;
}

export type BountyStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
export type BountyDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export interface FetchBountiesParams {
  page?: number;
  limit?: number;
  status?: BountyStatus;
  difficulty?: BountyDifficulty;
}

export interface WebviewMessage {
  type: MessageType;
  value?: string;
  params?: FetchBountiesParams;
  bounties?: Bounty[];
  bountyDetail?: BountyDetail;
  message?: string;
  bountyId?: string;
  commentId?: string;
  voted?: boolean;
  bookmarked?: boolean;
  liked?: boolean;
  count?: number;
}

export interface BountyDetail {
  bounty: Bounty;
  votes: {
    count: number;
    isVoted: boolean;
  };
  bookmarked: boolean;
  comments: Array<{
    id: string;
    content: string;
    originalContent: string | null;
    parentId: string | null;
    createdAt: Date | string;
    editCount: number;
    likeCount: number;
    isLiked: boolean;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
}

export type MessageType =
  | 'login'
  | 'logout'
  | 'fetchBounties'
  | 'fetchBountyDetail'
  | 'toggleVote'
  | 'toggleBookmark'
  | 'toggleCommentLike'
  | 'openBounty'
  | 'refresh'
  | 'loginStarted'
  | 'loginError'
  | 'bountiesLoaded'
  | 'bountyDetailLoaded'
  | 'voteToggled'
  | 'bookmarkToggled'
  | 'commentLikeToggled'
  | 'error';

export interface VSCode {
  postMessage(message: WebviewMessage): void;
  getState(): any;
  setState(state: any): void;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VSCode;
  }
}
