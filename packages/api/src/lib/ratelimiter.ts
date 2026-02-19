import { redis } from "@bounty/realtime";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Rate limit configurations per operation type
 * Using Upstash Redis for distributed rate limiting across all instances
 */
const RATE_LIMIT_CONFIGS = {
	// High-frequency read operations
	"read:default": { requests: 100, window: "1 m" },
	"read:list": { requests: 60, window: "1 m" },
	"read:detail": { requests: 120, window: "1 m" },

	// Write operations (more restrictive)
	"write:default": { requests: 30, window: "1 m" },
	"write:create": { requests: 10, window: "1 m" },
	"write:update": { requests: 20, window: "1 m" },
	"write:delete": { requests: 10, window: "1 m" },

	// Bounty-specific operations
	"bounty:create": { requests: 5, window: "1 m" },
	"bounty:comment": { requests: 15, window: "1 m" },
	"bounty:vote": { requests: 30, window: "1 m" },
	"bounty:apply": { requests: 10, window: "1 m" },

	// Payment operations (very restrictive)
	"payment:verify": { requests: 10, window: "1 m" },
	"payment:create": { requests: 5, window: "1 m" },

	// Webhook/notification endpoints (restrictive to prevent spam)
	"webhook:send": { requests: 5, window: "1 m" },
	"webhook:error": { requests: 10, window: "1 m" },

	// Admin operations
	"admin:default": { requests: 100, window: "1 m" },

	// Auth-related
	"auth:login": { requests: 10, window: "5 m" },
	"auth:register": { requests: 5, window: "10 m" },

	// Waitlist operations
	waitlist: { requests: 5, window: "1 m" },

	// Linear integration operations
	"linear:read": { requests: 60, window: "1 m" },
	"linear:create": { requests: 10, window: "1 m" },
	"linear:sync": { requests: 20, window: "1 m" },
	"linear:comment": { requests: 15, window: "1 m" },

	// Global fallback (for unspecified operations)
	global: { requests: 60, window: "1 m" },
} as const;

export type RateLimitOperation = keyof typeof RATE_LIMIT_CONFIGS;

// Cache for rate limiter instances
const rateLimiterCache = new Map<string, Ratelimit>();

/**
 * Get a rate limiter for a specific operation
 * Uses sliding window algorithm for smooth rate limiting
 */
export function getRateLimiter(
	operation: RateLimitOperation = "global",
): Ratelimit {
	const cached = rateLimiterCache.get(operation);
	if (cached) {
		return cached;
	}

	const config = RATE_LIMIT_CONFIGS[operation] || RATE_LIMIT_CONFIGS["global"];

	const limiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(config.requests, config.window),
		prefix: `bounty:ratelimit:${operation}`,
		analytics: true,
	});

	rateLimiterCache.set(operation, limiter);
	return limiter;
}

/**
 * Rate limit result with additional context
 */
export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
	retryAfter?: number;
}

/**
 * Check rate limit for a given identifier (user ID or IP)
 */
export async function checkRateLimit(
	identifier: string,
	operation: RateLimitOperation = "global",
): Promise<RateLimitResult> {
	const limiter = getRateLimiter(operation);
	const result = await limiter.limit(identifier);

	const retryAfter = result.success
		? undefined
		: Math.ceil((result.reset - Date.now()) / 1000);

	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
		...(retryAfter !== undefined && { retryAfter }),
	};
}

/**
 * Create a rate limit key from user ID and/or IP
 * Prefers user ID for authenticated requests, falls back to IP
 */
export function createRateLimitKey(userId?: string, clientIP?: string): string {
	if (userId) {
		return `user:${userId}`;
	}
	return `ip:${clientIP || "unknown"}`;
}
