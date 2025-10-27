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
	commentCount?: number;
	voteCount?: number;
	isVoted?: boolean;
	bookmarked?: boolean;
}

export type BountyStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export type BountyDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface FetchBountiesParams {
	page?: number;
	limit?: number;
	status?: BountyStatus;
	difficulty?: BountyDifficulty;
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

export interface WebviewMessage {
	type: string;
	value?: string;
	params?: FetchBountiesParams;
	bounties?: Bounty[];
	bountyDetail?: BountyDetail;
	bountyId?: string;
	commentId?: string;
	message?: string;
	voted?: boolean;
	bookmarked?: boolean;
	liked?: boolean;
	count?: number;
}
