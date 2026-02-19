"use client";

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
	Loader2,
	ArrowUpRight,
	ArrowDownLeft,
	Clock,
	AlertCircle,
	ExternalLink,
} from "lucide-react";
import { cn } from "@bounty/ui/lib/utils";
import Link from "next/link";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@bounty/ui/components/table";

type ActivityType = "payout" | "created";
type PayoutStatus = "pending" | "processing" | "completed" | "failed";

// Format amount for display
function formatAmount(amount: string): string {
	const num = parseFloat(amount);
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
}

// Format relative time
function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get status with dot indicator
function getStatusDisplay(status: PayoutStatus) {
	switch (status) {
		case "completed":
			return (
				<span className="flex items-center gap-2">
					<span className="size-1.5 rounded-full bg-emerald-500" />
					<span className="text-sm">Completed</span>
				</span>
			);
		case "processing":
			return (
				<span className="flex items-center gap-2">
					<span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
					<span className="text-sm">Processing</span>
				</span>
			);
		case "pending":
			return (
				<span className="flex items-center gap-2">
					<span className="size-1.5 rounded-full bg-muted-foreground" />
					<span className="text-sm text-muted-foreground">Pending</span>
				</span>
			);
		case "failed":
			return (
				<span className="flex items-center gap-2">
					<span className="size-1.5 rounded-full bg-red-500" />
					<span className="text-sm">Failed</span>
				</span>
			);
		default:
			return <span className="text-sm text-muted-foreground">Unknown</span>;
	}
}

// Get type config
function getTypeIcon(type: ActivityType) {
	switch (type) {
		case "payout":
			return {
				icon: ArrowDownLeft,
				color: "text-emerald-600",
				label: "Received",
			};
		case "created":
			return { icon: ArrowUpRight, color: "text-blue-600", label: "Created" };
	}
}

export function PaymentActivity() {
	const { data, isLoading, isError } = useQuery(
		trpc.connect.getActivity.queryOptions({ page: 1, limit: 20 }),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-16">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center p-16 text-center">
				<AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
				<h3 className="text-base font-semibold mb-2">
					Failed to load activity
				</h3>
				<p className="text-sm text-muted-foreground">Please try again later.</p>
			</div>
		);
	}

	const activities = data?.data ?? [];

	// Calculate stats
	const completedPayouts = activities
		.filter((a: any) => a.type === "payout" && a.status === "completed")
		.reduce((sum: number, a: any) => sum + parseFloat(a.amount), 0);

	const pendingPayouts = activities
		.filter((a: any) => a.type === "payout" && a.status === "pending")
		.reduce((sum: number, a: any) => sum + parseFloat(a.amount), 0);

	const createdCount = activities.filter(
		(a: any) => a.type === "created",
	).length;

	if (activities.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-lg">
				<Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
				<h3 className="text-base font-semibold mb-2">No activity yet</h3>
				<p className="text-sm text-muted-foreground max-w-sm">
					Your payout activity and created bounties will appear here.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Activity Stats */}
			<div className="grid grid-cols-3 gap-4">
				<div className="p-4 rounded-lg border bg-card">
					<p className="text-sm text-muted-foreground mb-1">Received</p>
					<p className="text-2xl font-semibold tracking-tight">
						{formatAmount(completedPayouts.toString())}
					</p>
				</div>
				<div className="p-4 rounded-lg border bg-card">
					<p className="text-sm text-muted-foreground mb-1">Pending</p>
					<p className="text-2xl font-semibold tracking-tight">
						{formatAmount(pendingPayouts.toString())}
					</p>
				</div>
				<div className="p-4 rounded-lg border bg-card">
					<p className="text-sm text-muted-foreground mb-1">Created</p>
					<p className="text-2xl font-semibold tracking-tight">
						{createdCount}
					</p>
				</div>
			</div>

			{/* Activity Table */}
			<div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Type</TableHead>
							<TableHead>Bounty</TableHead>
							<TableHead>Repository</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right w-[100px]">Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{activities.map((activity: any) => {
							const typeConfig = getTypeIcon(activity.type);
							const TypeIcon = typeConfig.icon;

							const bountyUrl = activity.bounty
								? `https://github.com/${activity.bounty.githubRepoOwner}/${activity.bounty.githubRepoName}/issues/${activity.bountyId?.toString().replace(/\D/g, "") || ""}`
								: "#";

							return (
								<TableRow key={activity.id}>
									<TableCell>
										<div
											className={cn(
												"flex items-center gap-2",
												typeConfig.color,
											)}
										>
											<TypeIcon className="h-4 w-4" />
											<span className="text-sm font-medium">
												{typeConfig.label}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="max-w-[240px]">
											<p
												className="text-sm font-medium truncate"
												title={activity.bounty?.title || "Unknown bounty"}
											>
												{activity.bounty?.title || "Unknown bounty"}
											</p>
											{activity.bounty && (
												<Link
													href={bountyUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
												>
													View <ExternalLink className="h-3 w-3" />
												</Link>
											)}
										</div>
									</TableCell>
									<TableCell>
										{activity.bounty ? (
											<span className="text-sm text-muted-foreground">
												{activity.bounty.githubRepoOwner}/
												{activity.bounty.githubRepoName}
											</span>
										) : (
											<span className="text-sm text-muted-foreground/50">
												—
											</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<span className="text-sm font-medium">
											{formatAmount(activity.amount)}
										</span>
									</TableCell>
									<TableCell>
										{activity.type === "payout" ? (
											getStatusDisplay(activity.status)
										) : (
											<span className="inline-flex items-center gap-2">
												<span className="size-1.5 rounded-full bg-blue-500" />
												<span className="text-sm">Active</span>
											</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<span className="text-sm text-muted-foreground">
											{formatRelativeTime(activity.createdAt)}
										</span>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Payout Timing Notice */}
			<div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 text-sm">
				<Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
				<div className="space-y-1">
					<p className="font-medium">Payout timing</p>
					<p className="text-muted-foreground">
						Once your PR is merged and approved, payouts are released within 2-3
						business days while funds clear from the original payment.
					</p>
				</div>
			</div>
		</div>
	);
}
