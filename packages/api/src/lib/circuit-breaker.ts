import { redis } from "@bounty/realtime";

/**
 * Circuit Breaker implementation using Upstash Redis
 * Prevents cascading failures when external services are down
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests fail immediately
 * - HALF_OPEN: Testing if service recovered
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
	/** Name of the service (used for Redis keys) */
	name: string;
	/** Number of failures before opening circuit */
	failureThreshold: number;
	/** Time in seconds before attempting recovery */
	resetTimeout: number;
	/** Time window in seconds for counting failures */
	failureWindow: number;
	/** Number of successful requests needed to close circuit from half-open */
	successThreshold: number;
}

const DEFAULT_OPTIONS: Omit<CircuitBreakerOptions, "name"> = {
	failureThreshold: 5,
	resetTimeout: 30,
	failureWindow: 60,
	successThreshold: 2,
};

export class CircuitBreaker {
	private name: string;
	private options: CircuitBreakerOptions;
	private prefix: string;

	constructor(options: Partial<CircuitBreakerOptions> & { name: string }) {
		this.name = options.name;
		this.options = { ...DEFAULT_OPTIONS, ...options };
		this.prefix = `bounty:circuit:${this.name}`;
	}

	private get stateKey(): string {
		return `${this.prefix}:state`;
	}

	private get failureCountKey(): string {
		return `${this.prefix}:failures`;
	}

	private get successCountKey(): string {
		return `${this.prefix}:successes`;
	}

	private get openedAtKey(): string {
		return `${this.prefix}:opened_at`;
	}

	/**
	 * Get current circuit state
	 */
	async getState(): Promise<CircuitState> {
		const state = await redis.get<CircuitState>(this.stateKey);
		if (!state) return "CLOSED";

		// Check if we should transition from OPEN to HALF_OPEN
		if (state === "OPEN") {
			const openedAt = await redis.get<number>(this.openedAtKey);
			if (
				openedAt &&
				Date.now() - openedAt > this.options.resetTimeout * 1000
			) {
				await this.setState("HALF_OPEN");
				return "HALF_OPEN";
			}
		}

		return state;
	}

	/**
	 * Set circuit state
	 */
	private async setState(state: CircuitState): Promise<void> {
		await redis.set(this.stateKey, state);

		if (state === "OPEN") {
			await redis.set(this.openedAtKey, Date.now());
		} else if (state === "CLOSED") {
			// Reset counters when closing
			await Promise.all([
				redis.del(this.failureCountKey),
				redis.del(this.successCountKey),
				redis.del(this.openedAtKey),
			]);
		}
	}

	/**
	 * Record a failure
	 */
	async recordFailure(): Promise<void> {
		const state = await this.getState();

		if (state === "HALF_OPEN") {
			// Any failure in half-open goes back to open
			await this.setState("OPEN");
			return;
		}

		// Increment failure count with expiration
		const failures = await redis.incr(this.failureCountKey);
		await redis.expire(this.failureCountKey, this.options.failureWindow);

		if (failures >= this.options.failureThreshold) {
			await this.setState("OPEN");
		}
	}

	/**
	 * Record a success
	 */
	async recordSuccess(): Promise<void> {
		const state = await this.getState();

		if (state === "HALF_OPEN") {
			const successes = await redis.incr(this.successCountKey);
			if (successes >= this.options.successThreshold) {
				await this.setState("CLOSED");
			}
		} else if (state === "CLOSED") {
			// Reset failure count on success (sliding window behavior)
			const failures = await redis.get<number>(this.failureCountKey);
			if (failures && failures > 0) {
				await redis.decr(this.failureCountKey);
			}
		}
	}

	/**
	 * Check if request can proceed
	 */
	async canExecute(): Promise<boolean> {
		const state = await this.getState();
		return state !== "OPEN";
	}

	/**
	 * Execute a function with circuit breaker protection
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		const state = await this.getState();

		if (state === "OPEN") {
			throw new CircuitBreakerOpenError(
				`Circuit breaker '${this.name}' is OPEN. Service temporarily unavailable.`,
			);
		}

		try {
			const result = await fn();
			await this.recordSuccess();
			return result;
		} catch (error) {
			await this.recordFailure();
			throw error;
		}
	}

	/**
	 * Execute with fallback on circuit open
	 */
	async executeWithFallback<T>(
		fn: () => Promise<T>,
		fallback: () => T | Promise<T>,
	): Promise<T> {
		try {
			return await this.execute(fn);
		} catch (error) {
			if (error instanceof CircuitBreakerOpenError) {
				return fallback();
			}
			throw error;
		}
	}

	/**
	 * Get circuit breaker stats
	 */
	async getStats(): Promise<{
		name: string;
		state: CircuitState;
		failures: number;
		successes: number;
	}> {
		const [state, failures, successes] = await Promise.all([
			this.getState(),
			redis.get<number>(this.failureCountKey),
			redis.get<number>(this.successCountKey),
		]);

		return {
			name: this.name,
			state,
			failures: failures || 0,
			successes: successes || 0,
		};
	}

	/**
	 * Force reset the circuit (admin use)
	 */
	async reset(): Promise<void> {
		await this.setState("CLOSED");
	}
}

export class CircuitBreakerOpenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CircuitBreakerOpenError";
	}
}

// Pre-configured circuit breakers for external services
export const stripeCircuitBreaker = new CircuitBreaker({
	name: "stripe",
	failureThreshold: 5,
	resetTimeout: 30,
	failureWindow: 60,
	successThreshold: 2,
});

export const githubCircuitBreaker = new CircuitBreaker({
	name: "github",
	failureThreshold: 10, // More lenient for GitHub
	resetTimeout: 60,
	failureWindow: 120,
	successThreshold: 3,
});

export const emailCircuitBreaker = new CircuitBreaker({
	name: "email",
	failureThreshold: 5,
	resetTimeout: 60,
	failureWindow: 120,
	successThreshold: 2,
});

export const polarCircuitBreaker = new CircuitBreaker({
	name: "polar",
	failureThreshold: 5,
	resetTimeout: 30,
	failureWindow: 60,
	successThreshold: 2,
});
