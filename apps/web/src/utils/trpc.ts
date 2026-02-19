import type { AppRouter } from "@bounty/api";
import { QueryClient } from "@tanstack/react-query";
import {
	TRPCClientError,
	createTRPCClient,
	httpLink,
	loggerLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { showAppErrorToast } from "@/context/toast";
import type { ReasonCode } from "@bounty/types/auth";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Default staleTime for all queries (5 minutes)
			// This prevents excessive refetching on component mounts
			staleTime: 5 * 60 * 1000,
			// Keep data in cache for 10 minutes for Suspense transitions
			gcTime: 10 * 60 * 1000,
			// Reduce unnecessary refetches
			refetchOnWindowFocus: false,
			// Retry once on failure
			retry: 1,
		},
	},
});

const toastDeduper = new Map<string, number>();
const CLEANUP_INTERVAL = 60_000; // 1 minute
setInterval(() => {
	const now = Date.now();
	for (const [key, timestamp] of toastDeduper.entries()) {
		if (now - timestamp > 10_000) {
			// Remove entries older than 10s
			toastDeduper.delete(key);
		}
	}
}, CLEANUP_INTERVAL);
const maybeToastError = (err: unknown): void => {
	if (!(err instanceof TRPCClientError)) {
		return;
	}
	const data = (err as TRPCClientError<AppRouter>).data as unknown;
	const reason =
		typeof data === "object" &&
		data &&
		"reason" in (data as Record<string, unknown>)
			? (data as { reason?: ReasonCode }).reason
			: undefined;
	const meta = (err as TRPCClientError<AppRouter>).meta as unknown;
	const isBackground =
		typeof meta === "object" &&
		meta &&
		"reactQuery" in (meta as Record<string, unknown>)
			? Boolean((meta as Record<string, unknown>).reactQuery === "down")
			: false;
	if (
		isBackground &&
		(reason === "unauthenticated" || reason === "early_access_required")
	) {
		return;
	}
	const key = `${reason || "unknown"}:${err.message}`;
	const now = Date.now();
	const last = toastDeduper.get(key) || 0;
	if (now - last < 4000) {
		return;
	}
	toastDeduper.set(key, now);
	showAppErrorToast(reason, { messageOverride: err.message });
};

export const trpcClient = createTRPCClient<AppRouter>({
	links: [
		loggerLink({
			enabled: (opts) => {
				const isDev = process.env.NODE_ENV === "development";
				return (
					isDev || (opts.direction === "down" && opts.result instanceof Error)
				);
			},
		}),
		httpLink({
			url: `${process.env.NEXT_PUBLIC_API_URL || ""}/api/trpc`,
			// Enable batching - combines multiple requests into a single HTTP call
			fetch(input: RequestInfo | URL, init?: RequestInit) {
				return fetch(input, {
					...init,
					credentials: "include",
					headers: {
						...init?.headers,
						"Content-Type": "application/json",
					},
				})
					.then(async (res) => {
						if (!res.ok) {
							// Capture body for better error messages
							const text = await res.clone().text();
							try {
								JSON.parse(text);
							} catch {
								/* noop */
							}
						}
						return res;
					})
					.catch((e) => {
						maybeToastError(e);
						throw e;
					});
			},
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
