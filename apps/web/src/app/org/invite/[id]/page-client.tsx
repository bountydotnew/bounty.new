"use client";

import { useEffect, useReducer, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@bounty/auth/client";
import { toast } from "sonner";
import Link from "next/link";

interface PageState {
	isLoading: boolean;
	error: string | null;
}

type PageAction =
	| { type: "START" }
	| { type: "SET_ERROR"; error: string }
	| { type: "STOP_LOADING" }
	| { type: "RESET" };

const initialState: PageState = { isLoading: true, error: null };

function pageReducer(state: PageState, action: PageAction): PageState {
	switch (action.type) {
		case "START":
			return { isLoading: true, error: null };
		case "SET_ERROR":
			return { isLoading: false, error: action.error };
		case "STOP_LOADING":
			return { ...state, isLoading: false };
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

export default function OrgInvitationAcceptPage() {
	const params = useParams();
	const router = useRouter();
	const [state, dispatch] = useReducer(pageReducer, initialState);
	const invitationId = params.id as string;
	const hasAccepted = useRef(false);

	useEffect(() => {
		if (hasAccepted.current) return;

		let cancelled = false;

		const acceptInvitation = async () => {
			if (!invitationId) {
				dispatch({ type: "SET_ERROR", error: "Invalid invitation link" });
				return;
			}

			hasAccepted.current = true;

			try {
				const result = await authClient.organization.acceptInvitation({
					invitationId,
				});

				if (cancelled) return;

				if (result.error) {
					console.error("Failed to accept invitation:", result.error);
					const msg = result.error.message ?? "Failed to accept invitation";
					dispatch({ type: "SET_ERROR", error: msg });
					toast.error(msg);
				} else {
					toast.success("Invitation accepted! Welcome to the team.");
					const orgId = result.data?.invitation?.organizationId;
					if (orgId) {
						const orgs = await authClient.organization.list();
						if (cancelled) return;
						const org = orgs.data?.find((o: { id: string }) => o.id === orgId);
						if (org?.slug) {
							router.push(`/${org.slug}/integrations`);
						} else {
							router.push("/dashboard");
						}
					} else {
						router.push("/dashboard");
					}
				}
				if (!cancelled) {
					dispatch({ type: "STOP_LOADING" });
				}
			} catch (err) {
				if (cancelled) return;
				console.error("Error accepting invitation:", err);
				dispatch({ type: "SET_ERROR", error: "An unexpected error occurred" });
				toast.error("An unexpected error occurred");
				if (!cancelled) {
					dispatch({ type: "STOP_LOADING" });
				}
			}
		};

		acceptInvitation();

		return () => {
			cancelled = true;
		};
	}, [invitationId, router]);

	if (state.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-foreground mx-auto mb-4" />
					<h1 className="text-lg font-medium text-foreground">
						Accepting invitation...
					</h1>
					<p className="text-sm text-text-muted mt-1">
						Please wait while we add you to the team
					</p>
				</div>
			</div>
		);
	}

	if (state.error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center max-w-md px-4">
					<div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
						<svg
							className="h-6 w-6 text-red-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h1 className="text-xl font-semibold text-foreground mb-2">
						Invitation Error
					</h1>
					<p className="text-text-muted mb-6">{state.error}</p>
					<div className="flex flex-col gap-2">
						<Link
							href="/dashboard"
							className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
						>
							Go to Dashboard
						</Link>
						<Link
							href="/"
							className="inline-flex items-center justify-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
						>
							Go Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-foreground mx-auto mb-4" />
				<h1 className="text-lg font-medium text-foreground">Redirecting...</h1>
			</div>
		</div>
	);
}
