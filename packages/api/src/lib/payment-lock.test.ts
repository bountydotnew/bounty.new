import { describe, test, expect, beforeEach } from "bun:test";
import { redis } from "@bounty/realtime";
import {
	acquirePaymentLock,
	withPaymentLock,
	isPaymentLocked,
	PaymentLockError,
	createIdempotencyKey,
	wasOperationPerformed,
	markOperationPerformed,
} from "./payment-lock";

describe("Payment Lock", () => {
	const testBountyId = "test-bounty-123";

	beforeEach(async () => {
		// Clean up any leftover locks
		await redis.del(`bounty:payment-lock:${testBountyId}`);
		await redis.del(`bounty:idempotency:create-payment:${testBountyId}`);
		await redis.del(`bounty:idempotency:webhook:${testBountyId}`);
	});

	describe("acquirePaymentLock", () => {
		test("should acquire lock and return release function", async () => {
			const release = await acquirePaymentLock(testBountyId);

			expect(release).not.toBeNull();
			expect(typeof release).toBe("function");

			// Verify lock exists in Redis
			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(true);

			// Release the lock
			await release!();

			// Verify lock is released
			const isStillLocked = await isPaymentLocked(testBountyId);
			expect(isStillLocked).toBe(false);
		});

		test("should fail to acquire lock if already held", async () => {
			const release1 = await acquirePaymentLock(testBountyId);
			expect(release1).not.toBeNull();

			// Try to acquire the same lock again
			const release2 = await acquirePaymentLock(testBountyId, {
				maxRetries: 1,
				retryDelay: 10,
			});
			expect(release2).toBeNull();

			// Cleanup
			await release1!();
		});

		test("should allow acquiring lock after previous lock is released", async () => {
			const release1 = await acquirePaymentLock(testBountyId);
			expect(release1).not.toBeNull();

			await release1!();

			// Now we should be able to acquire again
			const release2 = await acquirePaymentLock(testBountyId);
			expect(release2).not.toBeNull();

			await release2!();
		});

		test("should only release own lock (value comparison)", async () => {
			const release1 = await acquirePaymentLock(testBountyId, { ttl: 10 });
			expect(release1).not.toBeNull();

			// Simulate lock expiring and being acquired by another process
			await redis.del(`bounty:payment-lock:${testBountyId}`);
			const release2 = await acquirePaymentLock(testBountyId, { ttl: 10 });
			expect(release2).not.toBeNull();

			// Original release should not delete the new lock
			await release1!();

			// Lock should still exist (held by release2)
			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(true);

			// Cleanup
			await release2!();
		});

		test("should respect custom TTL", async () => {
			const release = await acquirePaymentLock(testBountyId, { ttl: 1 });
			expect(release).not.toBeNull();

			// Wait for lock to expire
			await new Promise((resolve) => setTimeout(resolve, 1100));

			// Lock should have expired
			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(false);
		});

		test("should retry on failure", async () => {
			// Acquire first lock
			const release1 = await acquirePaymentLock(testBountyId);
			expect(release1).not.toBeNull();

			// Try to acquire with retries - release the lock during retries
			const startTime = Date.now();
			let release2: ((() => Promise<void>) | null) | null = null;

			// Release the lock after 50ms, before the retry attempt
			setTimeout(async () => {
				await release1!();
			}, 50);

			// This should acquire the lock on retry
			release2 = await acquirePaymentLock(testBountyId, {
				maxRetries: 3,
				retryDelay: 100,
			});

			const elapsed = Date.now() - startTime;
			expect(release2).not.toBeNull();
			expect(elapsed).toBeGreaterThan(40); // At least one retry delay

			// Cleanup
			await release2!();
		});
	});

	describe("withPaymentLock", () => {
		test("should execute operation with lock", async () => {
			let operationRan = false;

			const result = await withPaymentLock(testBountyId, async () => {
				operationRan = true;
				return "success";
			});

			expect(operationRan).toBe(true);
			expect(result).toBe("success");
		});

		test("should release lock even if operation throws", async () => {
			let lockReleased = false;

			try {
				await withPaymentLock(testBountyId, async () => {
					// Check lock is held during operation
					const isLocked = await isPaymentLocked(testBountyId);
					expect(isLocked).toBe(true);
					throw new Error("Operation failed");
				});
			} catch (e: any) {
				expect(e.message).toBe("Operation failed");
			}

			// Lock should be released
			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(false);
		});

		test("should throw PaymentLockError if lock cannot be acquired", async () => {
			// Acquire lock first
			const release = await acquirePaymentLock(testBountyId);
			expect(release).not.toBeNull();

			let errorThrown = false;
			let errorType = "";

			try {
				await withPaymentLock(
					testBountyId,
					async () => {
						throw new Error("Should not run");
					},
					{ maxRetries: 1, retryDelay: 10 },
				);
			} catch (e) {
				errorThrown = true;
				errorType =
					e instanceof PaymentLockError ? "PaymentLockError" : "Other";
			}

			expect(errorThrown).toBe(true);
			expect(errorType).toBe("PaymentLockError");

			// Cleanup
			await release!();
		});

		test("should run operations sequentially when called multiple times", async () => {
			const executionOrder: number[] = [];

			// Start two operations concurrently
			const promise1 = withPaymentLock(testBountyId, async () => {
				executionOrder.push(1);
				await new Promise((resolve) => setTimeout(resolve, 50));
				executionOrder.push(2);
			});

			const promise2 = withPaymentLock(testBountyId, async () => {
				executionOrder.push(3);
				await new Promise((resolve) => setTimeout(resolve, 50));
				executionOrder.push(4);
			});

			await Promise.all([promise1, promise2]);

			// First operation should complete before second starts
			expect(executionOrder).toEqual([1, 2, 3, 4]);
		});
	});

	describe("isPaymentLocked", () => {
		test("should return false when no lock exists", async () => {
			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(false);
		});

		test("should return true when lock exists", async () => {
			const release = await acquirePaymentLock(testBountyId);
			expect(release).not.toBeNull();

			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(true);

			await release!();
		});

		test("should return false after lock expires", async () => {
			const release = await acquirePaymentLock(testBountyId, { ttl: 1 });
			expect(release).not.toBeNull();

			// Wait for expiration
			await new Promise((resolve) => setTimeout(resolve, 1100));

			const isLocked = await isPaymentLocked(testBountyId);
			expect(isLocked).toBe(false);
		});
	});

	describe("Idempotency Keys", () => {
		const testOperation = "create-payment";
		const testBounty = "bounty-456";

		beforeEach(async () => {
			// Clean up idempotency keys
			await redis.del(`bounty:idempotency:${testOperation}:${testBounty}`);
			await redis.del(`bounty:idempotency:webhook:${testBounty}`);
			await redis.del(`bounty:idempotency:webhook:${testBounty}:extra`);
		});

		describe("createIdempotencyKey", () => {
			test("should create and return new idempotency key", async () => {
				const key = await createIdempotencyKey(testOperation, testBounty);

				expect(key).not.toBeNull();
				expect(typeof key).toBe("string");
				expect(key).toContain(testOperation);
				expect(key).toContain(testBounty);
			});

			test("should return null for duplicate operation", async () => {
				const key1 = await createIdempotencyKey(testOperation, testBounty);
				expect(key1).not.toBeNull();

				const key2 = await createIdempotencyKey(testOperation, testBounty);
				expect(key2).toBeNull(); // Already performed
			});

			test("should handle additional context", async () => {
				const key1 = await createIdempotencyKey(
					testOperation,
					testBounty,
					"context-1",
				);
				expect(key1).not.toBeNull();

				// Same context should be duplicate
				const key2 = await createIdempotencyKey(
					testOperation,
					testBounty,
					"context-1",
				);
				expect(key2).toBeNull();

				// Different context should be new
				const key3 = await createIdempotencyKey(
					testOperation,
					testBounty,
					"context-2",
				);
				expect(key3).not.toBeNull();
			});

			test("should allow retry after TTL expires", async () => {
				// Note: This test would require modifying the TTL to be shorter
				// For now, we just verify the key is stored with TTL
				const key = await createIdempotencyKey(testOperation, testBounty);
				expect(key).not.toBeNull();

				// Check that key has TTL set
				const redisKey = `bounty:idempotency:${testOperation}:${testBounty}`;
				const ttl = await redis.ttl(redisKey);
				expect(ttl).toBeGreaterThan(0);
			});
		});

		describe("wasOperationPerformed", () => {
			test("should return false for new operation", async () => {
				const performed = await wasOperationPerformed("webhook", testBounty);
				expect(performed).toBe(false);
			});

			test("should return true after creating idempotency key", async () => {
				await createIdempotencyKey("webhook", testBounty);

				const performed = await wasOperationPerformed("webhook", testBounty);
				expect(performed).toBe(true);
			});

			test("should return true after marking operation performed", async () => {
				await markOperationPerformed("webhook", testBounty, "success");

				const performed = await wasOperationPerformed("webhook", testBounty);
				expect(performed).toBe(true);
			});

			test("should distinguish between different operations", async () => {
				await markOperationPerformed("webhook", testBounty, "success");

				const performed1 = await wasOperationPerformed("webhook", testBounty);
				expect(performed1).toBe(true);

				const performed2 = await wasOperationPerformed(
					"create-payment",
					testBounty,
				);
				expect(performed2).toBe(false);
			});

			test("should handle additional context", async () => {
				await markOperationPerformed("webhook", testBounty, "result", "ctx1");

				const performed1 = await wasOperationPerformed(
					"webhook",
					testBounty,
					"ctx1",
				);
				expect(performed1).toBe(true);

				const performed2 = await wasOperationPerformed(
					"webhook",
					testBounty,
					"ctx2",
				);
				expect(performed2).toBe(false);
			});
		});

		describe("markOperationPerformed", () => {
			test("should mark operation as performed", async () => {
				await markOperationPerformed("webhook", testBounty, "payment-success");

				const performed = await wasOperationPerformed("webhook", testBounty);
				expect(performed).toBe(true);
			});

			test("should overwrite existing marker", async () => {
				await markOperationPerformed("webhook", testBounty, "result-1");
				await markOperationPerformed("webhook", testBounty, "result-2");

				const performed = await wasOperationPerformed("webhook", testBounty);
				expect(performed).toBe(true);

				// Verify we can still check (key exists)
				const key = `bounty:idempotency:webhook:${testBounty}`;
				const value = await redis.get(key);
				expect(value).toBe("result-2");
			});

			test("should set TTL on operation marker", async () => {
				await markOperationPerformed("webhook", testBounty, "result");

				const key = `bounty:idempotency:webhook:${testBounty}`;
				const ttl = await redis.ttl(key);
				expect(ttl).toBeGreaterThan(0);
				expect(ttl).toBeLessThanOrEqual(86400); // 24 hours
			});
		});
	});

	describe("PaymentLockError", () => {
		test("should create error with correct name and message", () => {
			const error = new PaymentLockError("Test error message");

			expect(error.message).toBe("Test error message");
			expect(error.name).toBe("PaymentLockError");
			expect(error instanceof PaymentLockError).toBe(true);
			expect(error instanceof Error).toBe(true);
		});
	});
});
