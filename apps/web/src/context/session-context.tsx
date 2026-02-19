"use client";

import { authClient } from "@bounty/auth/client";
import { createContext, useContext, useMemo, type ReactNode } from "react";

// Get the return type of authClient.useSession
type AuthSessionReturn = ReturnType<typeof authClient.useSession>;

interface SessionContextType {
	/** The full return value from authClient.useSession() */
	sessionHook: AuthSessionReturn;
	/** Convenience accessor for session data */
	session: AuthSessionReturn["data"];
	/** Whether the session is loading */
	isPending: boolean;
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
	children: ReactNode;
}

/**
 * SessionProvider - Provides a single session query at the app root
 *
 * This ensures all components share the same session query instead of
 * each calling authClient.useSession() independently, which can cause
 * multiple parallel requests before React Query cache is populated.
 *
 * Better Auth's useSession() hook uses React Query internally and should
 * already share queries across components. This context ensures we only
 * call useSession() once at the root level.
 */
export function SessionProvider({ children }: SessionProviderProps) {
	// Single useSession() call at root - all child components should use
	// useSession() from this context instead of authClient.useSession()
	const sessionHook = authClient.useSession();
	const { data: session, isPending } = sessionHook;
	const isAuthenticated = !!session?.user;

	const value = useMemo(
		() => ({
			sessionHook,
			session,
			isPending,
			isAuthenticated,
		}),
		[sessionHook, session, isPending, isAuthenticated],
	);

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
}

/**
 * useSession - Hook to access session from context
 *
 * Use this instead of authClient.useSession() directly to ensure
 * all components share the same session query from the root SessionProvider.
 */
export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSession must be used within SessionProvider");
	}
	return context;
}

/**
 * useSessionHook - Hook to get the full authClient.useSession() return value
 *
 * Use this when you need access to refetch, isRefetching, error, etc.
 * This is what AuthUIProvider expects for its hooks.useSession prop.
 */
export function useSessionHook(): AuthSessionReturn {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error("useSessionHook must be used within SessionProvider");
	}
	return context.sessionHook;
}
