"use client";

import { useMemo, type ReactNode, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/context/session-context";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { trpc, trpcClient } from "@/utils/trpc";
import {
	BountyCardContext,
	type BountyCardContextValue,
	type BountyCardState,
	type BountyCardActions,
	type BountyCardMeta,
} from "./context";
import type { Bounty } from "@/types/dashboard";
import { addNavigationContext } from "@bounty/ui/hooks/use-navigation-context";

const GITHUB_REPO_REGEX = /github\.com\/([^/]+\/[^/]+)/i;
const GITHUB_ISSUE_REGEX = /github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/i;

function useBountyCardQueries(bounty: Bounty, userId: string | undefined) {
	const isOwner = userId ? bounty.creator.id === userId : false;
	const isFunded =
		bounty.paymentStatus === "held" || bounty.paymentStatus === "released";
	const isCancelled = bounty.status === "cancelled";
	const isRefunded = bounty.paymentStatus === "refunded";
	const canPin = userId ? bounty.creator.id === userId : false;
	const canRequestCancellation = isOwner && isFunded;

	const cancellationStatusQuery = useQuery({
		...trpc.bounties.getCancellationStatus.queryOptions({
			bountyId: bounty.id,
		}),
		enabled: canRequestCancellation,
	});

	const hasPendingCancellation =
		cancellationStatusQuery.data?.hasPendingRequest ?? false;

	const canDelete =
		isOwner &&
		(!isFunded || hasPendingCancellation || isCancelled || isRefunded);

	return {
		isOwner,
		isFunded,
		isCancelled,
		isRefunded,
		canPin,
		canRequestCancellation,
		hasPendingCancellation,
		canDelete,
	};
}

function useBountyCardMutations(
	bounty: Bounty,
	canDelete: boolean,
	canRequestCancellation: boolean,
	hasPendingCancellation: boolean,
	onDelete: (() => void) | undefined,
	setShowDeleteDialog: (show: boolean) => void,
	setShowCancellationDialog: (show: boolean) => void,
	setCancellationReason: (reason: string) => void,
	cancellationReason: string,
) {
	const queryClient = useQueryClient();

	const togglePinMutation = useMutation({
		mutationFn: async (input: { bountyId: string }) => {
			return await trpcClient.bounties.toggleBountyPin.mutate(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [["bounties", "getHighlights"]],
			});
			queryClient.invalidateQueries({
				queryKey: [["bounties", "getBountiesByUserId"]],
			});
			queryClient.invalidateQueries({
				queryKey: [["bounties", "getBounties"]],
			});
		},
	});

	const isBountyQuery = (query: { queryKey: unknown }) => {
		const key = query.queryKey;
		if (Array.isArray(key) && key.length > 0) {
			const first = key[0];
			if (Array.isArray(first) && first.length > 0 && first[0] === "bounties") {
				return true;
			}
		}
		return false;
	};

	const deleteBountyMutation = useMutation({
		mutationFn: async () => {
			return await trpcClient.bounties.deleteBounty.mutate({ id: bounty.id });
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ predicate: isBountyQuery });

			const previousData = new Map<unknown, unknown>();

			const queries = queryClient.getQueriesData({ predicate: isBountyQuery });
			for (const [queryKey, data] of queries) {
				previousData.set(queryKey, data);
			}

			queryClient.setQueriesData(
				{ predicate: isBountyQuery },
				(oldData: unknown) => {
					if (!oldData) {
						return oldData;
					}

					if (
						typeof oldData === "object" &&
						oldData !== null &&
						"data" in oldData &&
						Array.isArray((oldData as { data: unknown }).data)
					) {
						const response = oldData as {
							success?: boolean;
							data: { id: string }[];
							pagination?: { total?: number };
						};
						const filtered = response.data.filter((b) => b.id !== bounty.id);
						return {
							...response,
							data: filtered,
							pagination: response.pagination
								? {
										...response.pagination,
										total: Math.max(0, (response.pagination.total ?? 0) - 1),
									}
								: undefined,
						};
					}

					if (Array.isArray(oldData)) {
						return oldData.filter((b: { id?: string }) => b?.id !== bounty.id);
					}

					if (
						typeof oldData === "object" &&
						oldData !== null &&
						"id" in oldData
					) {
						const data = oldData as { id: string };
						if (data.id === bounty.id) {
							return null;
						}
					}

					return oldData;
				},
			);

			setShowDeleteDialog(false);

			return { previousData };
		},
		onSuccess: () => {
			toast.success("Bounty deleted");

			if (
				typeof window !== "undefined" &&
				window.location.pathname.includes("/bounty/")
			) {
				setTimeout(() => {
					window.location.href = "/dashboard";
				}, 500);
			}
		},
		onError: (error: Error, _variables, context) => {
			toast.error(`Failed to delete bounty: ${error.message}`);
			if (context?.previousData) {
				for (const [queryKey, data] of context.previousData) {
					queryClient.setQueryData(queryKey as unknown[], data);
				}
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ predicate: isBountyQuery });
		},
	});

	const requestCancellationMutation = useMutation({
		mutationFn: async (input: { bountyId: string; reason?: string }) => {
			return await trpcClient.bounties.requestCancellation.mutate(input);
		},
		onSuccess: (result) => {
			toast.success(result.message || "Cancellation request submitted");
			setShowCancellationDialog(false);
			setCancellationReason("");
			queryClient.invalidateQueries({
				queryKey: [["bounties", "getCancellationStatus"]],
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to request cancellation: ${error.message}`);
		},
	});

	const cancelCancellationRequestMutation = useMutation({
		mutationFn: async (input: { bountyId: string }) => {
			return await trpcClient.bounties.cancelCancellationRequest.mutate(input);
		},
		onSuccess: (result) => {
			toast.success(result.message || "Cancellation request withdrawn");
			queryClient.invalidateQueries({
				queryKey: [["bounties", "getCancellationStatus"]],
			});
		},
		onError: (error: Error) => {
			toast.error(`Failed to cancel cancellation request: ${error.message}`);
		},
	});

	const confirmDelete = useCallback(() => {
		if (!canDelete || deleteBountyMutation.isPending) {
			return;
		}

		if (onDelete) {
			onDelete();
			setShowDeleteDialog(false);
			return;
		}

		deleteBountyMutation.mutate();
	}, [
		canDelete,
		deleteBountyMutation.isPending,
		deleteBountyMutation,
		onDelete,
		setShowDeleteDialog,
	]);

	const confirmCancellation = useCallback(() => {
		if (
			!canRequestCancellation ||
			hasPendingCancellation ||
			requestCancellationMutation.isPending
		) {
			return;
		}
		requestCancellationMutation.mutate({
			bountyId: bounty.id,
			reason: cancellationReason || undefined,
		});
	}, [
		canRequestCancellation,
		hasPendingCancellation,
		requestCancellationMutation.isPending,
		requestCancellationMutation,
		bounty.id,
		cancellationReason,
	]);

	const cancelCancellationRequest = useCallback(() => {
		cancelCancellationRequestMutation.mutate({ bountyId: bounty.id });
	}, [cancelCancellationRequestMutation, bounty.id]);

	return {
		togglePinMutation,
		deleteBountyMutation,
		requestCancellationMutation,
		cancelCancellationRequestMutation,
		confirmDelete,
		confirmCancellation,
		cancelCancellationRequest,
	};
}

function useBountyCardComputedValues(
	bounty: Bounty,
	isCancelled: boolean,
	isRefunded: boolean,
	hasPendingCancellation: boolean,
	isFunded: boolean,
) {
	const getBadgeInfo = useCallback(() => {
		if (isCancelled || isRefunded) {
			return {
				label: "Cancelled",
				className:
					"text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/15",
			};
		}
		if (hasPendingCancellation) {
			return {
				label: "Cancelling",
				className:
					"text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/15",
			};
		}
		if (isFunded) {
			return {
				label: "Funded",
				className:
					"text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent-muted border border-brand-accent/15",
			};
		}
		return {
			label: "Unfunded",
			className:
				"text-[10px] font-medium leading-[150%] px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/40 border border-foreground/8",
		};
	}, [isCancelled, isRefunded, hasPendingCancellation, isFunded]);

	const creatorName = bounty.creator.name || "User";
	const creatorInitial = creatorName.charAt(0).toLowerCase();

	const colors = [
		{ bg: "#E66700", border: "#C95900" },
		{ bg: "#0066FF", border: "#0052CC" },
		{ bg: "#00B894", border: "#00A085" },
		{ bg: "#E84393", border: "#D63031" },
		{ bg: "#6C5CE7", border: "#5F4FCF" },
	];
	const colorIndex = creatorName.charCodeAt(0) % colors.length;
	const avatarColor = colors[colorIndex];

	const repoDisplay = (() => {
		const urlCandidate = bounty.repositoryUrl || bounty.issueUrl;
		if (!urlCandidate) {
			return "Unknown repo";
		}
		const match = urlCandidate.match(GITHUB_REPO_REGEX);
		return match?.[1] || "Unknown repo";
	})();

	const issueDisplay = (() => {
		if (!bounty.issueUrl) {
			return null;
		}
		const match = bounty.issueUrl.match(GITHUB_ISSUE_REGEX);
		if (!match) {
			return null;
		}
		const issueNumber = match[1];
		const repoMatch = bounty.issueUrl.match(GITHUB_REPO_REGEX);
		const repoSlug = repoMatch?.[1] || "unknown";
		return {
			number: issueNumber,
			repo: repoSlug,
			url: bounty.issueUrl,
		};
	})();

	const linearDisplay = (() => {
		if (bounty.linearIssueIdentifier && bounty.linearIssueUrl) {
			return {
				identifier: bounty.linearIssueIdentifier,
				url: bounty.linearIssueUrl,
			};
		}
		return null;
	})();

	const formattedAmount = `$${bounty.amount.toLocaleString()}`;

	return {
		getBadgeInfo,
		creatorName,
		creatorInitial,
		avatarColor,
		repoDisplay,
		issueDisplay,
		linearDisplay,
		formattedAmount,
	};
}

interface BountyCardProviderProps {
	children: ReactNode;
	bounty: Bounty;
	stats?: {
		commentCount: number;
		voteCount: number;
		submissionCount: number;
		isVoted: boolean;
		bookmarked: boolean;
	};
	onDelete?: () => void;
}

export function BountyCardProvider({
	children,
	bounty,
	stats,
	onDelete,
}: BountyCardProviderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { session } = useSession();
	const queryClient = useQueryClient();

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showCancellationDialog, setShowCancellationDialog] = useState(false);
	const [cancellationReason, setCancellationReason] = useState("");

	const {
		isOwner,
		isFunded,
		isCancelled,
		isRefunded,
		canPin,
		canRequestCancellation,
		hasPendingCancellation,
		canDelete,
	} = useBountyCardQueries(bounty, session?.user?.id);

	const {
		togglePinMutation,
		deleteBountyMutation,
		requestCancellationMutation,
		cancelCancellationRequestMutation,
		confirmDelete,
		confirmCancellation,
		cancelCancellationRequest,
	} = useBountyCardMutations(
		bounty,
		canDelete,
		canRequestCancellation,
		hasPendingCancellation,
		onDelete,
		setShowDeleteDialog,
		setShowCancellationDialog,
		setCancellationReason,
		cancellationReason,
	);

	const {
		getBadgeInfo,
		creatorName,
		creatorInitial,
		avatarColor,
		repoDisplay,
		issueDisplay,
		linearDisplay,
		formattedAmount,
	} = useBountyCardComputedValues(
		bounty,
		isCancelled,
		isRefunded,
		hasPendingCancellation,
		isFunded,
	);

	const handleClick = useCallback(() => {
		const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
		router.push(url);
	}, [bounty.id, pathname, router]);

	const prefetchBountyDetail = useCallback(() => {
		queryClient.prefetchQuery(
			trpc.bounties.getBountyDetail.queryOptions({ id: bounty.id }),
		);
		queryClient.prefetchQuery(
			trpc.bounties.getBountyVotes.queryOptions({ bountyId: bounty.id }),
		);
	}, [bounty.id, queryClient]);

	const togglePin = useCallback(() => {
		if (canPin && !togglePinMutation.isPending) {
			togglePinMutation.mutate({ bountyId: bounty.id });
		}
	}, [canPin, togglePinMutation.isPending, togglePinMutation, bounty.id]);

	const openDeleteDialog = useCallback(() => {
		if (canDelete) {
			setShowDeleteDialog(true);
		}
	}, [canDelete]);

	const cancelDelete = useCallback(() => {
		setShowDeleteDialog(false);
	}, []);

	const openCancellationDialog = useCallback(() => {
		if (canRequestCancellation && !hasPendingCancellation) {
			setShowCancellationDialog(true);
		}
	}, [canRequestCancellation, hasPendingCancellation]);

	const state: BountyCardState = useMemo(
		() => ({
			bounty,
			stats,
			isOwner,
			isFunded,
			isCancelled,
			isRefunded,
			canPin,
			canDelete,
			canRequestCancellation,
			hasPendingCancellation,
			formattedAmount,
			badgeInfo: getBadgeInfo(),
			creatorName,
			creatorInitial,
			avatarColor,
			repoDisplay,
			issueDisplay,
			linearDisplay,
			isTogglePinPending: togglePinMutation.isPending,
			isDeletePending: deleteBountyMutation.isPending,
			isRequestCancellationPending: requestCancellationMutation.isPending,
			isCancelCancellationRequestPending:
				cancelCancellationRequestMutation.isPending,
		}),
		[
			bounty,
			stats,
			isOwner,
			isFunded,
			isCancelled,
			isRefunded,
			canPin,
			canDelete,
			canRequestCancellation,
			hasPendingCancellation,
			formattedAmount,
			getBadgeInfo,
			creatorName,
			creatorInitial,
			avatarColor,
			repoDisplay,
			issueDisplay,
			linearDisplay,
			togglePinMutation.isPending,
			deleteBountyMutation.isPending,
			requestCancellationMutation.isPending,
			cancelCancellationRequestMutation.isPending,
		],
	);

	const actions: BountyCardActions = useMemo(
		() => ({
			handleClick,
			prefetchBountyDetail,
			togglePin,
			openDeleteDialog,
			confirmDelete,
			cancelDelete,
			openCancellationDialog,
			confirmCancellation,
			cancelCancellationRequest,
		}),
		[
			handleClick,
			prefetchBountyDetail,
			togglePin,
			openDeleteDialog,
			confirmDelete,
			cancelDelete,
			openCancellationDialog,
			confirmCancellation,
			cancelCancellationRequest,
		],
	);

	const meta: BountyCardMeta = useMemo(
		() => ({
			onDelete,
			showDeleteDialog,
			setShowDeleteDialog,
			showCancellationDialog,
			setShowCancellationDialog,
			cancellationReason,
			setCancellationReason,
		}),
		[onDelete, showDeleteDialog, showCancellationDialog, cancellationReason],
	);

	const contextValue: BountyCardContextValue = useMemo(
		() => ({
			state,
			actions,
			meta,
		}),
		[state, actions, meta],
	);

	return (
		<BountyCardContext.Provider value={contextValue}>
			{children}
		</BountyCardContext.Provider>
	);
}
