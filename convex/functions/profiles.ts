/**
 * Profile functions.
 *
 * Replaces: packages/api/src/routers/profiles.ts (7 procedures)
 */
import { query, mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth, getAuthenticatedUser, resolveUserId } from '../lib/auth';
import { authComponent } from '../auth';
import { toDollars, toCents } from '../lib/money';

/**
 * Get a user's public profile.
 * Replaces: profiles.getProfile (publicProcedure query)
 */
export const getProfile = query({
  args: {
    userId: v.optional(v.id('users')),
    handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user;

    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else if (args.handle) {
      user = await ctx.db
        .query('users')
        .withIndex('by_handle', (q) =>
          q.eq('handle', args.handle!.toLowerCase())
        )
        .unique();
    }

    if (!user) return null;

    // Check privacy
    if (user.isProfilePrivate) {
      const currentUser = await getAuthenticatedUser(ctx);
      if (!currentUser || currentUser._id !== user._id) {
        return {
          _id: user._id,
          handle: user.handle,
          isPrivate: true,
        };
      }
    }

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', user!._id))
      .unique();

    const reputation = await ctx.db
      .query('userReputation')
      .withIndex('by_userId', (q) => q.eq('userId', user!._id))
      .unique();

    const authUser = await authComponent.getAnyUserById(
      ctx,
      user.betterAuthUserId
    );

    return {
      _id: user._id,
      handle: user.handle,
      role: user.role,
      name: authUser?.name,
      email: authUser?.email,
      image: authUser?.image,
      createdAt: user._creationTime,
      isPrivate: false,
      profile: profile
        ? {
            ...profile,
            hourlyRate: profile.hourlyRateCents
              ? toDollars(profile.hourlyRateCents)
              : null,
          }
        : null,
      reputation: reputation
        ? {
            ...reputation,
            totalEarned: toDollars(reputation.totalEarnedCents),
          }
        : null,
    };
  },
});

/**
 * Get the current user's own profile.
 * Replaces: profiles.getMyProfile (protectedProcedure query)
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    const reputation = await ctx.db
      .query('userReputation')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    return { profile, reputation };
  },
});

/**
 * Update the current user's profile.
 * Replaces: profiles.updateProfile (protectedProcedure mutation)
 */
export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    preferredLanguages: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.float64()), // in dollars, converted to cents
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
    availableForWork: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    const profileData = {
      bio: args.bio,
      location: args.location,
      website: args.website,
      githubUsername: args.githubUsername,
      twitterUsername: args.twitterUsername,
      linkedinUrl: args.linkedinUrl,
      skills: args.skills,
      preferredLanguages: args.preferredLanguages,
      hourlyRateCents:
        args.hourlyRate !== undefined ? toCents(args.hourlyRate) : undefined,
      currency: args.currency,
      timezone: args.timezone,
      availableForWork: args.availableForWork,
      updatedAt: now,
    };

    // Remove undefined fields for patch
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(profileData)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, cleanData);
    } else {
      await ctx.db.insert('userProfiles', {
        userId: user._id,
        ...cleanData,
        updatedAt: now,
      } as any);
    }

    // Ensure reputation record exists
    const reputation = await ctx.db
      .query('userReputation')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    if (!reputation) {
      await ctx.db.insert('userReputation', {
        userId: user._id,
        totalEarnedCents: 0n,
        bountiesCompleted: 0,
        bountiesCreated: 0,
        averageRating: 0,
        totalRatings: 0,
        successRate: 0,
        completionRate: 0,
        updatedAt: now,
      });
    }
  },
});

/**
 * Get top contributors ranked by reputation.
 * Replaces: profiles.getTopContributors (publicProcedure query)
 */
export const getTopContributors = query({
  args: {
    limit: v.optional(v.float64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const reputations = await ctx.db.query('userReputation').collect();

    // Sort by the requested field
    const sortBy = args.sortBy ?? 'totalEarnedCents';
    reputations.sort((a, b) => {
      const aVal = Number((a as any)[sortBy] ?? 0);
      const bVal = Number((b as any)[sortBy] ?? 0);
      return bVal - aVal;
    });

    const topReps = reputations.slice(0, limit);

    const contributors = await Promise.all(
      topReps.map(async (rep) => {
        const user = await ctx.db.get(rep.userId);
        if (!user) return null;

        const authUser = await authComponent.getAnyUserById(
          ctx,
          user.betterAuthUserId
        );

        const profile = await ctx.db
          .query('userProfiles')
          .withIndex('by_userId', (q) => q.eq('userId', user._id))
          .unique();

        return {
          _id: user._id,
          handle: user.handle,
          name: authUser?.name,
          image: authUser?.image,
          reputation: {
            ...rep,
            totalEarned: toDollars(rep.totalEarnedCents),
          },
          profile,
        };
      })
    );

    return contributors.filter(Boolean);
  },
});

/**
 * Rate a user for a specific bounty.
 * Replaces: profiles.rateUser (protectedProcedure mutation)
 */
export const rateUser = mutation({
  args: {
    ratedUserId: v.id('users'),
    bountyId: v.id('bounties'),
    rating: v.float64(), // 1-5
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    // Cannot rate yourself
    if (args.ratedUserId === user._id) {
      throw new ConvexError('CANNOT_RATE_SELF');
    }

    // Validate rating range
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError('INVALID_RATING');
    }

    // Check for duplicate rating
    const existing = await ctx.db
      .query('userRatings')
      .withIndex('by_ratedUser_bounty', (q) =>
        q.eq('ratedUserId', args.ratedUserId).eq('bountyId', args.bountyId)
      )
      .first();

    if (existing && existing.raterUserId === user._id) {
      throw new ConvexError('ALREADY_RATED');
    }

    // Insert rating
    await ctx.db.insert('userRatings', {
      ratedUserId: args.ratedUserId,
      raterUserId: user._id,
      bountyId: args.bountyId,
      rating: args.rating,
      comment: args.comment,
      updatedAt: now,
    });

    // Recalculate average rating for the rated user
    const allRatings = await ctx.db
      .query('userRatings')
      .withIndex('by_ratedUserId', (q) => q.eq('ratedUserId', args.ratedUserId))
      .collect();

    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    const reputation = await ctx.db
      .query('userReputation')
      .withIndex('by_userId', (q) => q.eq('userId', args.ratedUserId))
      .unique();

    if (reputation) {
      await ctx.db.patch(reputation._id, {
        averageRating: Math.round(avgRating * 100) / 100,
        totalRatings: allRatings.length,
        updatedAt: now,
      });
    }
  },
});

/**
 * Get ratings for a user.
 * Replaces: profiles.getUserRatings (publicProcedure query)
 */
export const getUserRatings = query({
  args: {
    userId: v.string(),
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const resolved = await resolveUserId(ctx, args.userId);
    if (!resolved) return { ratings: [], total: 0, page: 1, limit: 10 };
    const page = args.page ?? 1;
    const limit = args.limit ?? 10;

    const ratings = await ctx.db
      .query('userRatings')
      .withIndex('by_ratedUserId', (q) => q.eq('ratedUserId', resolved as any))
      .order('desc')
      .collect();

    const total = ratings.length;
    const start = (page - 1) * limit;
    const paginated = ratings.slice(start, start + limit);

    const enriched = await Promise.all(
      paginated.map(async (rating) => {
        const rater = await ctx.db.get(rating.raterUserId);
        const authUser = rater
          ? await authComponent.getAnyUserById(ctx, rater.betterAuthUserId)
          : null;

        return {
          ...rating,
          rater: rater
            ? {
                _id: rater._id,
                handle: rater.handle,
                name: authUser?.name,
                image: authUser?.image,
              }
            : null,
        };
      })
    );

    return { ratings: enriched, total, page, limit };
  },
});

/**
 * Search profiles.
 * Replaces: profiles.searchProfiles (publicProcedure query)
 */
export const searchProfiles = query({
  args: {
    query: v.string(),
    skills: v.optional(v.array(v.string())),
    availableForWork: v.optional(v.boolean()),
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    // Search by handle
    let users = await ctx.db
      .query('users')
      .withSearchIndex('search_handle', (q) => q.search('handle', args.query))
      .take(100);

    // Filter by skills if specified
    if (args.skills && args.skills.length > 0) {
      const profilesWithSkills = await Promise.all(
        users.map(async (user) => {
          const profile = await ctx.db
            .query('userProfiles')
            .withIndex('by_userId', (q) => q.eq('userId', user._id))
            .unique();

          if (!profile?.skills) return null;

          const hasMatchingSkill = args.skills!.some((skill) =>
            profile.skills!.includes(skill)
          );

          if (!hasMatchingSkill) return null;

          if (
            args.availableForWork !== undefined &&
            profile.availableForWork !== args.availableForWork
          ) {
            return null;
          }

          return user;
        })
      );

      users = profilesWithSkills.filter(Boolean) as typeof users;
    }

    const total = users.length;
    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit);

    const enriched = await Promise.all(
      paginated.map(async (user) => {
        const authUser = await authComponent.getAnyUserById(
          ctx,
          user.betterAuthUserId
        );
        const profile = await ctx.db
          .query('userProfiles')
          .withIndex('by_userId', (q) => q.eq('userId', user._id))
          .unique();
        const reputation = await ctx.db
          .query('userReputation')
          .withIndex('by_userId', (q) => q.eq('userId', user._id))
          .unique();

        return {
          _id: user._id,
          handle: user.handle,
          name: authUser?.name,
          image: authUser?.image,
          profile,
          reputation: reputation
            ? {
                ...reputation,
                totalEarned: toDollars(reputation.totalEarnedCents),
              }
            : null,
        };
      })
    );

    return { profiles: enriched, total, page, limit };
  },
});
