import { useQueries } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useSession } from "@/context/session-context";

/**
 * Hook to batch-fetch essential data on initial app load
 *
 * This prefetches common queries in parallel, which tRPC will batch
 * into a single HTTP request (if they happen in the same tick).
 *
 * Data fetched:
 * - User profile (getMe)
 *
 * @param enabled - Whether to fetch data (should be true when user is authenticated)
 */
export function useInitialData(enabled = true) {
	const { isAuthenticated } = useSession();
	const shouldFetch = enabled && isAuthenticated;

	// Fetch essential user data
	const meQuery = useQueries({
		queries: [
			{
				...trpc.user.getMe.queryOptions(),
				enabled: shouldFetch,
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		],
	})[0];

	return {
		me: meQuery.data,
		isLoading: meQuery.isLoading,
		isError: meQuery.isError,
		error: meQuery.error,
	};
}
