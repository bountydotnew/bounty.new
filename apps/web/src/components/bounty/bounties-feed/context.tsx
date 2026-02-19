import { createContext } from "react";
import type { Bounty } from "@/types/dashboard";

/**
 * BountiesFeed State Interface
 * Contains all data needed by child components
 */
export interface BountiesFeedState {
	/** The list of bounties to display */
	bounties: Bounty[];
	/** Loading state */
	isLoading: boolean;
	/** Error state */
	isError: boolean;
	/** Error object if present */
	error: Error | null;
	/** Stats map for each bounty (comments, votes, submissions, bookmarked) */
	statsMap: Map<
		string,
		{
			commentCount: number;
			voteCount: number;
			submissionCount: number;
			isVoted: boolean;
			bookmarked: boolean;
		}
	>;
	/** Optional title to display */
	title?: string;
}

/**
 * BountiesFeed Actions Interface
 * Contains all actions that can be performed
 */
export interface BountiesFeedActions {
	/** Delete a bounty */
	deleteBounty: (bountyId: string) => void;
}

/**
 * BountiesFeed Meta Interface
 * Contains metadata and configuration
 */
export interface BountiesFeedMeta {
	/** CSS class name to apply */
	className?: string;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface BountiesFeedContextValue {
	state: BountiesFeedState;
	actions: BountiesFeedActions;
	meta: BountiesFeedMeta;
}

/**
 * Context for BountiesFeed compound components
 * Null means we're outside the provider
 */
export const BountiesFeedContext =
	createContext<BountiesFeedContextValue | null>(null);
