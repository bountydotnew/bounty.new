import { describe, test, expect, beforeEach } from "bun:test";
import { redis } from "@bounty/realtime";
import {
	getRateLimiter,
	checkRateLimit,
	createRateLimitKey,
	type RateLimitResult,
	type RateLimitOperation,
} from "./ratelimiter";

describe("Rate Limiter", () => {
	const testUserId = "test-user-123";
	const testIP = "192.168.1.1";

	// Clean up Redis before each test
	beforeEach(async () => {
		// Clear all rate limit keys for our test identifiers
		const operations: RateLimitOperation[] = [
			"global",
			"read:default",
			"read:list",
			"write:create",
			"bounty:create",
			"payment:verify",
			"auth:login",
		];

		for (const op of operations) {
			// Delete the specific identifier keys
			await redis.del(`bounty:ratelimit:${op}:${testUserId}`);
			await redis.del(`bounty:ratelimit:${op}:user:${testUserId}`);
			await redis.del(`bounty:ratelimit:${op}:ip:${testIP}`);
		}
	});

	describe("getRateLimiter", () => {
		test("should return a Ratelimit instance", () => {
			const limiter = getRateLimiter("global");

			expect(limiter).toBeDefined();
			expect(typeof limiter.limit).toBe("function");
		});

		test("should cache and return same instance for same operation", () => {
			const limiter1 = getRateLimiter("global");
			const limiter2 = getRateLimiter("global");

			expect(limiter1).toBe(limiter2);
		});

		test("should return different instances for different operations", () => {
			const limiter1 = getRateLimiter("global");
			const limiter2 = getRateLimiter("bounty:create");

			expect(limiter1).not.toBe(limiter2);
		});

		test("should fallback to global config for unknown operation", () => {
			// This shouldn't throw, should use global config
			const limiter = getRateLimiter(undefined as any);
			expect(limiter).toBeDefined();
		});
	});

	describe("checkRateLimit", () => {
		test("should allow requests within limit", async () => {
			const result = await checkRateLimit(testUserId, "global");

			expect(result.success).toBe(true);
			expect(result.remaining).toBeGreaterThanOrEqual(0);
			expect(result.limit).toBeGreaterThan(0);
			expect(result.reset).toBeGreaterThan(Date.now());
			expect(result.retryAfter).toBeUndefined();
		});

		test("should decrement remaining count", async () => {
			const result1 = await checkRateLimit(testUserId, "read:default");
			const result2 = await checkRateLimit(testUserId, "read:default");

			expect(result1.remaining).toBeGreaterThan(result2.remaining);
		});

		test("should have correct limit for each operation type", async () => {
			const globalResult = await checkRateLimit(
				`${testUserId}-global`,
				"global",
			);
			expect(globalResult.limit).toBe(60);

			const readResult = await checkRateLimit(
				`${testUserId}-read`,
				"read:default",
			);
			expect(readResult.limit).toBe(100);

			const writeResult = await checkRateLimit(
				`${testUserId}-write`,
				"write:create",
			);
			expect(writeResult.limit).toBe(10);

			const bountyResult = await checkRateLimit(
				`${testUserId}-bounty`,
				"bounty:create",
			);
			expect(bountyResult.limit).toBe(5);

			const paymentResult = await checkRateLimit(
				`${testUserId}-payment`,
				"payment:create",
			);
			expect(paymentResult.limit).toBe(5);

			const authResult = await checkRateLimit(
				`${testUserId}-auth`,
				"auth:login",
			);
			expect(authResult.limit).toBe(10);
		});

		test("should return retryAfter when limit exceeded", async () => {
			// Use a low-limit operation for faster testing
			const identifier = `${testUserId}-exceed`;
			const operation: RateLimitOperation = "bounty:create"; // 5 requests per minute

			// Exhaust the limit
			for (let i = 0; i < 5; i++) {
				const result = await checkRateLimit(identifier, operation);
				expect(result.success).toBe(true);
			}

			// Next request should be rate limited
			const exceededResult = await checkRateLimit(identifier, operation);

			expect(exceededResult.success).toBe(false);
			expect(exceededResult.remaining).toBe(0);
			expect(exceededResult.retryAfter).toBeDefined();
			expect(exceededResult.retryAfter).toBeGreaterThan(0);
			expect(exceededResult.retryAfter).toBeLessThanOrEqual(60);
		});

		test("should include all required fields in result", async () => {
			const result = await checkRateLimit(testUserId, "global");

			expect(Object.keys(result).sort()).toEqual(
				["limit", "remaining", "reset", "success"].sort(),
			);
		});

		test("should track separate limits for different identifiers", async () => {
			const user1 = `${testUserId}-1`;
			const user2 = `${testUserId}-2`;

			// Exhaust limit for user1
			for (let i = 0; i < 5; i++) {
				await checkRateLimit(user1, "bounty:create");
			}

			// User1 should be rate limited
			const user1Result = await checkRateLimit(user1, "bounty:create");
			expect(user1Result.success).toBe(false);

			// User2 should still have quota
			const user2Result = await checkRateLimit(user2, "bounty:create");
			expect(user2Result.success).toBe(true);
		});

		test("should track separate limits for different operations", async () => {
			const identifier = `${testUserId}-multi-op`;

			// Exhaust bounty:create limit
			for (let i = 0; i < 5; i++) {
				await checkRateLimit(identifier, "bounty:create");
			}

			// bounty:create should be rate limited
			const bountyResult = await checkRateLimit(identifier, "bounty:create");
			expect(bountyResult.success).toBe(false);

			// But read:default should still work (different limit)
			const readResult = await checkRateLimit(identifier, "read:default");
			expect(readResult.success).toBe(true);
		});

		test("should return reset time in the future", async () => {
			const result = await checkRateLimit(testUserId, "global");

			const now = Date.now();
			expect(result.reset).toBeGreaterThan(now);

			// Reset should be within a reasonable window (1 minute + some buffer)
			expect(result.reset).toBeLessThan(now + 70000);
		});
	});

	describe("createRateLimitKey", () => {
		test("should use user ID when provided", () => {
			const key = createRateLimitKey("user-123", "192.168.1.1");

			expect(key).toBe("user:user-123");
		});

		test("should fall back to IP when no user ID", () => {
			const key = createRateLimitKey(undefined, "192.168.1.1");

			expect(key).toBe("ip:192.168.1.1");
		});

		test("should use unknown when no user ID or IP", () => {
			const key = createRateLimitKey(undefined, undefined);

			expect(key).toBe("ip:unknown");
		});

		test("should prefer user ID even when IP is provided", () => {
			const key = createRateLimitKey("user-abc", "10.0.0.1");

			expect(key).toBe("user:user-abc");
		});

		test("should handle empty string user ID", () => {
			const key = createRateLimitKey("", "192.168.1.1");

			// Empty string is falsy, should fall back to IP
			expect(key).toBe("ip:192.168.1.1");
		});
	});

	describe("Integration: Rate Limiting Flow", () => {
		test("should handle typical API rate limiting scenario", async () => {
			const userId = `${testUserId}-flow`;
			const operation: RateLimitOperation = "write:create"; // 10 requests/min

			// Simulate API requests
			const results: RateLimitResult[] = [];
			for (let i = 0; i < 12; i++) {
				const result = await checkRateLimit(userId, operation);
				results.push(result);
			}

			// First 10 should succeed
			for (let i = 0; i < 10; i++) {
				expect(results[i].success).toBe(true);
			}

			// Last 2 should be rate limited
			expect(results[10].success).toBe(false);
			expect(results[11].success).toBe(false);

			// Check rate limited responses have retryAfter
			expect(results[10].retryAfter).toBeDefined();
			expect(results[11].retryAfter).toBeDefined();
		});

		test("should work with createRateLimitKey and checkRateLimit together", async () => {
			const key = createRateLimitKey(testUserId, testIP);
			const result = await checkRateLimit(key, "read:default");

			expect(result.success).toBe(true);
			expect(result.limit).toBe(100);
		});
	});

	describe("Rate Limit Configuration Coverage", () => {
		const operationConfigs: { op: RateLimitOperation; limit: number }[] = [
			{ op: "read:default", limit: 100 },
			{ op: "read:list", limit: 60 },
			{ op: "read:detail", limit: 120 },
			{ op: "write:default", limit: 30 },
			{ op: "write:create", limit: 10 },
			{ op: "write:update", limit: 20 },
			{ op: "write:delete", limit: 10 },
			{ op: "bounty:create", limit: 5 },
			{ op: "bounty:comment", limit: 15 },
			{ op: "bounty:vote", limit: 30 },
			{ op: "bounty:apply", limit: 10 },
			{ op: "payment:verify", limit: 10 },
			{ op: "payment:create", limit: 5 },
			{ op: "webhook:send", limit: 5 },
			{ op: "webhook:error", limit: 10 },
			{ op: "admin:default", limit: 100 },
			{ op: "auth:login", limit: 10 },
			{ op: "auth:register", limit: 5 },
			{ op: "waitlist", limit: 5 },
			{ op: "global", limit: 60 },
		];

		test.each(operationConfigs)("$op should have correct limit", async ({
			op,
			limit,
		}) => {
			const result = await checkRateLimit(`${testUserId}-${op}`, op);
			expect(result.limit).toBe(limit);
		});
	});
});
