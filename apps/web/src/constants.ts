// =====================
// RESERVED TEAM SLUGS
// =====================

/**
 * Slugs that cannot be used as team (organization) slugs because they
 * conflict with top-level static routes in the Next.js app.
 */
const RESERVED_TEAM_SLUGS = [
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
] as const;

/** Check if a slug is reserved (case-insensitive). */
export function isReservedSlug(slug: string): boolean {
	return (RESERVED_TEAM_SLUGS as readonly string[]).includes(
		slug.toLowerCase(),
	);
}

// Dashboard constants
export const PAGINATION_LIMITS = {
	ALL_BOUNTIES: 10,
	MY_BOUNTIES: 5,
	MY_BOUNTIES_SIDEBAR: 3,
} as const;

export const PAGINATION_DEFAULTS = {
	PAGE: 1,
} as const;

export const LOADING_SKELETON_COUNTS = {
	BOUNTIES: 5,
	MY_BOUNTIES: 3,
} as const;

const SOCIALS = {
	GITHUB: "https://github.com/bountydotnew/bounty.new",
};

export const LINKS = {
	SOCIALS,
	HOME: "/",
	DASHBOARD: "/dashboard",
	LOGIN: "/login",
	BOOKMARKS: "/bookmarks",
	CONTRIBUTORS: "/contributors",
	BLOG: "/blog",
	PRICING: "/pricing",
	TERMS: "/terms",
	PRIVACY: "/privacy",
	CONTACT: "/contact",
	BOUNTY: {
		VIEW: "/bounty",
	},
	BOUNTIES: "/bounties",
};
