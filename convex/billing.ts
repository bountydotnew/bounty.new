/**
 * Autumn billing integration via @useautumn/convex.
 *
 * Abstracts Stripe billing with three core functions:
 * - check: verify feature access
 * - track: meter usage
 * - checkout: process payments
 */
import { Autumn } from '@useautumn/convex';
import { components } from './_generated/api';

/**
 * Autumn billing client.
 *
 * The `identify` function resolves the current user from the Convex auth
 * context and returns their customer ID for Autumn.
 */
export const autumn = new Autumn(components.autumn, {
  secretKey: process.env.AUTUMN_SECRET_KEY ?? '',
  identify: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return {
      customerId: identity.subject,
      customerData: {
        name: identity.name ?? undefined,
        email: identity.email ?? undefined,
      },
    };
  },
});

// Export auto-generated Convex actions for direct client usage
export const {
  check,
  track,
  checkout,
  billingPortal,
  createCustomer,
  listProducts,
} = autumn.api();
