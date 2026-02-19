import type { Metadata } from "next";
import { Suspense } from "react";
import { TestBillingClient } from "@/components/test/test-billing-client";
import { TestAutumnSdk } from "@/components/test/test-autumn-sdk";

export const metadata: Metadata = {
	title: "Billing Test",
	description: "Internal billing test page.",
};

export default function TestBillingPage() {
	return (
		<div className="container mx-auto max-w-6xl py-8">
			<header className="mb-8">
				<h1 className="mb-2 font-bold text-3xl">Billing Testing Dashboard</h1>
				<p className="text-muted-foreground">
					Test and debug billing functionality, feature access, and usage
					tracking.
				</p>
			</header>

			{/* Autumn SDK Test Section */}
			<section className="mb-12">
				<div className="mb-4 flex items-center gap-2">
					<h2 className="font-bold text-2xl">autumn-js SDK Tests</h2>
					<span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-500 text-xs font-medium">
						New
					</span>
				</div>
				<Suspense fallback={<div>Loading SDK tests...</div>}>
					<TestAutumnSdk />
				</Suspense>
			</section>

			<hr className="mb-12 border-border" />

			{/* Existing tRPC Tests */}
			<section>
				<h2 className="mb-4 font-bold text-2xl">tRPC Billing Tests</h2>
				<Suspense fallback={<div>Loading...</div>}>
					<TestBillingClient />
				</Suspense>
			</section>
		</div>
	);
}
