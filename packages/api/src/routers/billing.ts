/**
 * Billing Router
 *
 * tRPC router for billing operations using Autumn.
 */

import type { AutumnError } from '@bounty/types';
import { autumnClient, isConflictError, isCustomerNotFoundError, extractErrorMessage } from '@bounty/autumn';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

// ============================================================================
// Helpers
// ============================================================================

const requireEmail = (email: string | null | undefined) => {
  if (typeof email === 'string' && email.trim().length > 0) {
    return email;
  }
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: 'User email is required to create a billing customer',
  });
};

const deriveName = (
  userId: string,
  email: string | null | undefined,
  name: string | null | undefined
) => {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name;
  }
  if (typeof email === 'string' && email.trim().length > 0) {
    return email;
  }
  return userId;
};

// ============================================================================
// Router
// ============================================================================

export const billingRouter = router({
  /**
   * Ensure a billing customer exists for the authenticated user
   * Creates the customer in Autumn if they don't already exist
   */
  ensureCustomer: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const externalId = user.id;
    const email = requireEmail(user.email);
    const name = deriveName(externalId, user.email, user.name);

    try {
      // Use getOrCreateCustomer for idempotency
      await autumnClient.getOrCreateCustomer({
        external_id: externalId,
        email,
        name,
        metadata: { userId: externalId },
      });
      return { ok: true } as const;
    } catch (error) {
      const err = error as AutumnError;
      const message = extractErrorMessage(error);

      // Conflict errors mean customer already exists - treat as success
      if (isConflictError(err)) {
        return { ok: true } as const;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to ensure billing customer exists',
        cause: message,
      });
    }
  }),

  /**
   * Get customer state for the authenticated user
   * Returns subscriptions, features, and products
   */
  getCustomerState: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    try {
      const state = await autumnClient.getCustomerState(user.id);
      return state;
    } catch (error) {
      if (isCustomerNotFoundError(error)) {
        return null;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customer state',
        cause: extractErrorMessage(error),
      });
    }
  }),

  /**
   * Create a checkout session for a product
   */
  createCheckout: protectedProcedure
    .input((val) => {
      if (typeof val === 'object' && val !== null && 'slug' in val) {
        const slug = val.slug;
        // Accept both monthly and yearly plan slugs
        const validSlugs = [
          'tier_1_basic',
          'tier_2_pro',
          'tier_3_pro_plus',
          'tier_1_basic_yearly',
          'tier_2_pro_yearly',
          'tier_3_pro_plus_yearly',
        ];
        if (typeof slug === 'string' && validSlugs.includes(slug)) {
          return { slug };
        }
      }
      throw new Error('Invalid input: slug must be a valid plan tier');
    })
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No session found - please log in again',
        });
      }

      const productId = input.slug;

      try {
        // First ensure customer exists
        await autumnClient.getOrCreateCustomer({
          external_id: user.id,
          email: user.email ?? user.id,
          name: user.name ?? undefined,
          metadata: { userId: user.id },
        });

        // Create checkout session
        const checkout = await autumnClient.createCheckout({
          productId,
          customerId: user.id,
          metadata: {
            userId: user.id,
            planSlug: input.slug,
          },
        });

        // Return either checkout URL or preview data
        return {
          checkoutUrl: checkout.checkout_url ?? checkout.url ?? null,
          preview: checkout.preview ?? null,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create checkout: ${extractErrorMessage(error)}`,
          cause: error,
        });
      }
    }),

  /**
   * Attach a product to a customer (confirm purchase when payment method is on file)
   * This is called after checkout returns preview data instead of a URL
   */
  attachProduct: protectedProcedure
    .input((val) => {
      if (typeof val === 'object' && val !== null && 'slug' in val) {
        const slug = val.slug;
        // Accept both monthly and yearly plan slugs
        const validSlugs = [
          'tier_1_basic',
          'tier_2_pro',
          'tier_3_pro_plus',
          'tier_1_basic_yearly',
          'tier_2_pro_yearly',
          'tier_3_pro_plus_yearly',
        ];
        if (typeof slug === 'string' && validSlugs.includes(slug)) {
          return { slug };
        }
      }
      throw new Error('Invalid input: slug must be a valid plan tier');
    })
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        await autumnClient.attach({
          productId: input.slug,
          customerId: user.id,
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to attach product: ${extractErrorMessage(error)}`,
          cause: error,
        });
      }
    }),

  /**
   * Create a customer portal session
   */
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    try {
      // Get customer by external ID
      const customer = await autumnClient.getCustomer(user.id);

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Billing customer not found',
        });
      }

      // Create portal session
      const portal = await autumnClient.createPortal(customer.id);

      return { portalUrl: portal.portal_url };
    } catch (error) {
      if (isCustomerNotFoundError(error)) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Billing customer not found',
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create portal session',
        cause: extractErrorMessage(error),
      });
    }
  }),

  /**
   * Track a usage event for the authenticated user
   */
  trackUsage: protectedProcedure
    .input((val) => {
      if (typeof val === 'object' && val !== null && 'event' in val && typeof val.event === 'string') {
        return {
          event: val.event,
          metadata: (val as { metadata?: Record<string, unknown> }).metadata,
        };
      }
      throw new Error('Invalid input: event is required');
    })
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        await autumnClient.trackUsage(
          user.id,
          input.event,
          input.metadata as Record<string, string | number | boolean> | undefined
        );
        return { ok: true } as const;
      } catch (error) {
        // Don't fail the request if tracking fails, just log
        return { ok: false } as const;
      }
    }),
});
