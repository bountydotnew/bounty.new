/**
 * Onboarding functions.
 *
 * Replaces: packages/api/src/routers/onboarding.ts (6 procedures)
 */
import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth, getAuthenticatedUser } from '../lib/auth';

/**
 * Get the user's onboarding state.
 * Replaces: onboarding.getState (protectedProcedure query)
 */
export const getState = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;
    const state = await ctx.db
      .query('onboardingState')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    return state;
  },
});

/**
 * Check if user is on the waitlist.
 * Replaces: onboarding.checkWaitlist (protectedProcedure query)
 */
export const checkWaitlist = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const waitlistEntry = await ctx.db
      .query('waitlist')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first();

    return { isOnWaitlist: !!waitlistEntry, entry: waitlistEntry };
  },
});

/**
 * Complete an onboarding step.
 * Replaces: onboarding.completeStep (protectedProcedure mutation)
 */
export const completeStep = mutation({
  args: {
    step: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query('onboardingState')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    const stepField = `completedStep${args.step}` as const;

    if (existing) {
      await ctx.db.patch(existing._id, {
        [stepField]: true,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('onboardingState', {
        userId: user._id,
        completedStep1: args.step === 1,
        completedStep2: args.step === 2,
        completedStep3: args.step === 3,
        completedStep4: args.step === 4,
        claimedWaitlistDiscount: false,
        updatedAt: now,
      });
    }
  },
});

/**
 * Save the user's source/referral info.
 * Replaces: onboarding.saveSource (protectedProcedure mutation)
 */
export const saveSource = mutation({
  args: {
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query('onboardingState')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        source: args.source,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('onboardingState', {
        userId: user._id,
        completedStep1: false,
        completedStep2: false,
        completedStep3: false,
        completedStep4: false,
        source: args.source,
        claimedWaitlistDiscount: false,
        updatedAt: now,
      });
    }
  },
});

/**
 * Claim waitlist discount coupon.
 * Replaces: onboarding.claimWaitlistDiscount (protectedProcedure mutation)
 */
export const claimWaitlistDiscount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    // Check if already claimed
    const existingCoupon = await ctx.db
      .query('onboardingCoupons')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (existingCoupon) {
      return { code: existingCoupon.code, alreadyClaimed: true };
    }

    // Generate a unique coupon code
    const code = `WELCOME-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    await ctx.db.insert('onboardingCoupons', {
      userId: user._id,
      code,
      used: false,
    });

    // Update onboarding state
    const state = await ctx.db
      .query('onboardingState')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (state) {
      await ctx.db.patch(state._id, {
        claimedWaitlistDiscount: true,
        updatedAt: now,
      });
    }

    return { code, alreadyClaimed: false };
  },
});

/**
 * Reset onboarding state (for testing/re-onboarding).
 * Replaces: onboarding.resetOnboarding (protectedProcedure mutation)
 */
export const resetOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const state = await ctx.db
      .query('onboardingState')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (state) {
      await ctx.db.delete(state._id);
    }
  },
});
