"use client";

/**
 * BountyDetail Component
 *
 * Vercel composition patterns:
 * - Compound components with shared context
 * - State/actions/meta context interface
 * - Explicit components for each section
 *
 * @example
 * ```tsx
 * import { BountyDetail } from '@/components/bounty/bounty-detail';
 *
 * // Compound component API
 * <BountyDetail.Provider {...props}>
 *   <BountyDetail.Header />
 *   <BountyDetail.PaymentAlert />
 *   <BountyDetail.Content />
 *   <BountyDetail.Submissions />
 * </BountyDetail.Provider>
 *
 * // Or use the default export for convenience
 * import BountyDetailPage from '@/components/bounty/bounty-detail';
 * <BountyDetailPage bountyId={id} bountyData={data} canEdit={canEdit} />
 * ```
 *
 * @module
 */

import { BountyDetailProvider } from "./bounty-detail/provider";
import { BountyDetailHeader } from "./bounty-detail/header";
import { BountyDetailContent } from "./bounty-detail/content";
import { BountyDetailSubmissions } from "./bounty-detail/submissions";
import { BountyDetailPaymentAlert } from "./bounty-detail/payment-alert";
import type { BountyCommentCacheItem } from "@/types/comments";

interface BountyData {
	bounty: {
		id: string;
		title: string;
		description: string;
		amount: number;
		paymentStatus: string | null;
		status: string;
		createdById: string;
		githubRepoOwner: string | null;
		githubRepoName: string | null;
		githubIssueNumber: number | null;
		repositoryUrl: string | null;
		issueUrl: string | null;
		creator: {
			name: string | null;
			image: string | null;
		};
	};
	comments: BountyCommentCacheItem[];
	votes: {
		count: number;
		isVoted: boolean;
	};
	bookmarked: boolean;
}

interface BountyDetailPageProps {
	bountyId: string;
	bountyData: BountyData;
	canEdit?: boolean;
}

/**
 * BountyDetailPage default export - convenience wrapper for the compound component.
 * Renders all sections with proper state management.
 *
 * Takes a BountyData object and extracts what it needs internally.
 */
export default function BountyDetailPage({
	bountyId,
	bountyData,
	canEdit = false,
}: BountyDetailPageProps) {
	const { bounty, votes, bookmarked } = bountyData;

	// Comments are not currently used
	// const { comments } = bountyData;
	// const initialComments = comments.map((comment) => ({
	//   ...comment,
	//   likeCount: typeof comment.likeCount === 'number' ? comment.likeCount : 0,
	// }));

	// Ensure amount is a valid number (default to 0 if undefined)
	const amount = typeof bounty.amount === "number" ? bounty.amount : 0;

	return (
		<BountyDetailProvider
			bountyId={bountyId}
			initialBookmarked={bookmarked}
			title={bounty.title ?? "Untitled Bounty"}
			amount={amount}
			description={bounty.description ?? ""}
			user={bounty.creator.name ?? ""}
			avatarSrc={bounty.creator.image ?? ""}
			paymentStatus={bounty.paymentStatus}
			createdById={bounty.createdById}
			githubRepoOwner={bounty.githubRepoOwner}
			githubRepoName={bounty.githubRepoName}
			githubIssueNumber={bounty.githubIssueNumber}
			repositoryUrl={bounty.repositoryUrl}
			issueUrl={bounty.issueUrl}
			initialVotes={votes}
			canEditBounty={canEdit}
		>
			<BountyDetailHeader />
			<BountyDetailPaymentAlert />
			<BountyDetailContent />
			<BountyDetailSubmissions />
		</BountyDetailProvider>
	);
}

export type { BountyData };
