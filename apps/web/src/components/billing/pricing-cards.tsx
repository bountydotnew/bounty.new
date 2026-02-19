"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	PRICING_TIERS,
	getPlanFeatures,
	calculateBountyCost,
	type BountyProPlan,
} from "@bounty/types";
import { cn } from "@bounty/ui";
import { useSession } from "@/context/session-context";
import { useCustomer } from "autumn-js/react";
import { toast } from "sonner";
import { useActiveOrg } from "@/hooks/use-active-org";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@bounty/ui/components/tooltip";

const PLAN_ORDER: BountyProPlan[] = [
	"free",
	"tier_1_basic",
	"tier_2_pro",
	"tier_3_pro_plus",
];

// Get the base URL for success/redirects
const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return process.env.NEXT_PUBLIC_BASE_URL ?? "https://bounty.new";
};

function PricingCard({
	plan,
	isRecommended,
	isYearly,
	estimatedMonthlySpend,
}: {
	plan: BountyProPlan;
	isRecommended: boolean;
	isYearly: boolean;
	estimatedMonthlySpend?: number;
}) {
	const router = useRouter();
	const { session, isAuthenticated } = useSession();
	const { attach } = useCustomer();
	const { activeOrgSlug } = useActiveOrg();
	const pricing = PRICING_TIERS[plan];
	const [isLoading, setIsLoading] = useState(false);

	// Check if early access mode is enabled
	const isEarlyAccessEnabled =
		process.env.NEXT_PUBLIC_EARLY_ACCESS_ENABLED !== "false";

	// Check if user has early access (early_access or admin role)
	const hasEarlyAccess =
		session?.user?.role === "early_access" || session?.user?.role === "admin";

	// Determine if user can purchase
	const canPurchase = !isEarlyAccessEnabled || hasEarlyAccess;

	const displayPrice = isYearly ? pricing.yearlyPrice : pricing.monthlyPrice;
	const checkoutSlug =
		plan === "free" ? "free" : isYearly ? `${plan}_yearly` : plan;

	const handleCheckoutClick = () => {
		// If early access is enabled and user doesn't have access, redirect to early access required
		if (isEarlyAccessEnabled && !hasEarlyAccess) {
			router.push("/early-access-required");
			return;
		}

		if (plan === "free") {
			router.push("/dashboard");
			return;
		}

		// If not authenticated, redirect to login with callback
		if (!isAuthenticated) {
			const callbackUrl = `/pricing?checkout=${checkoutSlug}`;
			router.push(`/login?callback=${encodeURIComponent(callbackUrl)}`);
			return;
		}

		handleCheckout().catch((error) => {
			console.error("[Checkout Error]", error);
		});
	};

	const handleCheckout = async () => {
		setIsLoading(true);
		try {
			// Use the SDK's attach method with explicit success URL
			// forceCheckout: true ensures users always go through the checkout page
			const result = await attach({
				productId: checkoutSlug,
				successUrl: activeOrgSlug
					? `${getBaseUrl()}/${activeOrgSlug}/settings/billing?checkout=success`
					: `${getBaseUrl()}/dashboard?checkout=success`,
				checkoutSessionParams: {
					cancel_url: `${getBaseUrl()}/pricing`,
				},
				forceCheckout: true,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Checkout failed");
				setIsLoading(false);
				return;
			}

			const data = result.data;
			if (!data) {
				toast.error("Invalid checkout response");
				setIsLoading(false);
				return;
			}

			// Redirect to checkout URL
			if ("checkout_url" in data && data.checkout_url) {
				window.location.href = data.checkout_url;
				return;
			}

			// Fallback: if for some reason no checkout URL, show error
			toast.error("Unable to open checkout page. Please try again.");
			setIsLoading(false);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			console.error("[Checkout Error]", error);
			toast.error(`Checkout failed: ${message}`);
			setIsLoading(false);
		}
	};

	return (
		<div
			className={cn(
				"group relative flex flex-col justify-between rounded-lg border p-6 transition-all duration-200",
				"bg-surface-1",
				// Recommended card gets highlighted styling
				isRecommended
					? "border-white/30 bg-surface-1"
					: "border-border-default",
			)}
		>
			{/* Plan Header */}
			<div className="flex-1">
				<div className="flex items-baseline gap-2">
					<h3 className="text-lg font-medium text-foreground">
						{pricing.name}
					</h3>
					{isRecommended && (
						<span className="text-text-muted text-sm">Recommended</span>
					)}
				</div>

				{/* Price */}
				<div className="mt-2 flex items-baseline gap-0.5">
					<span className="text-2xl font-medium text-text-muted">
						${displayPrice}
					</span>
					<span className="text-sm text-text-muted">
						/{isYearly ? "yr." : "mo."}
					</span>
				</div>
				{isYearly && displayPrice > 0 && (
					<p className="mt-1 text-xs text-text-muted">
						${Math.round(displayPrice / 12)}/mo. billed annually
					</p>
				)}

				{/* Features */}
				<p className="mt-4 text-sm text-text-muted">
					{plan === "free" ? "Includes:" : "Everything in Free, plus:"}
				</p>
				<ul className="mt-3 space-y-2">
					{getPlanFeatures(plan).map((feature) => (
						<li
							key={feature}
							className="flex items-start gap-2 text-sm text-foreground"
						>
							<span className="text-text-muted">✓</span>
							<span>{feature}</span>
						</li>
					))}
				</ul>
			</div>

			{/* Estimated fees based on spend slider - outside flex-1 so it aligns across cards */}
			{estimatedMonthlySpend !== undefined &&
				estimatedMonthlySpend > 0 &&
				(() => {
					const { platformFee } = calculateBountyCost(
						pricing,
						estimatedMonthlySpend,
					);
					// Stripe fee: 2.9% + $0.30 per transaction (estimate as single transaction)
					const stripeFee = estimatedMonthlySpend * 0.029 + 0.3;
					const totalFees = platformFee + stripeFee;

					return (
						<div className="mt-4 pt-4 border-t border-border-subtle space-y-1.5">
							<div className="flex items-baseline justify-between">
								<span className="text-xs text-text-muted">Platform fee</span>
								<span className="text-xs text-text-muted">
									${platformFee.toFixed(2)}
								</span>
							</div>
							<div className="flex items-baseline justify-between">
								<span className="text-xs text-text-muted">Stripe fee</span>
								<span className="text-xs text-text-muted">
									${stripeFee.toFixed(2)}
								</span>
							</div>
							<div className="flex items-baseline justify-between pt-1.5 border-t border-border-subtle">
								<span className="text-xs text-text-muted">Total fees</span>
								<span className="text-sm font-medium text-foreground">
									${totalFees.toFixed(2)}
								</span>
							</div>
						</div>
					);
				})()}

			{/* CTA Button */}
			<div className="mt-6">
				{canPurchase ? (
					<button
						type="button"
						onClick={handleCheckoutClick}
						disabled={isLoading}
						className={cn(
							"w-full rounded-full text-sm font-medium transition-colors",
							isRecommended
								? "bg-foreground text-background hover:opacity-90"
								: "bg-surface-1 text-foreground hover:bg-surface-2 border border-border-default",
							isLoading && "cursor-wait opacity-50",
						)}
						style={{ padding: ".5em 1em .52em" }}
					>
						{isLoading
							? "Loading..."
							: plan === "free"
								? "Get Started"
								: `Get ${pricing.name}`}
					</button>
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<span
								className={cn(
									"inline-flex w-full items-center justify-center rounded-full text-sm font-medium transition-colors cursor-not-allowed opacity-70",
									isRecommended
										? "bg-foreground text-background"
										: "bg-surface-1 text-foreground border border-border-default",
								)}
								style={{ padding: ".5em 1em .52em" }}
							>
								{plan === "free" ? "Get Started" : `Get ${pricing.name}`}
							</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Early Access Required - Join the waitlist to get access</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</div>
	);
}

interface PricingCardsProps {
	isYearly?: boolean;
	recommendedPlan?: BountyProPlan;
	estimatedMonthlySpend?: number;
}

export function PricingCards({
	isYearly = false,
	recommendedPlan = "tier_2_pro",
	estimatedMonthlySpend,
}: PricingCardsProps) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{PLAN_ORDER.map((plan) => (
				<PricingCard
					key={plan}
					plan={plan}
					isRecommended={plan === recommendedPlan}
					isYearly={isYearly}
					estimatedMonthlySpend={estimatedMonthlySpend}
				/>
			))}
		</div>
	);
}
