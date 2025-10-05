import type { trpcClient } from '../trpc';

export type Bounty = Awaited<
	ReturnType<typeof trpcClient.bounties.fetchAllBounties.query>
>['data'][number];

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
	params?: unknown;
	bounties?: Bounty[];
	bountyDetail?: BountyDetail;
	bountyId?: string;
	message?: string;
}
