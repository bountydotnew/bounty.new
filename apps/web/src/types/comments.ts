// interface BountyCommentItem {
//   id: string;
//   content: string;
//   originalContent?: string | null;
//   parentId: string | null;
//   createdAt: string;
//   editCount: number;
//   user: CommentUser;
//   likeCount: number;
//   isLiked: boolean;
// }

// interface EditState {
//   id: string;
//   initial: string;
// }

// interface VoteInfo {
//   count: number;
//   isVoted: boolean;
// }

export interface BountyCommentCacheItem {
  id: string;
  createdAt: string | Date;
  user: { id: string; name: string | null; image: string | null } | null;
  parentId: string | null;
  content: string;
  originalContent: string | null;
  editCount: number;
  likeCount: number;
  isLiked: boolean;
  _removing?: boolean;
}

// interface DuplicateCommentError {
//   code: 'DUPLICATE_COMMENT';
//   message: string;
// }
