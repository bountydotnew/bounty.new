"use client";

import { Spinner } from "@bounty/ui/components/spinner";
import { Suspense } from "react";
import ResetPassword from "@/components/bounty/reset-password";

export default function ResetPasswordPage() {
	return (
		<div className="mx-auto w-full bg-landing-background">
			<Suspense
				fallback={
					<div className="flex h-screen items-center justify-center">
						<Spinner />
					</div>
				}
			>
				<ResetPassword />
			</Suspense>
		</div>
	);
}
