import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(), // or your auth user ID
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    membershipStatus: v.optional(v.union(
      v.literal("free"),
      v.literal("pro"), // Adjust tier name to match your product
      v.literal("past_due") // For failed payments
    )),
    membershipExpiry: v.optional(v.number()), // Timestamp when membership expires
    stripeCustomerId: v.optional(v.string()), // Stripe customer ID
    stripeSubscriptionId: v.optional(v.string()), // Stripe subscription ID (for subscriptions)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]) // or your auth field
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),
});