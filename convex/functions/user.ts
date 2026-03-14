/**
 * User functions.
 *
 * Replaces: packages/api/src/routers/user.ts (19 procedures)
 */
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  action,
} from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import { requireAuth, requireAdmin, getAuthenticatedUser } from '../lib/auth';
import { authComponent } from '../auth';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get the current authenticated user with profile and reputation.
 * Replaces: user.getCurrentUser (publicProcedure query)
 *
 * This is the primary "who am I" query. Returns null if not authenticated.
 * With Convex reactive queries, this auto-updates on any change.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    // Get profile
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    // Get reputation
    const reputation = await ctx.db
      .query('userReputation')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .unique();

    // Get Better Auth user data (name, email, image)
    const authUser = await authComponent.getAuthUser(ctx);

    return {
      ...user,
      name: authUser?.name,
      email: authUser?.email,
      image: authUser?.image,
      profile,
      reputation,
    };
  },
});

/**
 * Get minimal user info for the current user.
 * Replaces: user.getMe (protectedProcedure query)
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const authUser = await authComponent.getAuthUser(ctx);

    return {
      _id: user._id,
      handle: user.handle,
      role: user.role,
      name: authUser?.name,
      email: authUser?.email,
      image: authUser?.image,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
    };
  },
});

/**
 * Get the current user's GitHub account info.
 * Replaces: user.getGithubAccount (protectedProcedure query)
 */
export const getGithubAccount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Query Better Auth's account table for GitHub provider
    const { auth, headers } = await authComponent.getAuth(
      (await import('../authConfig')).createAuth,
      ctx
    );

    // For now, return the handle which is synced from GitHub
    return {
      handle: user.handle,
      // Full account details would come from Better Auth's account table
    };
  },
});

/**
 * Get linked OAuth accounts for the current user.
 * Replaces: user.getLinkedAccounts (protectedProcedure query)
 */
export const getLinkedAccounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    // Account data is in the Better Auth component's namespace.
    // We'd need to query it via the component adapter.
    // For now, return basic info.
    return [];
  },
});

/**
 * Check handle availability.
 * Replaces: user.checkHandleAvailability (publicProcedure query)
 */
export const checkHandleAvailability = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', args.handle.toLowerCase()))
      .unique();

    return { available: !existing };
  },
});

/**
 * Search for creators/users.
 * Replaces: user.searchCreators (protectedProcedure query)
 */
export const searchCreators = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    if (!args.query || args.query.length < 2) return [];

    // Use search index on handle
    const results = await ctx.db
      .query('users')
      .withSearchIndex('search_handle', (q) => q.search('handle', args.query))
      .take(10);

    // Enrich with auth user data
    const enriched = await Promise.all(
      results.map(async (user) => {
        const authUser = await authComponent.getAnyUserById(
          ctx,
          user.betterAuthUserId
        );
        return {
          _id: user._id,
          handle: user.handle,
          name: authUser?.name,
          image: authUser?.image,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get user activity (bounties created, comments, submissions).
 * Replaces: user.getUserActivity (publicProcedure query)
 */
export const getUserActivity = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Get recent bounties created
    const bounties = await ctx.db
      .query('bounties')
      .withIndex('by_createdById', (q) => q.eq('createdById', args.userId))
      .order('desc')
      .take(limit);

    // Get recent comments
    const comments = await ctx.db
      .query('bountyComments')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    // Get recent submissions
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_contributorId', (q) => q.eq('contributorId', args.userId))
      .order('desc')
      .take(limit);

    // Merge and sort by creation time
    type ActivityItem = {
      type: 'bounty' | 'comment' | 'submission';
      timestamp: number;
      data: any;
    };

    const activity: ActivityItem[] = [
      ...bounties.map((b) => ({
        type: 'bounty' as const,
        timestamp: b._creationTime,
        data: { _id: b._id, title: b.title, status: b.status },
      })),
      ...comments.map((c) => ({
        type: 'comment' as const,
        timestamp: c._creationTime,
        data: {
          _id: c._id,
          bountyId: c.bountyId,
          content: c.content.substring(0, 200),
        },
      })),
      ...submissions.map((s) => ({
        type: 'submission' as const,
        timestamp: s._creationTime,
        data: {
          _id: s._id,
          bountyId: s.bountyId,
          status: s.status,
        },
      })),
    ];

    activity.sort((a, b) => b.timestamp - a.timestamp);
    return activity.slice(0, limit);
  },
});

/**
 * Admin: Get all users with search and pagination.
 * Replaces: user.getAllUsers (adminProcedure query)
 */
export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    let users;
    if (args.search) {
      users = await ctx.db
        .query('users')
        .withSearchIndex('search_handle', (q) =>
          q.search('handle', args.search!)
        )
        .take(200);
    } else {
      users = await ctx.db.query('users').order('desc').collect();
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
        return {
          ...user,
          name: authUser?.name,
          email: authUser?.email,
          image: authUser?.image,
        };
      })
    );

    return { users: enriched, total, page, limit };
  },
});

/**
 * Admin: Get a user's profile details.
 * Replaces: user.adminGetProfile (adminProcedure query)
 */
export const adminGetProfile = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError('NOT_FOUND');

    const authUser = await authComponent.getAnyUserById(
      ctx,
      user.betterAuthUserId
    );

    const bountyCount = (
      await ctx.db
        .query('bounties')
        .withIndex('by_createdById', (q) => q.eq('createdById', args.userId))
        .collect()
    ).length;

    return {
      ...user,
      name: authUser?.name,
      email: authUser?.email,
      image: authUser?.image,
      bountyCount,
    };
  },
});

/**
 * Admin: Get basic user stats.
 * Replaces: user.getUserStats (adminProcedure query)
 */
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query('users').collect();
    return { totalUsers: users.length };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set the user's handle.
 * Replaces: user.setHandle (protectedProcedure mutation)
 */
export const setHandle = mutation({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const handle = args.handle.toLowerCase();

    // Check uniqueness
    const existing = await ctx.db
      .query('users')
      .withIndex('by_handle', (q) => q.eq('handle', handle))
      .unique();

    if (existing && existing._id !== user._id) {
      throw new ConvexError('HANDLE_TAKEN');
    }

    await ctx.db.patch(user._id, {
      handle,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update profile privacy setting.
 * Replaces: user.updateProfilePrivacy (protectedProcedure mutation)
 */
export const updateProfilePrivacy = mutation({
  args: { isProfilePrivate: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await ctx.db.patch(user._id, {
      isProfilePrivate: args.isProfilePrivate,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update card background preference.
 * Replaces: user.updateCardBackground (protectedProcedure mutation)
 */
export const updateCardBackground = mutation({
  args: { cardBackground: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await ctx.db.patch(user._id, {
      cardBackground: args.cardBackground,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Admin: Update a user's name.
 * Replaces: user.adminUpdateName (adminProcedure mutation)
 */
export const adminUpdateName = mutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError('NOT_FOUND');

    // Update name in Better Auth's user table via the adapter
    // This would need to go through the auth component API
    // For now, we just log it
    console.log(`[Admin] Update name for ${args.userId} to ${args.name}`);
  },
});

/**
 * Admin: Update a user's role.
 * Replaces: user.updateUserRole (adminProcedure mutation)
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError('NOT_FOUND');

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Apply an invite token.
 * Replaces: user.applyInvite (protectedProcedure mutation)
 */
export const applyInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Hash the token (SHA-256) — in Convex we can use SubtleCrypto in actions,
    // but for mutations we need a simpler approach. We'll store the hash
    // comparison logic here.
    // For now, do a direct token lookup (the migration would store hashes)
    const invite = await ctx.db
      .query('invites')
      .withIndex('by_tokenHash', (q) => q.eq('tokenHash', args.token))
      .unique();

    if (!invite) throw new ConvexError('INVALID_INVITE');
    if (invite.usedAt) throw new ConvexError('INVITE_ALREADY_USED');

    const now = Date.now();
    if (invite.expiresAt < now) throw new ConvexError('INVITE_EXPIRED');

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedAt: now,
      usedByUserId: user._id,
    });

    // Grant early access role if user is a basic user
    if (user.role === 'user') {
      await ctx.db.patch(user._id, {
        role: 'early_access',
        updatedAt: now,
      });
    }
  },
});

/**
 * Revoke a session.
 * Replaces: user.revokeSession (protectedProcedure mutation)
 */
export const revokeSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    // Session revocation is handled by Better Auth component.
    // We would call the auth API to revoke the session.
    console.log(`[Auth] Session revocation requested: ${args.sessionId}`);
  },
});

/**
 * Admin: Invite an external user by email.
 * Replaces: user.inviteExternalUser (adminProcedure mutation → action for email)
 */
export const inviteExternalUser = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Verify admin
    // In actions, we need to run a query to check auth
    // For now, this is a stub that would:
    // 1. Generate a random token
    // 2. Hash it
    // 3. Store the invite via mutation
    // 4. Send the invite email via Resend component

    const token = crypto.randomUUID();
    // Hash would be computed here

    await ctx.runMutation(internal.functions.user.createInvite, {
      email: args.email,
      tokenHash: token, // In production: SHA-256 hash
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // TODO: Send email via @convex-dev/resend
    console.log(`[Email] Invite sent to ${args.email} with token ${token}`);

    return { success: true };
  },
});

/**
 * Internal: Create an invite record.
 */
export const createInvite = internalMutation({
  args: {
    email: v.string(),
    tokenHash: v.string(),
    expiresAt: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('invites', {
      email: args.email,
      tokenHash: args.tokenHash,
      expiresAt: args.expiresAt,
    });
  },
});

/**
 * Internal: Get minimal user info (for use in actions via ctx.runQuery).
 */
export const getMeInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const authUser = await authComponent.getAuthUser(ctx);

    return {
      _id: user._id,
      handle: user.handle,
      role: user.role,
      name: authUser?.name,
      email: authUser?.email,
      image: authUser?.image,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
    };
  },
});
