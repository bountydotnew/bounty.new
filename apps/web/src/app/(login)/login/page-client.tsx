"use client";

import { Spinner } from "@bounty/ui/components/spinner";
import { useMutation } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Suspense, useEffect, useRef } from "react";
import LoginPageClient from "@/components/login/login.page.client";
import { trpcClient } from "@/utils/trpc";

function LoginContent() {
	const [token] = useQueryState("invite", parseAsString);

	// Apply invite token via useMutation — fires once per token
	const appliedTokenRef = useRef<string | null>(null);
	const applyInvite = useMutation({
		mutationFn: (inviteToken: string) =>
			trpcClient.user.applyInvite.mutate({ token: inviteToken }),
	});

	useEffect(() => {
		if (token && appliedTokenRef.current !== token) {
			appliedTokenRef.current = token;
			applyInvite.mutate(token);
		}
	}, [token]); // eslint-disable-line react-hooks/exhaustive-deps
	// const handleGitHubSignIn = async () => {
	//   try {
	//     const callbackURL = redirectUrl ? `${redirectUrl}` : `${baseUrl}/dashboard`;

	//     await authClient.signIn.social(
	//       {
	//         provider: "github",
	//         callbackURL
	//       },
	//       {
	//         onSuccess: () => {
	//           toast.success("Sign in successful");
	//         },
	//         onError: (error) => {
	//           toast.error(error.error.message || "Sign in failed");
	//         },
	//       }
	//     );
	//   } catch (error) {
	//     toast.error(error instanceof Error ? error.message : "Sign in failed");
	//   }
	// };

	return <LoginPageClient />;
}

export default function LoginPage() {
	return (
		<div className="mx-auto w-full bg-landing-background">
			{/* <Header /> */}
			<Suspense
				fallback={
					<div className="flex h-screen items-center justify-center">
						<Spinner />
					</div>
				}
			>
				<LoginContent />
			</Suspense>
		</div>
	);
}
