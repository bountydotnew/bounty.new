export interface BetterAuthUser {
	id: string;
	name: string | null;
	email: string;
	emailVerified: boolean;
	image?: string;
	// Role: 'user' | 'admin' | 'early_access'
	role: string;
	banned: boolean;
	banReason?: string;
	banExpires?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface BetterAuthSessionData {
	id: string;
	expiresAt: Date;
	token: string;
	createdAt: Date;
	updatedAt: Date;
	ipAddress?: string;
	userAgent?: string;
	userId: string;
	impersonatedBy?: string;
	activeOrganizationId?: string | null;
}

export interface BetterAuthSession {
	user: BetterAuthUser;
	session: BetterAuthSessionData;
}

export interface ExtendedAuthSession extends BetterAuthSession {
	impersonatedBy?: string;
	session: BetterAuthSessionData & {
		impersonatedBy?: string;
	};
}

/**
 * Slugs that cannot be used as organization slugs because they conflict
 * with top-level static routes in the Next.js app. If an org uses one of
 * these slugs, routes like /{slug}/integrations will be shadowed by the
 * static route (e.g. /bounty/[id]) and break.
 *
 * Derived from: all top-level directories and route-group children in
 * apps/web/src/app/ that produce URL segments.
 */
export const RESERVED_SLUGS = new Set([
	// (auth) group routes
	"bookmarks",
	"bounties",
	"bounty",
	"dashboard",
	"device",
	"profile",
	// (login) group routes
	"login",
	"sign-up",
	"reset-password",
	"migrate-account",
	// (settings) group routes
	"settings",
	// Top-level static routes
	"api",
	"auth",
	"blog",
	"contributors",
	"early-access-required",
	"onboarding",
	"org",
	"ping",
	"pricing",
	"privacy",
	"roadmap",
	"success",
	"terms",
	"test",
	"topic",
	"waitlist",
	// Common reserved words
	"admin",
	"app",
	"www",
	"help",
	"support",
	"about",
	"new",
]);

/** Check if a slug is reserved (case-insensitive). */
export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.has(slug.toLowerCase());
}

// Reason codes used to classify auth/authorization client UX
export const ReasonCode = {
	Unauthenticated: "unauthenticated",
	EarlyAccessRequired: "early_access_required",
	EmailUnverified: "email_unverified",
	Banned: "banned",
	PlanRequired: "plan_required",
	Forbidden: "forbidden",
	NoActiveOrg: "no_active_org",
} as const;
export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];
