"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@bounty/ui/components/dialog";
import { Button } from "@bounty/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConnectOnboardingModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bountyAmount?: number;
	currency?: string;
}

export function ConnectOnboardingModal({
	open,
	onOpenChange,
	bountyAmount,
	currency = "USD",
}: ConnectOnboardingModalProps) {
	const router = useRouter();

	const createAccountLink = useMutation({
		mutationFn: async () => {
			return await trpcClient.connect.createConnectAccountLink.mutate();
		},
		onSuccess: (result) => {
			if (result?.data?.url) {
				// Redirect to Stripe Connect onboarding
				window.location.href = result.data.url;
			}
		},
		onError: (error: Error) => {
			toast.error(`Failed to start onboarding: ${error.message}`);
		},
	});

	const handleContinue = () => {
		createAccountLink.mutate();
	};

	const handleLater = () => {
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{bountyAmount
							? `🎉 You're about to earn ${currency} ${bountyAmount}!`
							: "Set up payouts"}
					</DialogTitle>
					<DialogDescription>
						{bountyAmount
							? `To receive your bounty reward, you'll need to set up payouts. This is a quick 2-minute process.`
							: "Set up payouts to receive your bounty rewards. This is a quick 2-minute process."}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<p className="text-sm text-muted-foreground">
						You'll be redirected to Stripe to complete identity verification.
						After setup, you'll be able to receive payments directly to your
						bank account.
					</p>
					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={handleLater}>
							I'll do this later
						</Button>
						<Button
							onClick={handleContinue}
							disabled={createAccountLink.isPending}
						>
							{createAccountLink.isPending
								? "Loading..."
								: "Continue to Payout Setup"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
