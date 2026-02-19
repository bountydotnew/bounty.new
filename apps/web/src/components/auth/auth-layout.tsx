"use client";

import type { AuthLayoutProps } from "@bounty/types";

/**
 * AuthLayout - Provides layout structure (sidebar, etc.) but does NOT enforce authentication
 * Use AuthGuard on individual pages that need protection
 */
export function AuthLayout({ children }: AuthLayoutProps) {
	return <>{children}</>;
}
