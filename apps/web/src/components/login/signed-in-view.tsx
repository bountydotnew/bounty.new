"use client";

import { authClient } from "@bounty/auth/client";
import { Button } from "@bounty/ui/components/button";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Bounty from "@/components/icons/bounty";

interface SignedInViewProps {
	callbackUrl: string;
	session: {
		user: {
			name?: string | null;
			email?: string | null;
			image?: string | null;
		};
	};
}

export function SignedInView({ callbackUrl, session }: SignedInViewProps) {
	const router = useRouter();

	const handleGoToDashboard = () => {
		router.push(callbackUrl);
	};

	return (
		<div className="w-full max-w-96 space-y-8">
			<div className="space-y-4 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg">
					<Bounty className="h-12 w-12 text-primary" />
				</div>
				<div className="space-y-2">
					<h1 className="flex h-7 items-center justify-center font-medium text-sand-12 text-xl tracking-tight">
						Welcome back!
					</h1>
					<p className="text-gray-400 text-sm">You're already signed in</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center space-x-3 rounded-lg bg-surface-1 p-3">
					{session.user.image && (
						<Image
							alt={session.user.name || "User"}
							className="h-10 w-10 rounded-full"
							height={40}
							src={session.user.image}
							width={40}
						/>
					)}
					<div className="text-left">
						<p className="font-medium text-sm text-foreground">
							{session.user.name}
						</p>
						<p className="text-gray-400 text-xs">{session.user.email}</p>
					</div>
				</div>

				<div className="space-y-3">
					<Button
						className="w-full rounded-lg bg-foreground text-background py-3 font-medium hover:bg-black/80 dark:hover:bg-white/80"
						onClick={handleGoToDashboard}
					>
						Continue
					</Button>
					<Button
						className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-gray-400 transition-colors hover:text-gray-200"
						onClick={() =>
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										toast.success("Signed out successfully");
										window.location.href = "/login";
									},
								},
							})
						}
						variant="text"
					>
						<LogOut className="h-4 w-4" />
						Nevermind, log me out.
					</Button>
				</div>
			</div>
		</div>
	);
}
