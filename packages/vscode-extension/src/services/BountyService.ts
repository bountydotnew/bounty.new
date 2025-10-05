import type { Bounty, BountyDetail, FetchBountiesParams } from '../types';
import { DEFAULT_FETCH_PARAMS, API_CONFIG } from '../constants';

export class BountyService {
	constructor(private getAuthHeaders: () => Promise<Record<string, string>>) {}

	private async fetchTRPC(endpoint: string, input: unknown, mutation = false): Promise<any> {
		const authHeaders = await this.getAuthHeaders();
		
		let url: string;
		let fetchOptions: RequestInit;

		if (mutation) {
			// For mutations, use POST with body
			url = `${API_CONFIG.baseUrl}/${endpoint}`;
			fetchOptions = {
				method: 'POST',
				headers: {
					...API_CONFIG.headers,
					...authHeaders,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(input),
			};
		} else {
			// For queries, use GET with URL params
			url = `${API_CONFIG.baseUrl}/${endpoint}?input=${encodeURIComponent(JSON.stringify(input))}`;
			fetchOptions = {
				headers: {
					...API_CONFIG.headers,
					...authHeaders,
				},
			};
		}
		
		console.log('[BountyService] Fetching TRPC:', JSON.stringify({
			url,
			endpoint,
			input,
			mutation,
			method: mutation ? 'POST' : 'GET',
			hasAuthToken: Boolean(authHeaders.Authorization),
		}));
		
		const response = await fetch(url, fetchOptions);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[BountyService] TRPC request failed:', JSON.stringify({
				status: response.status,
				statusText: response.statusText,
				url,
				errorBody: errorText,
				requestHeaders: fetchOptions.headers,
			}));
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		return data.result?.data;
	}

	async fetchBounties(params: FetchBountiesParams = {}): Promise<Bounty[]> {
		try {
			const response = await this.fetchTRPC('bounties.fetchAllBounties', {
				page: params.page ?? DEFAULT_FETCH_PARAMS.page,
				limit: params.limit ?? DEFAULT_FETCH_PARAMS.limit,
				...(params.status && { status: params.status }),
				...(params.difficulty && { difficulty: params.difficulty }),
			});

			const bounties = response?.data || [];

			// Fetch engagement stats for all bounties
			if (bounties.length > 0) {
				try {
					const bountyIds = bounties.map((b: Bounty) => b.id);
					console.log('[BountyService] Fetching stats for bounties:', bountyIds);
					
					const statsResponse = await this.fetchTRPC('bounties.getBountyStatsMany', {
						bountyIds,
					});

					console.log('[BountyService] Stats response:', JSON.stringify(statsResponse));
					const stats = statsResponse?.stats || [];
					
					// Merge stats into bounties
					const bountiesWithStats = bounties.map((bounty: Bounty) => {
						const stat = stats.find((s: any) => s.bountyId === bounty.id);
						return {
							...bounty,
							commentCount: stat?.commentCount ?? 0,
							voteCount: stat?.voteCount ?? 0,
							isVoted: stat?.isVoted ?? false,
							bookmarked: stat?.bookmarked ?? false,
						};
					});
					
					console.log('[BountyService] Bounties with stats:', JSON.stringify(bountiesWithStats.map(b => ({
						id: b.id,
						title: b.title,
						commentCount: b.commentCount,
						voteCount: b.voteCount
					}))));
					
					return bountiesWithStats;
				} catch (statsError) {
					console.error('[BountyService] Error fetching stats:', statsError);
					// Return bounties without stats if stats fetch fails
					return bounties;
				}
			}

			return bounties;
		} catch (error) {
			console.error('[BountyService] Error fetching bounties:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to fetch bounties'
			);
		}
	}

	async fetchBountyById(id: string): Promise<BountyDetail | null> {
		try {
			const response = await this.fetchTRPC('bounties.getBountyDetail', { id });
			return response || null;
		} catch (error) {
			console.error('[BountyService] Error fetching bounty by ID:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to fetch bounty'
			);
		}
	}

	async getBountyStats() {
		try {
			return await this.fetchTRPC('bounties.getBountyStats', {});
		} catch (error) {
			console.error('[BountyService] Error fetching bounty stats:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to fetch bounty stats'
			);
		}
	}

	async toggleBountyVote(bountyId: string): Promise<{ voted: boolean; count: number }> {
		try {
			const response = await this.fetchTRPC('bounties.voteBounty', { bountyId }, true);
			return response;
		} catch (error) {
			console.error('[BountyService] Error toggling vote:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to toggle vote'
			);
		}
	}

	async toggleBountyBookmark(bountyId: string): Promise<{ bookmarked: boolean }> {
		try {
			const response = await this.fetchTRPC('bounties.toggleBountyBookmark', { bountyId }, true);
			return response;
		} catch (error) {
			console.error('[BountyService] Error toggling bookmark:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to toggle bookmark'
			);
		}
	}

	async toggleCommentLike(commentId: string): Promise<{ liked: boolean; count: number }> {
		try {
			const response = await this.fetchTRPC('bounties.toggleCommentLike', { commentId }, true);
			return response;
		} catch (error) {
			console.error('[BountyService] Error toggling comment like:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to toggle comment like'
			);
		}
	}
}
