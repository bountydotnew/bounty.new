/**
 * Feature vote functions.
 *
 * Replaces: packages/api/src/routers/feature-votes.ts (4 procedures)
 */
import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../lib/auth';

/**
 * Get vote counts for all integrations.
 * Replaces: featureVotes.getIntegrationVotes (publicProcedure query)
 */
export const getIntegrationVotes = query({
  args: {},
  handler: async (ctx) => {
    const votes = await ctx.db.query('featureVotes').collect();

    // Group by featureKey and count
    const voteCounts: Record<string, number> = {};
    for (const vote of votes) {
      voteCounts[vote.featureKey] = (voteCounts[vote.featureKey] || 0) + 1;
    }

    return voteCounts;
  },
});

/**
 * Get the current user's vote.
 * Replaces: featureVotes.getUserVote (protectedProcedure query)
 */
export const getUserVote = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const vote = await ctx.db
      .query('featureVotes')
      .withIndex('by_user_featureType', (q) =>
        q.eq('userId', user._id).eq('featureType', 'integration')
      )
      .unique();

    return vote;
  },
});

/**
 * Vote for an integration feature.
 * Replaces: featureVotes.vote (protectedProcedure mutation)
 */
export const vote = mutation({
  args: {
    integrationKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if user already voted for this feature type
    const existing = await ctx.db
      .query('featureVotes')
      .withIndex('by_user_featureType', (q) =>
        q.eq('userId', user._id).eq('featureType', 'integration')
      )
      .unique();

    if (existing) {
      // Update the existing vote to the new key
      await ctx.db.patch(existing._id, {
        featureKey: args.integrationKey,
      });
    } else {
      await ctx.db.insert('featureVotes', {
        userId: user._id,
        featureType: 'integration',
        featureKey: args.integrationKey,
      });
    }
  },
});

/**
 * Remove the current user's vote.
 * Replaces: featureVotes.removeVote (protectedProcedure mutation)
 */
export const removeVote = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query('featureVotes')
      .withIndex('by_user_featureType', (q) =>
        q.eq('userId', user._id).eq('featureType', 'integration')
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
