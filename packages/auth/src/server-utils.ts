/**
 * Server-Side Auth Utilities
 *
 * Optimized utilities for server-side session retrieval.
 */

import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./server";
import type { AuthSession } from "./server";

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Get the current session server-side.
 * Uses React cache to deduplicate requests within the same render.
 *
 * @example
 * ```ts
 * const session = await getServerSession();
 * if (session?.user) {
 *   // User is authenticated
 * }
 * ```
 */
export const getServerSession = cache(async (): Promise<AuthSession | null> => {
	try {
		const headersList = await headers();
		const result = await auth.api.getSession({
			headers: headersList,
		});
		return result;
	} catch (error) {
		console.error("Failed to get server session:", error);
		return null;
	}
});

/**
 * Check if user is authenticated server-side.
 * Returns true if a valid session exists.
 *
 * @example
 * ```ts
 * const isAuthenticated = await isServerAuthenticated();
 * ```
 */
export const isServerAuthenticated = cache(async () => {
	const session = await getServerSession();
	return !!session?.user;
});

/**
 * Get the current user server-side.
 * Returns null if not authenticated.
 *
 * @example
 * ```ts
 * const user = await getServerUser();
 * if (user) {
 *   console.log('Hello,', user.name);
 * }
 * ```
 */
export const getServerUser = cache(async () => {
	const session = await getServerSession();
	return session?.user ?? null;
});

// ============================================================================
// Re-exports
// ============================================================================

export type { AuthSession, AuthUser } from "./server";
export { auth } from "./server";
