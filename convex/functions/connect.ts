/**
 * Stripe Connect functions.
 *
 * Replaces: packages/api/src/routers/connect.ts (6 procedures)
 *
 * These are Convex actions because they call the Stripe API directly.
 */
import {
  query,
  mutation,
  internalMutation,
  action,
} from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../lib/auth';
import { toDollars } from '../lib/money';
import { stripe } from '../stripe';

// ============================================================================
// QUERIES (DB-only, no Stripe calls)
// ============================================================================

/**
 * Get payout history for the current user.
 * Replaces: connect.getPayoutHistory (protectedProcedure query)
 */
export const getPayoutHistory = query({
  args: {
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    const payouts = await ctx.db
      .query('payouts')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect();

    const total = payouts.length;
    const start = (page - 1) * limit;
    const paginated = payouts.slice(start, start + limit);

    const enriched = await Promise.all(
      paginated.map(async (payout) => {
        const bounty = await ctx.db.get(payout.bountyId);
        return {
          ...payout,
          amountDollars: toDollars(payout.amountCents),
          bountyTitle: bounty?.title,
        };
      })
    );

    return { payouts: enriched, total, page, limit };
  },
});

/**
 * Get recent activity (payouts + bounties created).
 * Replaces: connect.getActivity (protectedProcedure query)
 */
export const getActivity = query({
  args: {
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    // Get payouts
    const payouts = await ctx.db
      .query('payouts')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(50);

    // Get bounties created
    const bounties = await ctx.db
      .query('bounties')
      .withIndex('by_createdById', (q) => q.eq('createdById', user._id))
      .order('desc')
      .take(50);

    type ActivityItem = {
      type: 'payout' | 'bounty_created';
      timestamp: number;
      data: any;
    };

    const activity: ActivityItem[] = [
      ...payouts.map((p) => ({
        type: 'payout' as const,
        timestamp: p._creationTime,
        data: {
          _id: p._id,
          amountDollars: toDollars(p.amountCents),
          status: p.status,
          bountyId: p.bountyId,
        },
      })),
      ...bounties.map((b) => ({
        type: 'bounty_created' as const,
        timestamp: b._creationTime,
        data: {
          _id: b._id,
          title: b.title,
          amountDollars: toDollars(b.amountCents),
          status: b.status,
        },
      })),
    ];

    activity.sort((a, b) => b.timestamp - a.timestamp);

    const total = activity.length;
    const start = (page - 1) * limit;
    return {
      activity: activity.slice(start, start + limit),
      total,
      page,
      limit,
    };
  },
});

// ============================================================================
// ACTIONS (call Stripe API)
// ============================================================================

/**
 * Get Stripe Connect account status.
 * Replaces: connect.getConnectStatus (protectedProcedure query → action)
 */
export const getConnectStatus = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMeInternal, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    if (!user.stripeConnectAccountId) {
      return { hasAccount: false, onboardingComplete: false };
    }

    // Call Stripe to check account status
    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const account = await stripeClient.accounts.retrieve(
      user.stripeConnectAccountId
    );

    const onboardingComplete =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    // Sync onboarding status if changed
    if (onboardingComplete !== user.stripeConnectOnboardingComplete) {
      await ctx.runMutation(internal.functions.connect.syncConnectStatus, {
        userId: user._id,
        onboardingComplete: !!onboardingComplete,
      });
    }

    return {
      hasAccount: true,
      onboardingComplete: !!onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  },
});

/**
 * Create a Stripe Connect account link for onboarding.
 * Replaces: connect.createConnectAccountLink (protectedProcedure mutation → action)
 */
export const createConnectAccountLink = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMeInternal, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';

    let accountId = user.stripeConnectAccountId;

    // Create account if doesn't exist
    if (!accountId) {
      const account = await stripeClient.accounts.create({
        type: 'express',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        email: user.email,
      });
      accountId = account.id;

      await ctx.runMutation(internal.functions.connect.setConnectAccountId, {
        userId: user._id,
        stripeConnectAccountId: account.id,
      });
    }

    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings/payments?refresh=true`,
      return_url: `${baseUrl}/settings/payments?accountId=${accountId}`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  },
});

/**
 * Get Stripe Connect dashboard link.
 * Replaces: connect.getConnectDashboardLink (protectedProcedure mutation → action)
 */
export const getConnectDashboardLink = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMeInternal, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    if (!user.stripeConnectAccountId) {
      throw new ConvexError('NO_CONNECT_ACCOUNT');
    }

    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const loginLink = await stripeClient.accounts.createLoginLink(
      user.stripeConnectAccountId
    );

    return { url: loginLink.url };
  },
});

/**
 * Get Stripe Connect account balance.
 * Replaces: connect.getAccountBalance (protectedProcedure query → action)
 */
export const getAccountBalance = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMeInternal, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    if (!user.stripeConnectAccountId) {
      return { available: [], pending: [] };
    }

    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const balance = await stripeClient.balance.retrieve({
      stripeAccount: user.stripeConnectAccountId,
    });

    return {
      available: balance.available,
      pending: balance.pending,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

export const syncConnectStatus = internalMutation({
  args: {
    userId: v.any(),
    onboardingComplete: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeConnectOnboardingComplete: args.onboardingComplete,
      updatedAt: Date.now(),
    });
  },
});

export const setConnectAccountId = internalMutation({
  args: {
    userId: v.any(),
    stripeConnectAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeConnectAccountId: args.stripeConnectAccountId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reset (delete) the user's Stripe Connect account.
 * Replaces: connect.resetConnectAccount (protectedProcedure mutation → action)
 */
export const resetConnectAccount = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMeInternal, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    if (!user.stripeConnectAccountId) {
      throw new ConvexError('NO_CONNECT_ACCOUNT');
    }

    // Check for in-flight payouts
    const hasActivePayout = await ctx.runQuery(
      internal.functions.connect.checkActivePayouts,
      { userId: user._id }
    );
    if (hasActivePayout) {
      throw new ConvexError('ACTIVE_PAYOUTS_PENDING');
    }

    // Delete the account on Stripe
    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    try {
      await stripeClient.accounts.del(user.stripeConnectAccountId);
    } catch (e: any) {
      // If already gone (404), continue cleanup
      if (e?.statusCode !== 404) {
        throw new ConvexError('STRIPE_DELETE_FAILED');
      }
    }

    // Clear the local reference
    await ctx.runMutation(internal.functions.connect.clearConnectAccount, {
      userId: user._id,
    });

    return { success: true };
  },
});

/** Internal: check for active payouts. */
export const checkActivePayouts = query({
  args: { userId: v.any() },
  handler: async (ctx, args) => {
    const payouts = await ctx.db
      .query('payouts')
      .withIndex('by_userId', (q: any) => q.eq('userId', args.userId))
      .collect();

    return payouts.some(
      (p: any) => p.status === 'pending' || p.status === 'processing'
    );
  },
});

/** Internal: clear connect account fields on user. */
export const clearConnectAccount = internalMutation({
  args: { userId: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeConnectAccountId: undefined,
      stripeConnectOnboardingComplete: false,
      updatedAt: Date.now(),
    });
  },
});
