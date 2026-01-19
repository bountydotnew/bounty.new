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

    const email = user.email;
    if (!email) {
      return null;
    }

    try {
      // First check if customer exists with this external_id
      const customer = await autumnClient.getCustomer(user.id);
      if (!customer) {
        // No customer with this external_id exists
        // Try via checkout to see if they have products attached by email
        try {
          const lookup = await autumnClient.createCheckout({
            productId: 'tier_1_basic',
            customerEmail: email,
            customerName: user.name ?? undefined,
            successUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new'}/settings/billing`,
          });

          // If we get here and have product info, customer exists but with different external_id
          if (lookup.current_product) {
            return {
              customer: {
                id: lookup.customer_id,
                external_id: user.id,
                email,
                name: user.name ?? null,
                env: lookup.current_product.env ?? (process.env.NODE_ENV === 'production' ? 'prod' : 'dev'),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              subscriptions: [{
                id: 'lookup_by_email',
                customer_id: lookup.customer_id,
                product_id: lookup.current_product.id,
                status: 'active' as const,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                product: lookup.current_product,
              }],
              features: {},
              products: [],
              _unlinked: true, // Flag indicating customer exists but external_id doesn't match
            };
          }
        } catch {
          // Lookup failed, return null (free tier)
        }
        return null;
      }

      // Customer exists, get their full state
      const state = await autumnClient.getCustomerState(user.id);
      return state;
    } catch (error) {
      const err = error as AutumnError;

      // Check if it's a 404 or any customer not found error
      if (err.status === 404 || isCustomerNotFoundError(error)) {
        // Customer doesn't exist yet - user is on free tier
        return null;
      }

      // Log the actual error for debugging
      console.error('[Billing] getCustomerState error:', {
        status: err.status,
        code: err.code,
        message: err.message,
        detail: err.detail,
        body: err.body,
      });
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
      const email = requireEmail(user.email);

      try {
        console.log('[Billing] createCheckout request:', {
          productId,
          customerId: user.id,
          customerEmail: email,
        });

        // Create checkout with email - Autumn will look up existing customer by email
        // If a customer with this email exists, it will be used
        const checkout = await autumnClient.createCheckout({
          productId,
          customerId: user.id, // Pass user.id as the customer identifier
          customerEmail: email, // Email helps Autumn find existing customers
          customerName: user.name ?? undefined,
          successUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new'}/dashboard?checkout=success`,
          metadata: {
            userId: user.id,
            email,
            planSlug: input.slug,
          },
        });

        console.log('[Billing] createCheckout response:', {
          hasCheckoutUrl: !!checkout.checkout_url,
          hasUrl: !!checkout.url,
          hasPreview: !!checkout.preview,
          fullResponse: checkout,
        });

        // Determine if this is a preview (upgrade scenario) or needs checkout URL
        // When url is null, the entire response is preview data (customer can be charged immediately)
        const isPreview = !checkout.checkout_url && !checkout.url;
        const previewData = isPreview ? checkout : (checkout.preview ?? null);

        return {
          checkoutUrl: checkout.checkout_url ?? checkout.url ?? null,
          preview: previewData,
        };
      } catch (error) {
        const err = error as AutumnError;
        const errorMessage = extractErrorMessage(error);

        console.error('[Billing] createCheckout error:', {
          status: err.status,
          code: err.code,
          message: err.message,
          detail: err.detail,
          body: err.body,
          fullError: error,
        });

        // If product is already attached, customer already has this plan
        if (
          err?.code === 'product_already_attached' ||
          errorMessage.includes('already attached') ||
          errorMessage.includes('already subscribed') ||
          err?.status === 409
        ) {
          const errorBody = err.body as { current_product?: { id: string; name: string } } | undefined;
          return {
            checkoutUrl: null,
            preview: null,
            alreadyAttached: true,
            currentProduct: errorBody?.current_product,
            message: 'You already have this plan attached to your account.',
          };
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create checkout: ${errorMessage}`,
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

  /**
   * Check if the user has access to a feature
   * Returns allowed status along with balance information
   */
  checkFeature: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      requiredBalance: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        const result = await autumnClient.check({
          customerId: user.id,
          featureId: input.featureId,
          requiredBalance: input.requiredBalance,
        });
        return result;
      } catch (error) {
        // If customer doesn't exist, return default not-allowed state
        if (isCustomerNotFoundError(error)) {
          return {
            allowed: false,
            feature_id: input.featureId,
            customer_id: user.id,
            required_balance: input.requiredBalance ?? 1,
            unlimited: false,
            interval: null,
            balance: 0,
            usage: 0,
            included_usage: 0,
            next_reset_at: null,
            overage_allowed: false,
          };
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to check feature: ${extractErrorMessage(error)}`,
          cause: error,
        });
      }
    }),

  /**
   * Track feature usage for the authenticated user
   * Increments the usage counter for a given feature
   */
  trackFeature: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      value: z.number(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session?.user;
      if (!user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      try {
        const result = await autumnClient.trackFeature({
          customerId: user.id,
          featureId: input.featureId,
          value: input.value,
          metadata: input.metadata as Record<string, string | number | boolean> | undefined,
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to track feature: ${extractErrorMessage(error)}`,
          cause: error,
        });
      }
    }),

  /**
   * Get all products from Autumn
   */
  getProducts: protectedProcedure.query(async () => {
    try {
      const products = await autumnClient.getProducts();
      return products;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch products: ${extractErrorMessage(error)}`,
        cause: error,
      });
    }
  }),

  /**
   * Test billing - run all billing checks for testing
   */
  testBilling: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Get customer state
    const customerState = await autumnClient.getCustomerState(user.id);

    // Get products
    const products = await autumnClient.getProducts();

    // Calculate fee scenarios for each tier
    const feeScenarios = [
      { monthlySpend: 0, expected: 'Free tier: 5% fee, 1 concurrent bounty' },
      { monthlySpend: 100, expected: 'Basic ($10/mo): $500 allowance, 0% fee, unlimited bounties' },
      { monthlySpend: 1000, expected: 'Pro ($25/mo): $5,000 allowance, 2% fee, unlimited bounties' },
      { monthlySpend: 10000, expected: 'Pro+ ($150/mo): $12,000 allowance, 4% fee, unlimited bounties' },
    ];

    return {
      customer: customerState?.customer ?? null,
      products,
      activeProducts: customerState?.subscriptions ?? [],
      features: customerState?.features ?? {},
      feeScenarios,
      hasActiveSubscription: (customerState?.subscriptions?.length ?? 0) > 0,
      timestamp: new Date().toISOString(),
    };
  }),
});
