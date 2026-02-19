"use client";

import { Badge } from "@bounty/ui/components/badge";
import { Skeleton } from "@bounty/ui/components/skeleton";
import { Button } from "@bounty/ui/components/button";
import { ExternalLink, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useCustomer } from "autumn-js/react";
import { useState, useCallback } from "react";
import { cn } from "@bounty/ui/lib/utils";

type Feature = {
	enabled?: boolean;
	type?: string;
	usage?: number;
	unlimited?: boolean;
	included_usage?: number;
	next_reset_at?: number | null;
	name?: string;
};

const SECTION_PADDING = "py-[18px]";
const SECTION_TITLE = "text-[20px] leading-[150%] text-foreground font-medium";

function formatBillingDate(timestamp: number | null) {
	if (!timestamp || timestamp === 0) return null;
	const isSeconds = timestamp < 32_503_680_000;
	const date = isSeconds ? new Date(timestamp * 1000) : new Date(timestamp);
	if (
		Number.isNaN(date.getTime()) ||
		date.getFullYear() < 2000 ||
		date.getFullYear() > 2100
	)
		return null;
	return format(date, "MMM d, yyyy");
}

function BillingHeader({
	hasActiveSubscription,
	isPortalLoading,
	onOpenPortal,
}: {
	hasActiveSubscription: boolean;
	isPortalLoading: boolean;
	onOpenPortal: () => void;
}) {
	return (
		<header className="flex justify-between items-start pb-4 border-b border-border">
			<div className="flex flex-col justify-end">
				<h1 className="text-[28px] leading-[150%] text-foreground font-medium">
					Billing
				</h1>
				<p className="text-[16px] leading-[150%] text-text-secondary font-medium">
					Manage your subscription and payment methods
				</p>
			</div>
			{hasActiveSubscription && (
				<button
					onClick={onOpenPortal}
					disabled={isPortalLoading}
					className="w-fit h-[31px] rounded-[10px] flex items-center px-3 py-0 gap-2 bg-[#474747] hover:bg-[#5A5A5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					<span className="text-[13px] leading-[150%] text-white font-medium">
						Manage billing
					</span>
					<ExternalLink className="size-4 text-white" />
				</button>
			)}
		</header>
	);
}

function CurrentPlanSection({
	activeProduct,
	hasActiveSubscription,
	isFreeTier,
	isPortalLoading,
	onRefetch,
}: {
	activeProduct:
		| {
				name?: string | null;
				status?: string | null;
				started_at?: number | null;
				current_period_end?: number | null;
		  }
		| undefined;
	hasActiveSubscription: boolean;
	isFreeTier: boolean;
	isPortalLoading: boolean;
	onRefetch: () => void;
}) {
	return (
		<section
			className={cn(
				"flex flex-col gap-4 border-b border-border",
				SECTION_PADDING,
			)}
		>
			<div className="flex items-center justify-between">
				<h2 className={SECTION_TITLE}>Current Plan</h2>
				<button
					onClick={onRefetch}
					disabled={isPortalLoading}
					className="size-8 flex items-center justify-center rounded-md hover:bg-surface-3 disabled:opacity-50 transition-colors"
					aria-label="Refresh"
				>
					<RefreshCw
						className={cn("size-4", isPortalLoading && "animate-spin")}
					/>
				</button>
			</div>
			<div className="flex items-center gap-3">
				<Badge
					className={
						hasActiveSubscription ? "bg-surface-3 text-foreground" : ""
					}
				>
					{activeProduct?.name ?? "Free"}
				</Badge>
				{activeProduct && (
					<Badge variant="outline" className="text-xs uppercase">
						{activeProduct.status}
					</Badge>
				)}
			</div>
			{activeProduct && (
				<div className="flex flex-col gap-3 text-sm">
					{activeProduct.started_at && (
						<div className="text-text-secondary">
							<span className="font-medium text-foreground">Started:</span>{" "}
							{formatBillingDate(activeProduct.started_at)}
						</div>
					)}
					{activeProduct.current_period_end && (
						<div className="text-text-secondary">
							<span className="font-medium text-foreground">Renews:</span>{" "}
							{formatBillingDate(activeProduct.current_period_end)}
						</div>
					)}
				</div>
			)}
			{isFreeTier && (
				<p className="text-text-secondary text-sm">
					You&apos;re on the free tier. Upgrade to unlock more features.
				</p>
			)}
		</section>
	);
}

function FeatureRow({
	featureKey,
	feature,
}: {
	featureKey: string;
	feature: Feature;
}) {
	const usagePercent =
		!feature.unlimited && (feature.included_usage ?? 0) > 0
			? Math.min(
					100,
					((feature.usage ?? 0) / (feature.included_usage ?? 1)) * 100,
				)
			: null;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<span className="font-medium text-foreground">
					{feature.name ??
						featureKey
							.replace(/_/g, " ")
							.replace(/\b\w/g, (l: string) => l.toUpperCase())}
				</span>
				<Badge
					variant={feature.enabled ? "default" : "secondary"}
					className="text-xs"
				>
					{feature.enabled ? "Enabled" : "Disabled"}
				</Badge>
			</div>
			{feature.type !== "static" && feature.type !== "single_use" && (
				<div className="flex flex-col gap-2 text-sm">
					<div className="flex items-center justify-between text-text-secondary">
						<span>Usage</span>
						<span className="font-medium text-foreground">
							{feature.usage ?? 0} /{" "}
							{feature.unlimited ? "\u221E" : (feature.included_usage ?? "N/A")}
						</span>
					</div>
					{usagePercent !== null && (
						<div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
							<div
								className={cn(
									"h-full transition-all",
									usagePercent > 80
										? "bg-red-500"
										: usagePercent > 50
											? "bg-yellow-500"
											: "bg-green-500",
								)}
								style={{ width: `${usagePercent}%` }}
							/>
						</div>
					)}
					{feature.next_reset_at && (
						<div className="text-text-secondary text-xs">
							Resets {formatBillingDate(feature.next_reset_at)}
						</div>
					)}
				</div>
			)}
			{feature.type === "static" && (
				<p className="text-text-secondary text-sm">
					{feature.enabled
						? "Included in your plan"
						: "Not available in your plan"}
				</p>
			)}
		</div>
	);
}

function FeaturesSection({ features }: { features: Record<string, unknown> }) {
	return (
		<section
			className={cn(
				"flex flex-col gap-4 border-b border-border",
				SECTION_PADDING,
			)}
		>
			<h2 className={SECTION_TITLE}>Features & Usage</h2>
			<div className="flex flex-col gap-4">
				{Object.entries(features).map(([key, feature]) => (
					<FeatureRow
						key={key}
						featureKey={key}
						feature={feature as unknown as Feature}
					/>
				))}
			</div>
		</section>
	);
}

function AccountInfoSection({
	customer,
}: {
	customer: {
		id?: string | null;
		email?: string | null;
		name?: string | null;
		env?: string | null;
		created_at?: number | null;
	};
}) {
	return (
		<section
			className={cn(
				"flex flex-col gap-4 border-b border-border",
				SECTION_PADDING,
			)}
		>
			<h2 className={SECTION_TITLE}>Account Information</h2>
			<dl className="flex flex-col gap-3 text-sm">
				<div className="flex items-center justify-between">
					<dt className="text-text-secondary">Account ID</dt>
					<dd>
						<code className="rounded bg-surface-3 px-2 py-1 text-xs text-foreground">
							{customer.id ?? "N/A"}
						</code>
					</dd>
				</div>
				<div className="flex items-center justify-between">
					<dt className="text-text-secondary">Email</dt>
					<dd className="text-foreground">{customer.email ?? "Not set"}</dd>
				</div>
				<div className="flex items-center justify-between">
					<dt className="text-text-secondary">Name</dt>
					<dd className="text-foreground">{customer.name ?? "Not set"}</dd>
				</div>
				<div className="flex items-center justify-between">
					<dt className="text-text-secondary">Environment</dt>
					<dd>
						<Badge variant="outline" className="text-xs">
							{customer.env ?? "unknown"}
						</Badge>
					</dd>
				</div>
				{customer.created_at && (
					<div className="flex items-center justify-between">
						<dt className="text-text-secondary">Member since</dt>
						<dd className="text-foreground">
							{formatBillingDate(customer.created_at)}
						</dd>
					</div>
				)}
			</dl>
		</section>
	);
}

export function BillingSettingsClient() {
	const { customer, isLoading, error, refetch, openBillingPortal } =
		useCustomer();

	const [isPortalLoading, setIsPortalLoading] = useState(false);
	const isFreeTier = !customer;
	const products = customer?.products ?? [];
	const activeProducts = products.filter(
		(p) => p.status === "active" || p.status === "trialing",
	);
	const hasActiveSubscription = activeProducts.length > 0;
	const activeProduct = activeProducts[0];
	const features = customer?.features ?? {};

	const handleOpenPortal = useCallback(async () => {
		setIsPortalLoading(true);
		try {
			const result = await openBillingPortal();
			if (result.error) {
				console.error("Portal error:", result.error);
				alert(`Failed to open billing portal: ${result.error.message}`);
			} else if (result.data?.url) {
				window.location.href = result.data.url;
			}
			setIsPortalLoading(false);
		} catch {
			setIsPortalLoading(false);
		}
	}, [openBillingPortal]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-[121px] border-b border-border animate-pulse bg-surface-2" />
				<div className="space-y-4">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-32 w-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/20 dark:bg-red-900/10 p-8 text-center">
				<Zap className="mx-auto h-12 w-12 text-red-500 opacity-50" />
				<h3 className="mt-4 font-semibold text-red-700 dark:text-red-400">
					Billing Error
				</h3>
				<p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<BillingHeader
				hasActiveSubscription={hasActiveSubscription}
				isPortalLoading={isPortalLoading}
				onOpenPortal={handleOpenPortal}
			/>

			<CurrentPlanSection
				activeProduct={activeProduct}
				hasActiveSubscription={hasActiveSubscription}
				isFreeTier={isFreeTier}
				isPortalLoading={isPortalLoading}
				onRefetch={refetch}
			/>

			{customer && Object.keys(features).length > 0 && (
				<FeaturesSection features={features} />
			)}

			{customer && <AccountInfoSection customer={customer} />}

			{!hasActiveSubscription && (
				<section className={cn("flex flex-col gap-4", SECTION_PADDING)}>
					<h2 className={SECTION_TITLE}>Upgrade Plan</h2>
					<p className="text-sm text-text-secondary">
						Choose a plan that fits your needs.
					</p>
					<Button asChild>
						<Link href="/pricing">
							View Plans
							<ExternalLink className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</section>
			)}

			{process.env.NODE_ENV === "development" && (
				<section
					className={cn(
						"flex flex-col gap-4 border-b border-dashed border-border",
						SECTION_PADDING,
					)}
				>
					<h2 className={cn(SECTION_TITLE, "text-text-secondary")}>
						Testing Tools
					</h2>
					<p className="text-sm text-text-secondary">
						Development tools for testing billing functionality
					</p>
					<Button asChild variant="outline" size="sm">
						<Link href="/test/billing">
							<RefreshCw className="mr-2 h-4 w-4" />
							Billing Test Dashboard
						</Link>
					</Button>
				</section>
			)}
		</div>
	);
}
