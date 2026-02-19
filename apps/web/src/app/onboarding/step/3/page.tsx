import type { Metadata } from "next";
import OnboardingStep3Page from "./page-client";

export const metadata: Metadata = {
	title: "Create Organization",
	description: "Set up your organization",
};

export default function Page() {
	return <OnboardingStep3Page />;
}
