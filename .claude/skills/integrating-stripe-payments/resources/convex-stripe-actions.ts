"use node";

import Stripe from "stripe";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Create a Stripe Checkout Session for Pro Plan subscription
 */
export const createCheckoutSession = action({
  args: {
    clerkUserId: v.string(),
    mode: v.optional(v.union(v.literal("subscription"), v.literal("payment"))),
  },
  handler: async (ctx, args): Promise<{ url: string | null; sessionId: string }> => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil" as any,
    });

    // Get user from database
    let user: any = await ctx.runQuery(internal.stripeDb.getUserByClerkId, {
      clerkId: args.clerkUserId,
    });

    if (!user) {
      // Create user if doesn't exist with Clerk info
      const newUserId = await ctx.runMutation(internal.stripeDb.createUser, {
        clerkId: args.clerkUserId,
        email: undefined,
        name: undefined,
      });

      // Get the newly created user
      const newUser: any = await ctx.runQuery(internal.stripeDb.getUserById, {
        userId: newUserId,
      });

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      // Use the newly created user
      user = newUser;
    }

    // Create or retrieve Stripe customer
    let customerId: string | undefined = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerkUserId: args.clerkUserId,
          convexUserId: user._id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await ctx.runMutation(internal.stripeDb.updateStripeCustomerId, {
        userId: user._id,
        stripeCustomerId: customerId,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const mode = args.mode || "subscription";

    // Create checkout session for Pro Plan ($20/month)
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true, // Enable coupon code input field
      success_url: `${siteUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}`,
      metadata: {
        clerkUserId: args.clerkUserId,
        userId: user._id,
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  },
});

/**
 * Get checkout session status (for return page)
 */
export const getCheckoutSessionStatus = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil" as any,
    });

    const session = await stripe.checkout.sessions.retrieve(args.sessionId);

    return {
      status: session.status,
      customerEmail: session.customer_details?.email,
      paymentStatus: session.payment_status,
    };
  },
});

/**
 * Create Customer Portal Session
 * Essential for letting users manage their subscriptions, payment methods, and invoices
 */
export const createCustomerPortalSession = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil" as any,
    });

    // Get user from database
    const user: any = await ctx.runQuery(internal.stripeDb.getUserByClerkId, {
      clerkId: args.clerkUserId,
    });

    if (!user || !user.stripeCustomerId) {
      throw new Error("User not found or has no Stripe customer ID");
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${siteUrl}/dashboard`,
    });

    return {
      url: session.url,
    };
  },
});