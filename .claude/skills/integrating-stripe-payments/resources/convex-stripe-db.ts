import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public query to get current user's membership status
 */
export const getCurrentUserMembership = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      return {
        membershipStatus: "free" as const,
        membershipExpiry: undefined,
      };
    }

    return {
      membershipStatus: user.membershipStatus || "free",
      membershipExpiry: user.membershipExpiry,
    };
  },
});

/**
 * Internal query to get user by Clerk ID
 */
export const getUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    return user;
  },
});

/**
 * Internal mutation to update user's membership status after successful payment
 */
export const updateMembershipStatus = internalMutation({
  args: {
    clerkUserId: v.string(),
    stripeSubscriptionId: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      membershipStatus: "pro",
      membershipExpiry: args.currentPeriodEnd * 1000,
      stripeSubscriptionId: args.stripeSubscriptionId,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

/**
 * Internal mutation to cancel user's membership
 */
export const cancelMembership = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    if (!user) {
      console.error("User not found for subscription:", args.stripeSubscriptionId);
      return null;
    }

    await ctx.db.patch(user._id, {
      membershipStatus: "free",
      membershipExpiry: undefined,
      stripeSubscriptionId: undefined,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

/**
 * Internal mutation to handle payment failure
 */
export const handlePaymentFailure = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    attemptCount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    if (!user) {
      console.error("User not found for subscription:", args.stripeSubscriptionId);
      return null;
    }

    // Grace period logic: keep access for 3 failed attempts
    if (args.attemptCount >= 3) {
      await ctx.db.patch(user._id, {
        membershipStatus: "past_due",
        updatedAt: Date.now(),
      });
    }

    return user._id;
  },
});