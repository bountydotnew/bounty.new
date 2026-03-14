/**
 * Money utilities for Convex.
 *
 * All monetary values are stored as integer cents (v.int64()) to avoid
 * floating-point precision issues. These helpers convert between dollars
 * and cents for display and Stripe API interactions.
 */

/** Convert a dollar amount (number) to integer cents (bigint). */
export function toCents(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100));
}

/** Convert integer cents (bigint) to a dollar amount (number). */
export function toDollars(cents: bigint): number {
  return Number(cents) / 100;
}

/** Convert a string dollar amount (e.g. "99.99") to integer cents (bigint). */
export function parseAmountToCents(amount: string): bigint {
  const parsed = Number.parseFloat(amount);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return toCents(parsed);
}

/**
 * Calculate total amount with Stripe processing fees.
 * Fee: 2.9% + $0.30 (30 cents).
 *
 * All values in integer cents (bigint).
 */
export function calculateTotalWithFees(bountyAmountCents: bigint): {
  bountyAmount: bigint;
  fees: bigint;
  total: bigint;
} {
  if (bountyAmountCents <= 0n) {
    return { bountyAmount: 0n, fees: 0n, total: 0n };
  }

  const fees = BigInt(Math.round(Number(bountyAmountCents) * 0.029 + 30));
  return {
    bountyAmount: bountyAmountCents,
    fees,
    total: bountyAmountCents + fees,
  };
}

/**
 * Format cents as a human-readable dollar string.
 * e.g. 9999n → "$99.99"
 */
export function formatCents(cents: bigint, currency = 'USD'): string {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}
