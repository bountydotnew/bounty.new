"use client";

import { parseAsString, useQueryState } from "nuqs";
import { LINKS } from "@/constants";
import { LoginSection } from "./login-section";

export default function LoginPageClient() {
	const [callbackParam] = useQueryState("callback", parseAsString);
	const callbackUrl = callbackParam || LINKS.DASHBOARD;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
			<LoginSection callbackUrl={callbackUrl} />
		</div>
	);
}
