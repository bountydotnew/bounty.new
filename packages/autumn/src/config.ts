/**
 * Autumn Billing Configuration
 *
 * Centralized configuration for Autumn billing integration.
 * Autumn: https://docs.useautumn.com
 */

import { env } from '@bounty/env/server';

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Autumn API configuration
 */
export const AUTUMN_CONFIG = {
  /**
   * Autumn API base URL
   * @see https://docs.useautumn.com/docs/api
   */
  apiURL: env.AUTUMN_API_URL ?? 'https://api.useautumn.com/v1',

  /**
   * Autumn secret key for server-side operations
   */
  secretKey: env.AUTUMN_SECRET_KEY,

  /**
   * Whether to use debug mode (logs all API calls)
   */
  debug: env.NODE_ENV === 'development',
} as const;

// ============================================================================
// Feature Configuration
// ============================================================================

/**
 * Feature IDs for usage tracking
 * These must match the feature IDs configured in Autumn dashboard
 */
export const AUTUMN_FEATURE_IDS = {
  LOWER_FEES: 'lower_fees',
  CONCURRENT_BOUNTIES: 'concurrent_bounties',
} as const;

/**
 * Feature default states (when no active subscription)
 */
export const DEFAULT_FEATURE_STATE = {
  total: 0,
  remaining: 0,
  unlimited: false,
  enabled: false,
  usage: 0,
  nextResetAt: null,
  interval: '',
  includedUsage: 0,
} as const;

/**
 * Default features for non-pro users
 */
export const DEFAULT_FEATURES = {
  lowerFees: DEFAULT_FEATURE_STATE,
  concurrentBounties: DEFAULT_FEATURE_STATE,
} as const;

// ============================================================================
// Error Helpers
// ============================================================================

/**
 * Check if an error is a customer not found error
 */
export function isCustomerNotFoundError(error: unknown): boolean {
  const err = error as { status?: number; message?: string; detail?: string };
  const errorMessage = String(err?.message ?? '').toLowerCase();
  const errorDetail = String(err?.detail ?? '').toLowerCase();
  return (
    err?.status === 404 ||
    errorMessage.includes('not found') ||
    errorMessage.includes('customer does not exist') ||
    errorDetail.includes('customer does not exist')
  );
}

/**
 * Check if an error is a permission denied error
 */
export function isPermissionDeniedError(error: unknown): boolean {
  const err = error as { status?: number; message?: string };
  const errorMessage = String(err?.message ?? '').toLowerCase();
  return (
    err?.status === 403 ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('not permitted') ||
    errorMessage.includes('unauthorized')
  );
}

/**
 * Check if an error is a conflict/duplicate error
 */
export function isConflictError(error: unknown): boolean {
  const err = error as { status?: number; message?: string };
  const errorMessage = String(err?.message ?? '').toLowerCase();
  return (
    err?.status === 409 ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('conflict') ||
    errorMessage.includes('duplicate')
  );
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  const err = error as Record<string, unknown> | null;
  if (!err) return 'Unknown error';

  return String(
    err?.message ??
      err?.detail ??
      err?.error ??
      JSON.stringify(err)
  );
}

/**
 * Log Autumn API operation in debug mode
 */
export function debugLog(operation: string, data?: unknown): void {
  if (AUTUMN_CONFIG.debug) {
    console.log(`[Autumn:${operation}]`, data ?? '');
  }
}

/**
 * Log Autumn API error
 */
export function logError(operation: string, error: unknown): void {
  console.error(`[Autumn Error:${operation}]`, {
    message: extractErrorMessage(error),
    error,
  });
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Check if a product ID/slug is a pro plan (not free)
 */
export function isProProduct(productId: string): boolean {
  return productId !== 'free' && productId.startsWith('tier_');
}

/**
 * Check if a product name/slug contains pro plan identifiers
 */
export function hasProIdentifier(item: { id?: string; name?: string; slug?: string }): boolean {
  const identifiers = ['tier_1_basic', 'tier_2_pro', 'tier_3_pro_plus', 'bounty-pro'];
  const searchValue = (
    item.id ?? item.name ?? item.slug ?? ''
  ).toLowerCase();
  return identifiers.some((id) => searchValue.includes(id));
}
