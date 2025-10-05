import type { Bounty, FetchBountiesParams } from '../types';
import { DEFAULT_FETCH_PARAMS, API_CONFIG } from '../constants';

export class BountyService {
	constructor(private getAuthHeaders: () => Promise<Record<string, string>>) {}

	private async fetchTRPC(endpoint: string, input: unknown): Promise<any> {
		const url = `${API_CONFIG.baseUrl}/${endpoint}?input=${encodeURIComponent(JSON.stringify(input))}`;
		const authHeaders = await this.getAuthHeaders();
		
		console.log('[BountyService] Fetching TRPC:', JSON.stringify({
			url,
			endpoint,
			input,
			authHeaders,
			hasAuthToken: Boolean(authHeaders.Authorization),
		}));
		
		const response = await fetch(url, {
			headers: {
				...API_CONFIG.headers,
				...authHeaders,
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[BountyService] TRPC request failed:', JSON.stringify({
				status: response.status,
				statusText: response.statusText,
				url,
				errorBody: errorText,
				requestHeaders: { ...API_CONFIG.headers, ...authHeaders },
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

			return response?.data || [];
		} catch (error) {
			console.error('[BountyService] Error fetching bounties:', error);
			throw new Error(
				error instanceof Error ? error.message : 'Failed to fetch bounties'
			);
		}
	}

	async fetchBountyById(id: string): Promise<Bounty | null> {
		try {
			const response = await this.fetchTRPC('bounties.getBountyDetail', { id });
			return response?.data || null;
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
}
