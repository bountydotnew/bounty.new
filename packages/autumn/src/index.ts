/**
 * @bounty/autumn
 *
 * Autumn billing integration for the Bounty platform.
 *
 * ## Usage
 *
 * ### Server-side (API Routes, tRPC)
 * ```ts
 * import { autumnClient } from '@bounty/autumn/server';
 *
 * // Get customer state
 * const state = await autumnClient.getCustomerState(userId);
 *
 * // Create checkout
 * const checkout = await autumnClient.createCheckout({
 *   productId: productId,
 *   customerId: customerId,
 *   successUrl: 'https://your-app.com/success',
 * });
 *
 * // Track usage
 * await autumnClient.trackUsage(userId, 'bounty_created');
 * ```
 *
 * ## Configuration
 *
 * Environment variables (required):
 * - `AUTUMN_SECRET_KEY` - Secret key from Autumn dashboard (format: am_sk_...)
 *
 * Optional:
 * - `AUTUMN_API_URL` - Autumn API URL (default: https://api.useautumn.com/v1)
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   AutumnCustomer,
 *   CustomerState,
 *   FeatureState,
 *   BillingHookResult,
 * } from '@bounty/types';
 * ```
 */

// ============================================================================
// Client Exports (singleton instances and class)
// ============================================================================

export { autumnClient, AutumnClient } from './client';

// ============================================================================
// Config Exports
// ============================================================================

export {
  AUTUMN_CONFIG,
  AUTUMN_FEATURE_IDS,
  DEFAULT_FEATURE_STATE,
  DEFAULT_FEATURES,
  isCustomerNotFoundError,
  isPermissionDeniedError,
  isConflictError,
  extractErrorMessage,
  logError,
  debugLog,
  isProProduct,
  hasProIdentifier,
} from './config';
