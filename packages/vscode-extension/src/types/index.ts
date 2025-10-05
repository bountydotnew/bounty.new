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

export interface WebviewMessage {
	type: string;
	value?: string;
	params?: unknown;
	bounties?: Bounty[];
	message?: string;
}
