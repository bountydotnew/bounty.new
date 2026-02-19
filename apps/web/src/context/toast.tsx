import { toastManager } from "@bounty/ui/components/toast";
import type { ReasonCode } from "@bounty/types";

const MESSAGE_BY_REASON: Record<ReasonCode, string> = {
	unauthenticated: "Please sign in to continue.",
	early_access_required: "Early access required to use this area.",
	email_unverified: "Verify your email to continue.",
	banned: "Your account is suspended. Contact support.",
	plan_required: "An upgraded plan is required to use this feature.",
	forbidden: "You don't have permission to perform this action.",
	no_active_org: "Please select a team to continue.",
};

const dedupe = new Map<string, number>();

export function showAppErrorToast(
	reason: ReasonCode | undefined,
	opts?: { messageOverride?: string },
): void {
	const key = `${reason || "unknown"}:${opts?.messageOverride || ""}`;
	const now = Date.now();
	const last = dedupe.get(key) || 0;
	if (now - last < 3000) {
		return;
	}
	dedupe.set(key, now);

	const message =
		opts?.messageOverride || (reason ? MESSAGE_BY_REASON[reason] : undefined);

	toastManager.add({
		title: message || "Something went wrong. Please try again.",
		type: "error",
	});
}

// Compatibility layer for the old sonner toast API
export const toast = {
	success: (message: string, opts?: { description?: string }) => {
		toastManager.add({
			title: message,
			description: opts?.description,
			type: "success",
		});
	},
	error: (message: string, opts?: { description?: string }) => {
		toastManager.add({
			title: message,
			description: opts?.description,
			type: "error",
		});
	},
	warning: (message: string, opts?: { description?: string }) => {
		toastManager.add({
			title: message,
			description: opts?.description,
			type: "warning",
		});
	},
	info: (message: string, opts?: { description?: string }) => {
		toastManager.add({
			title: message,
			description: opts?.description,
			type: "info",
		});
	},
	loading: (message: string, opts?: { description?: string }) => {
		return toastManager.add({
			title: message,
			description: opts?.description,
			type: "loading",
		});
	},
	dismiss: (id?: string) => {
		if (id) {
			toastManager.close(id);
		}
	},
};
