import { describe, test, expect, beforeEach } from "bun:test";
import { redis } from "@bounty/realtime";
import { CircuitBreaker, CircuitBreakerOpenError } from "./circuit-breaker";

describe("CircuitBreaker", () => {
	let breaker: CircuitBreaker;

	beforeEach(async () => {
		breaker = new CircuitBreaker({
			name: "test-service",
			failureThreshold: 3,
			resetTimeout: 5,
			failureWindow: 60,
			successThreshold: 2,
		});

		// Reset to clean state before each test
		await breaker.reset();
		// Clean up any leftover Redis keys
		await redis.del("bounty:circuit:test-service:state");
		await redis.del("bounty:circuit:test-service:failures");
		await redis.del("bounty:circuit:test-service:successes");
		await redis.del("bounty:circuit:test-service:opened_at");
	});

	test("should execute function normally when circuit is closed", async () => {
		const result = await breaker.execute(async () => "success");
		expect(result).toBe("success");
	});

	test("should record success and keep circuit closed", async () => {
		await breaker.execute(async () => "ok");
		const stats = await breaker.getStats();
		expect(stats.state).toBe("CLOSED");
	});

	test("should open circuit after failure threshold is reached", async () => {
		// Record failures up to threshold
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("Simulated failure");
				});
			} catch (e) {
				// Expected to throw
			}
		}

		const stats = await breaker.getStats();
		expect(stats.state).toBe("OPEN");
		expect(stats.failures).toBeGreaterThanOrEqual(3);
	});

	test("should throw CircuitBreakerOpenError when circuit is open", async () => {
		// Force circuit to open
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		// Next call should fail immediately with CircuitBreakerOpenError
		let errorThrown = false;
		let errorType = "";

		try {
			await breaker.execute(async () => {
				throw new Error("This should not run");
			});
		} catch (e) {
			errorThrown = true;
			errorType =
				e instanceof CircuitBreakerOpenError
					? "CircuitBreakerOpenError"
					: "Other";
		}

		expect(errorThrown).toBe(true);
		expect(errorType).toBe("CircuitBreakerOpenError");
	});

	test("should transition to HALF_OPEN after reset timeout", async () => {
		// Open the circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		expect((await breaker.getStats()).state).toBe("OPEN");

		// Manually set opened_at to past to trigger HALF_OPEN
		const pastTime = Date.now() - 6000; // 6 seconds ago (past the 5s timeout)
		await redis.set("bounty:circuit:test-service:opened_at", pastTime);

		// Calling getState should trigger transition to HALF_OPEN
		const state = await breaker.getState();
		expect(state).toBe("HALF_OPEN");
	});

	test("should close circuit after success threshold in HALF_OPEN", async () => {
		// Open circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		// Force to HALF_OPEN
		await breaker["setState"]("HALF_OPEN");

		// Execute successful calls to meet success threshold
		await breaker.execute(async () => "success");
		await breaker.execute(async () => "success");

		const stats = await breaker.getStats();
		expect(stats.state).toBe("CLOSED");
	});

	test("should reopen circuit on failure during HALF_OPEN", async () => {
		// Open circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		// Force to HALF_OPEN
		await breaker["setState"]("HALF_OPEN");

		// Any failure during HALF_OPEN should reopen
		try {
			await breaker.execute(async () => {
				throw new Error("half-open failure");
			});
		} catch {}

		const stats = await breaker.getStats();
		expect(stats.state).toBe("OPEN");
	});

	test("executeWithFallback should use fallback when circuit is open", async () => {
		// Open the circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		const result = await breaker.executeWithFallback(
			async () => {
				throw new Error("This should not run");
			},
			async () => "fallback value",
		);

		expect(result).toBe("fallback value");
	});

	test("executeWithFallback should throw non-circuit errors", async () => {
		let errorThrown = false;
		let errorMessage = "";

		try {
			await breaker.executeWithFallback(
				async () => {
					throw new Error("Business logic error");
				},
				async () => "fallback",
			);
		} catch (e: any) {
			errorThrown = true;
			errorMessage = e.message;
		}

		expect(errorThrown).toBe(true);
		expect(errorMessage).toBe("Business logic error");
	});

	test("canExecute should return false when circuit is open", async () => {
		// Initially should be true
		expect(await breaker.canExecute()).toBe(true);

		// Open the circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		// Now should be false
		expect(await breaker.canExecute()).toBe(false);
	});

	test("should decrement failure count on success when closed", async () => {
		// Record some failures
		await breaker.recordFailure();
		await breaker.recordFailure();

		const statsBefore = await breaker.getStats();
		expect(statsBefore.failures).toBeGreaterThanOrEqual(2);

		// Success should decrement
		await breaker.recordSuccess();

		const statsAfter = await breaker.getStats();
		expect(statsAfter.failures).toBeLessThan(statsBefore.failures);
	});

	test("reset should close circuit and clear counters", async () => {
		// Open the circuit
		for (let i = 0; i < 3; i++) {
			try {
				await breaker.execute(async () => {
					throw new Error("failure");
				});
			} catch {}
		}

		expect((await breaker.getStats()).state).toBe("OPEN");

		// Reset
		await breaker.reset();

		const stats = await breaker.getStats();
		expect(stats.state).toBe("CLOSED");
		expect(stats.failures).toBe(0);
		expect(stats.successes).toBe(0);
	});

	test("should track stats correctly", async () => {
		await breaker.execute(async () => "success1");
		await breaker.execute(async () => "success2");

		try {
			await breaker.execute(async () => {
				throw new Error("failure");
			});
		} catch {}

		const stats = await breaker.getStats();
		expect(stats.name).toBe("test-service");
		expect(stats.state).toBe("CLOSED"); // Still closed, below threshold
	});
});
