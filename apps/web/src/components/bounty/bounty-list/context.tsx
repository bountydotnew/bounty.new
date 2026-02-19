"use client";

import { createContext } from "react";
import type { Bounty } from "@/types/dashboard";

/**
 * Sort options for the bounty list
 */
export type SortByOption = "created_at" | "amount" | "deadline" | "title";
export type SortOrderOption = "asc" | "desc";

/**
 * Bounty List State
 *
 * Contains all the state data for the bounty list page.
 */
export interface BountyListState {
	/** Bounties data */
	bounties: Bounty[];
	/** Loading state */
	isLoading: boolean;
	/** Error state */
	error: Error | null;
	/** Filter state */
	filters: {
		search: string | null;
		creatorId: string | null;
		sortBy: SortByOption;
		sortOrder: SortOrderOption;
	};
}

/**
 * Bounty List Actions
 *
 * Contains all the actions for the bounty list page.
 */
export interface BountyListActions {
	/** Set the search query */
	setSearch: (search: string | null) => void;
	/** Set the creator ID filter */
	setCreatorId: (creatorId: string | null) => void;
	/** Set the sort by option */
	setSortBy: (sortBy: SortByOption) => void;
	/** Set the sort order */
	setSortOrder: (sortOrder: SortOrderOption) => void;
	/** Reset all filters to defaults */
	resetFilters: () => void;
	/** Invalidate and refetch bounties */
	refetch: () => void;
}

/**
 * Bounty List Meta
 *
 * Contains metadata.
 */
export interface BountyListMeta {
	/** Total count of bounties */
	totalCount: number;
}

/**
 * Bounty List Context Value
 *
 * Combines state, actions, and meta into a single interface.
 */
export interface BountyListContextValue {
	state: BountyListState;
	actions: BountyListActions;
	meta: BountyListMeta;
}

/**
 * Bounty List Context
 *
 * Created with createContext for React 19+ compatibility.
 */
export const BountyListContext = createContext<BountyListContextValue | null>(
	null,
);
