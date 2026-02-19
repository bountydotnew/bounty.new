"use client";

import { use } from "react";
import { formatLargeNumber } from "@bounty/ui/lib/utils";
import {
	Avatar,
	AvatarFacehash,
	AvatarImage,
} from "@bounty/ui/components/avatar";
import BountyActions from "@/components/bounty/bounty-actions";
import { AlertTriangle, X } from "lucide-react";
import type { ActionItem } from "@/types/bounty-actions";
import { BountyDetailContext } from "./context";

/**
 * BountyDetailHeader
 *
 * Displays the bounty title, amount, creator info, and action buttons.
 * Uses the BountyDetailContext to access state and actions.
 */
export function BountyDetailHeader() {
	const context = use(BountyDetailContext);
	if (!context) {
		throw new Error(
			"BountyDetailHeader must be used within BountyDetailProvider",
		);
	}

	const { state, actions, meta } = context;

	const {
		bounty: { title, amount, user, avatarSrc, repositoryUrl, issueUrl },
		votes,
		bookmarked,
		isCreator,
		canEdit,
		canDelete,
		canRequestCancellation,
		hasPendingCancellation,
		isCancelled,
	} = state;

	// Build cancellation action items
	const cancellationActions: ActionItem[] =
		canRequestCancellation && !isCancelled
			? [
					hasPendingCancellation
						? ({
								key: "cancel-cancellation-request",
								label: "Cancel cancellation request",
								onSelect: actions.cancelCancellationRequest,
								icon: <X className="h-3.5 w-3.5" />,
								disabled: meta.isCancellingCancellationRequest,
								className:
									"text-green-500 hover:bg-green-500/10 focus:bg-green-500/10",
							} satisfies ActionItem)
						: ({
								key: "request-cancellation",
								label: "Request cancellation",
								onSelect: () => actions.requestCancellation(),
								icon: <AlertTriangle className="h-3.5 w-3.5" />,
								disabled: meta.isRequestingCancellation,
								className:
									"text-yellow-500 hover:bg-yellow-500/10 focus:bg-yellow-500/10",
							} satisfies ActionItem),
				]
			: [];

	return (
		<div className="mb-8">
			{/* Title */}
			<h1 className="font-bold text-3xl md:text-4xl text-foreground leading-[120%] tracking-tight mb-4">
				{title}
			</h1>

			{/* User Profile Row */}
			<div className="flex items-center gap-2.5 mb-4">
				<Avatar className="h-6 w-6">
					<AvatarImage src={avatarSrc} />
					<AvatarFacehash name={user} size={24} />
				</Avatar>
				<span className="font-medium text-base text-text-secondary">
					{user}
				</span>
			</div>

			{/* Amount and Actions Row */}
			<div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<span className="font-semibold text-2xl text-brand-accent">
					${formatLargeNumber(amount)}
				</span>

				<div className="flex items-center gap-2">
					<BountyActions
						bookmarked={bookmarked}
						bountyId={state.bounty.id}
						canDelete={canDelete}
						canEdit={canEdit}
						isOwner={isCreator}
						isVoted={Boolean(votes?.isVoted)}
						onDelete={canDelete ? actions.delete : undefined}
						onEdit={actions.openEditModal}
						onShare={actions.share}
						onUpvote={actions.upvote}
						repositoryUrl={repositoryUrl}
						issueUrl={issueUrl}
						voteCount={votes?.count ?? 0}
						actions={
							cancellationActions.length > 0 ? cancellationActions : undefined
						}
					/>
				</div>
			</div>
		</div>
	);
}
