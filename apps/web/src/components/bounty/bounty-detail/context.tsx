"use client";

import { createContext } from "react";
import type { BountyCommentCacheItem } from "@/types/comments";

/**
 * Submission data type
 */
export interface SubmissionData {
	id: string;
	description: string | null;
	status: string;
	githubUsername: string | null;
	contributorName: string | null;
	contributorImage: string | null;
	githubPullRequestNumber: number | null;
	pullRequestUrl: string | null;
	deliverableUrl: string | null;
}

/**
 * Bounty Detail State
 *
 * Contains all the state data for the bounty detail page.
 */
export interface BountyDetailState {
	/** Bounty data */
	bounty: {
		id: string;
		title: string;
		amount: number;
		description: string;
		user: string;
		avatarSrc: string;
		createdById: string | undefined;
		paymentStatus: string | null | undefined;
		githubRepoOwner?: string | null;
		githubRepoName?: string | null;
		githubIssueNumber?: number | null;
		repositoryUrl?: string | null;
		issueUrl?: string | null;
	};
	/** Votes data */
	votes: {
		count: number;
		isVoted: boolean;
	} | null;
	/** Comments data */
	comments: BountyCommentCacheItem[] | undefined;
	/** Bookmarked status */
	bookmarked: boolean | undefined;
	/** Submissions data */
	submissions: SubmissionData[] | undefined;
	/** Submissions loading state */
	isSubmissionsLoading: boolean;
	/** Payment loading states */
	isPaymentStatusLoading: boolean;
	/** Is creator of the bounty */
	isCreator: boolean;
	/** Can edit the bounty */
	canEdit: boolean;
	/** Can delete the bounty */
	canDelete: boolean;
	/** Is bounty funded */
	isFunded: boolean;
	/** Is bounty unfunded */
	isUnfunded: boolean;
	/** Is bounty cancelled */
	isCancelled: boolean;
	/** Can request cancellation */
	canRequestCancellation: boolean;
	/** Has pending cancellation request */
	hasPendingCancellation: boolean;
	/** Needs payment to become active */
	needsPayment: boolean;
	/** Cancellation status query loading */
	isCancellationStatusLoading: boolean;
}

/**
 * Bounty Detail Actions
 *
 * Contains all the actions/mutations for the bounty detail page.
 */
export interface BountyDetailActions {
	/** Upvote the bounty */
	upvote: () => void;
	/** Delete the bounty */
	delete: () => void;
	/** Request cancellation with optional reason */
	requestCancellation: (reason?: string) => void;
	/** Cancel pending cancellation request */
	cancelCancellationRequest: () => void;
	/** Recheck payment status */
	recheckPayment: () => void;
	/** Complete payment (redirect to Stripe) */
	completePayment: () => void;
	/** Open edit modal */
	openEditModal: () => void;
	/** Share bounty */
	share: () => void;
}

/**
 * Bounty Detail Meta
 *
 * Contains metadata and computed values.
 */
export interface BountyDetailMeta {
	/** Bounty ID */
	bountyId: string;
	/** Mutation loading states */
	isDeleting: boolean;
	isRequestingCancellation: boolean;
	isCancellingCancellationRequest: boolean;
	isRecheckingPayment: boolean;
	isCreatingPayment: boolean;
}

/**
 * Bounty Detail Context Value
 *
 * Combines state, actions, and meta into a single interface.
 * This enables dependency injection - any provider implementing this
 * interface can be used with the compound components.
 */
export interface BountyDetailContextValue {
	state: BountyDetailState;
	actions: BountyDetailActions;
	meta: BountyDetailMeta;
}

/**
 * Bounty Detail Context
 *
 * Created with createContext for React 19+ compatibility.
 */
export const BountyDetailContext =
	createContext<BountyDetailContextValue | null>(null);
