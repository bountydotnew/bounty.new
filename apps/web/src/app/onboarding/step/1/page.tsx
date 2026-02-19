import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@bounty/auth/server";
import { createServerCaller } from "@bounty/api/src/server-caller";
import OnboardingStep1Page from "./page-client";

export const metadata: Metadata = {
	title: "Get Started",
	description: "Set up your bounty.new account",
};

export default async function Page() {
	let shouldSkip = false;
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (session?.user?.id) {
			const caller = await createServerCaller(session.user.id);
			const waitlistData = await caller.onboarding.checkWaitlist();
			shouldSkip = waitlistData?.isOnWaitlist === false;
		}
	} catch {
		// If server-side check fails, let client handle it
	}

	if (shouldSkip) {
		redirect("/onboarding/step/2");
	}

	return <OnboardingStep1Page />;
}
