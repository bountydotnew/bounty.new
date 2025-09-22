export interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

export interface BountyCommentItem {
  id: string;
  content: string;
  originalContent?: string | null;
  parentId: string | null;
  createdAt: string;
  editCount: number;
  user: CommentUser;
  likeCount: number;
  isLiked: boolean;
}

export interface EditState {
  id: string;
  initial: string;
}

export interface VoteInfo {
  count: number;
  isVoted: boolean;
}

export interface BountyCommentCacheItem {
  id: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null } | null;
  parentId: string | null;
  content: string;
  originalContent: string | null;
  editCount: number;
  likeCount: number;
  isLiked: boolean;
  _removing?: boolean;
}

export interface DuplicateCommentError {
  code: 'DUPLICATE_COMMENT';
  message: string;
}
