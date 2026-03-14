/**
 * Stripe integration via @convex-dev/stripe.
 *
 * Handles:
 * - Checkout session creation (bounty funding)
 * - Customer management
 * - Subscription management (via Autumn)
 * - Webhook handling (registered in http.ts)
 */
import { StripeSubscriptions } from '@convex-dev/stripe';
import { components } from './_generated/api';

/**
 * Stripe client for the Convex Stripe component.
 *
 * Uses STRIPE_SECRET_KEY from env vars automatically.
 */
export const stripe = new StripeSubscriptions(components.stripe);
