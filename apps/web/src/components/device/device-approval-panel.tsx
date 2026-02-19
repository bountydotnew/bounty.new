"use client";

import { authClient } from "@bounty/auth/client";
import { useSession } from "@/context/session-context";
import { Badge } from "@bounty/ui/components/badge";
import { Button } from "@bounty/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@bounty/ui/components/card";
import { Spinner } from "@bounty/ui/components/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";

type DeviceStatus = "pending" | "approved" | "denied";
type ActionType = "approve" | "deny" | null;

interface DeviceApprovalPanelProps {
	userCode: string;
}

interface DeviceState {
	status: DeviceStatus | null;
	isLoading: boolean;
	error: string | null;
	actionLoading: ActionType;
}

type DeviceAction =
	| { type: "START_LOADING" }
	| { type: "SET_STATUS"; status: DeviceStatus }
	| { type: "SET_ERROR"; error: string }
	| { type: "CLEAR_ERROR" }
	| { type: "STOP_LOADING" }
	| { type: "START_ACTION"; action: ActionType }
	| { type: "STOP_ACTION" }
	| { type: "RESET" };

const initialState: DeviceState = {
	status: null,
	isLoading: true,
	error: null,
	actionLoading: null,
};

function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
	switch (action.type) {
		case "START_LOADING":
			return { ...state, isLoading: true, error: null };
		case "SET_STATUS":
			return { ...state, status: action.status };
		case "SET_ERROR":
			return { ...state, error: action.error, status: null };
		case "CLEAR_ERROR":
			return { ...state, error: null };
		case "STOP_LOADING":
			return { ...state, isLoading: false };
		case "START_ACTION":
			return { ...state, actionLoading: action.action, error: null };
		case "STOP_ACTION":
			return { ...state, actionLoading: null };
		case "RESET":
			return {
				status: null,
				isLoading: false,
				error: "Missing device code.",
				actionLoading: null,
			};
		default:
			return state;
	}
}

const normalizeCode = (value: string) =>
	value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const formatForDisplay = (value: string) => {
	const normalized = normalizeCode(value);
	if (!normalized) {
		return "";
	}
	return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
};

const STATUS_TEXT: Record<DeviceStatus, { label: string; tone: string }> = {
	pending: {
		label: "Awaiting approval",
		tone: "bg-amber-500/10 text-amber-400",
	},
	approved: { label: "Approved", tone: "bg-emerald-500/10 text-emerald-400" },
	denied: { label: "Denied", tone: "bg-red-500/10 text-red-400" },
};

const getErrorMessage = (error: unknown, fallback: string): string => {
	return error instanceof Error ? error.message : fallback;
};

const getActionSuccessMessage = (type: "approve" | "deny"): string => {
	return type === "approve"
		? "Device approved. You can return to the requesting device."
		: "Device denied. The requesting device has been notified.";
};

export const DeviceApprovalPanel = ({ userCode }: DeviceApprovalPanelProps) => {
	const router = useRouter();
	const sanitizedCode = useMemo(() => normalizeCode(userCode), [userCode]);
	const [state, dispatch] = useReducer(deviceReducer, initialState);
	const { session, isPending: sessionLoading } = useSession();

	useEffect(() => {
		if (!(sessionLoading || session?.user) && sanitizedCode) {
			router.replace(
				`/login?redirect=/device/approve?user_code=${sanitizedCode}`,
			);
		}
	}, [router, sanitizedCode, session, sessionLoading]);

	useEffect(() => {
		if (!sanitizedCode) {
			dispatch({ type: "RESET" });
			return;
		}

		let active = true;

		const fetchStatus = async () => {
			dispatch({ type: "START_LOADING" });

			const response = await authClient.device({
				query: { user_code: sanitizedCode },
			});

			if (!active) {
				return;
			}

			if (!response.data) {
				throw new Error(
					response.error?.error_description || "Unable to load device request.",
				);
			}

			dispatch({
				type: "SET_STATUS",
				status: response.data.status as DeviceStatus,
			});
		};

		const loadDeviceStatus = async () => {
			try {
				await fetchStatus();
				if (active) {
					dispatch({ type: "STOP_LOADING" });
				}
			} catch (fetchError) {
				if (active) {
					const message = getErrorMessage(
						fetchError,
						"Unable to load device request.",
					);
					dispatch({ type: "SET_ERROR", error: message });
				}
				if (active) {
					dispatch({ type: "STOP_LOADING" });
				}
			}
		};

		loadDeviceStatus();

		return () => {
			active = false;
		};
	}, [sanitizedCode]);

	const executeDeviceAction = async (type: "approve" | "deny") => {
		const action =
			type === "approve"
				? authClient.device.approve({ userCode: sanitizedCode })
				: authClient.device.deny({ userCode: sanitizedCode });

		const response = await action;

		if (response.error) {
			const errorMessage =
				"error_description" in response.error
					? response.error.error_description
					: response.error || "An error occurred";
			throw new Error(errorMessage);
		}

		return type === "approve" ? "approved" : "denied";
	};

	const handleAction = async (type: "approve" | "deny") => {
		if (!sanitizedCode) {
			return;
		}

		dispatch({ type: "START_ACTION", action: type });

		try {
			const nextStatus = await executeDeviceAction(type);
			dispatch({ type: "SET_STATUS", status: nextStatus as DeviceStatus });
			toast.success(getActionSuccessMessage(type));
			dispatch({ type: "STOP_ACTION" });
		} catch (actionError) {
			const message = getErrorMessage(
				actionError,
				"Unable to update device request.",
			);
			dispatch({ type: "SET_ERROR", error: message });
			toast.error(message);
			dispatch({ type: "STOP_ACTION" });
		}
	};

	const formattedCode = formatForDisplay(sanitizedCode);
	const currentStatus = state.status ? STATUS_TEXT[state.status] : null;

	return (
		<div className="mx-auto w-full max-w-3xl">
			<Card className="border border-muted bg-background text-foreground">
				<CardHeader className="gap-3">
					<CardTitle className="font-semibold text-2xl">
						Device authorization request
					</CardTitle>
					<CardDescription className="text-muted-foreground text-sm">
						Confirm that you want to grant access to the device using this code.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-8">
					<div className="flex flex-col gap-2">
						<span className="font-medium text-muted-foreground text-sm">
							Verification code
						</span>
						<div className="flex items-center gap-3">
							<span className="rounded-lg bg-neutral-900 px-3 py-2 font-mono text-lg tracking-[0.4rem]">
								{formattedCode || "—"}
							</span>
							{currentStatus && (
								<Badge
									className={`rounded-full px-3 py-1 text-xs ${currentStatus.tone}`}
								>
									{currentStatus.label}
								</Badge>
							)}
						</div>
					</div>

					{state.error && (
						<div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
							{state.error}
						</div>
					)}

					<div className="space-y-4">
						<h3 className="font-semibold text-lg">What happens next?</h3>
						<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
							<li>Approving grants the device a short-lived access token.</li>
							<li>
								Denying rejects the request and the device will show an error.
							</li>
							<li>Codes expire automatically if you take no action.</li>
						</ul>
					</div>

					<div className="flex flex-col gap-3 md:flex-row">
						<Button
							className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground"
							disabled={
								state.isLoading ||
								!!state.actionLoading ||
								state.status === "approved" ||
								!sanitizedCode
							}
							onClick={() => handleAction("approve")}
						>
							{state.actionLoading === "approve" ? (
								<span className="flex items-center justify-center gap-2">
									<Spinner size="sm" />
									Approving…
								</span>
							) : (
								"Approve"
							)}
						</Button>
						<Button
							className="h-11 flex-1 rounded-lg border border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900"
							disabled={
								state.isLoading ||
								!!state.actionLoading ||
								state.status === "denied" ||
								!sanitizedCode
							}
							onClick={() => handleAction("deny")}
							variant="secondary"
						>
							{state.actionLoading === "deny" ? (
								<span className="flex items-center justify-center gap-2">
									<Spinner size="sm" />
									Denying…
								</span>
							) : (
								"Deny"
							)}
						</Button>
					</div>

					{state.isLoading && (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Spinner size="sm" />
							Checking device status…
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
