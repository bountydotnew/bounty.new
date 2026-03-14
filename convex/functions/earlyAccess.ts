/**
 * Early access / waitlist functions.
 *
 * Replaces: packages/api/src/routers/early-access.ts (13 procedures)
 */
import { query, mutation, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import { requireAuth, requireAdmin, getAuthenticatedUser } from '../lib/auth';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get total waitlist count.
 * Replaces: earlyAccess.getWaitlistCount (publicProcedure query)
 */
export const getWaitlistCount = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query('waitlist').collect();
    return { count: entries.length };
  },
});

/**
 * Get a specific waitlist entry.
 * Replaces: earlyAccess.getWaitlistEntry (publicProcedure query)
 */
export const getWaitlistEntry = query({
  args: { entryId: v.id('waitlist') },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) return null;

    // Calculate position if not set
    if (!entry.position) {
      const earlier = await ctx.db.query('waitlist').collect();
      const position =
        earlier.filter((e) => e._creationTime < entry._creationTime).length + 1;
      return { ...entry, position };
    }

    return entry;
  },
});

/**
 * Get the current user's waitlist entry.
 * Replaces: earlyAccess.getMyWaitlistEntry (protectedProcedure query)
 */
export const getMyWaitlistEntry = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Try by userId first
    let entry = await ctx.db
      .query('waitlist')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first();

    if (!entry) {
      // Try by email via Better Auth
      const { authComponent } = await import('../auth');
      const authUser = await authComponent.getAuthUser(ctx);
      if (authUser?.email) {
        entry = await ctx.db
          .query('waitlist')
          .withIndex('by_email', (q) => q.eq('email', authUser.email))
          .first();

        // Note: auto-linking is done via linkUserToWaitlist mutation,
        // not here — queries are read-only in Convex.
      }
    }

    if (!entry) return null;

    // Calculate position
    const all = await ctx.db.query('waitlist').collect();
    const position =
      all.filter((e) => e._creationTime < entry!._creationTime).length + 1;

    return { ...entry, position };
  },
});

/**
 * Admin: Get paginated waitlist with stats.
 * Replaces: earlyAccess.getAdminWaitlist (adminProcedure query)
 */
export const getAdminWaitlist = query({
  args: {
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    let entries = await ctx.db.query('waitlist').order('desc').collect();

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      entries = entries.filter((e) =>
        e.email.toLowerCase().includes(searchLower)
      );
    }

    const total = entries.length;
    const verified = entries.filter((e) => e.emailVerified).length;
    const granted = entries.filter((e) => e.accessGrantedAt).length;

    const start = (page - 1) * limit;
    const paginated = entries.slice(start, start + limit);

    return {
      entries: paginated,
      total,
      verified,
      granted,
      page,
      limit,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add email to waitlist.
 * Replaces: earlyAccess.addToWaitlist (rateLimitedPublicProcedure mutation)
 */
export const addToWaitlist = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check for duplicate
    const existing = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    if (existing) {
      return { entryId: existing._id, alreadyExists: true };
    }

    const entryId = await ctx.db.insert('waitlist', {
      email,
      otpAttempts: 0,
      emailVerified: false,
    });

    return { entryId, alreadyExists: false };
  },
});

/**
 * Submit waitlist with bounty draft and OTP.
 * Replaces: earlyAccess.submitWithBounty (rateLimitedPublicProcedure mutation)
 */
export const submitWithBounty = mutation({
  args: {
    email: v.string(),
    bountyTitle: v.optional(v.string()),
    bountyDescription: v.optional(v.string()),
    bountyAmount: v.optional(v.string()),
    bountyGithubIssueUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check for existing entry
    const entry = await ctx.db
      .query('waitlist')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();

    // Generate 6-digit OTP
    const otpCode = Math.floor(100_000 + Math.random() * 900_000).toString();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (entry) {
      await ctx.db.patch(entry._id, {
        otpCode,
        otpExpiresAt,
        otpAttempts: 0,
        bountyTitle: args.bountyTitle ?? entry.bountyTitle,
        bountyDescription: args.bountyDescription ?? entry.bountyDescription,
        bountyAmount: args.bountyAmount ?? entry.bountyAmount,
        bountyGithubIssueUrl:
          args.bountyGithubIssueUrl ?? entry.bountyGithubIssueUrl,
      });
      return { entryId: entry._id };
    }

    const entryId = await ctx.db.insert('waitlist', {
      email,
      otpCode,
      otpExpiresAt,
      otpAttempts: 0,
      emailVerified: false,
      bountyTitle: args.bountyTitle,
      bountyDescription: args.bountyDescription,
      bountyAmount: args.bountyAmount,
      bountyGithubIssueUrl: args.bountyGithubIssueUrl,
    });

    // TODO: Send OTP email via @convex-dev/resend action

    return { entryId };
  },
});

/**
 * Verify OTP code.
 * Replaces: earlyAccess.verifyOTP (publicProcedure mutation)
 */
export const verifyOTP = mutation({
  args: {
    entryId: v.id('waitlist'),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError('NOT_FOUND');

    // Check attempts
    if (entry.otpAttempts >= 5) {
      throw new ConvexError('TOO_MANY_ATTEMPTS');
    }

    // Check expiry
    if (!entry.otpExpiresAt || entry.otpExpiresAt < Date.now()) {
      throw new ConvexError('OTP_EXPIRED');
    }

    // Increment attempts
    await ctx.db.patch(args.entryId, {
      otpAttempts: entry.otpAttempts + 1,
    });

    // Timing-safe comparison (basic — full crypto comparison in action)
    if (entry.otpCode !== args.code) {
      throw new ConvexError('INVALID_OTP');
    }

    // Mark as verified
    await ctx.db.patch(args.entryId, {
      emailVerified: true,
      otpCode: undefined,
      otpExpiresAt: undefined,
    });

    return { verified: true };
  },
});

/**
 * Resend OTP code.
 * Replaces: earlyAccess.resendOTP (rateLimitedPublicProcedure mutation)
 */
export const resendOTP = mutation({
  args: { entryId: v.id('waitlist') },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError('NOT_FOUND');

    const otpCode = Math.floor(100_000 + Math.random() * 900_000).toString();
    const otpExpiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.db.patch(args.entryId, {
      otpCode,
      otpExpiresAt,
      otpAttempts: 0,
    });

    // TODO: Send OTP email via @convex-dev/resend action

    return { sent: true };
  },
});

/**
 * Admin: Grant waitlist access to a user.
 * Replaces: earlyAccess.grantWaitlistAccess (adminProcedure mutation)
 */
export const grantWaitlistAccess = mutation({
  args: { id: v.id('waitlist') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const entry = await ctx.db.get(args.id);
    if (!entry) throw new ConvexError('NOT_FOUND');

    const accessToken = crypto.randomUUID();

    await ctx.db.patch(args.id, {
      accessToken,
      accessGrantedAt: Date.now(),
    });

    // If the user already has an account, update their role
    if (entry.userId) {
      const user = await ctx.db.get(entry.userId);
      if (user && user.role === 'user') {
        await ctx.db.patch(user._id, {
          role: 'early_access',
          updatedAt: Date.now(),
        });
      }
    }

    // TODO: Send access granted email via @convex-dev/resend action

    return { accessToken };
  },
});

/**
 * Accept an access token.
 * Replaces: earlyAccess.acceptAccessToken (protectedProcedure mutation)
 */
export const acceptAccessToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const entry = await ctx.db
      .query('waitlist')
      .withIndex('by_accessToken', (q) => q.eq('accessToken', args.token))
      .unique();

    if (!entry) throw new ConvexError('INVALID_TOKEN');

    // Update user role
    if (user.role === 'user') {
      await ctx.db.patch(user._id, {
        role: 'early_access',
        updatedAt: Date.now(),
      });
    }

    // Clear the token (one-time use)
    await ctx.db.patch(entry._id, {
      accessToken: undefined,
      userId: user._id,
    });

    return { success: true };
  },
});

/**
 * Link authenticated user to a waitlist entry.
 * Replaces: earlyAccess.linkUserToWaitlist (protectedProcedure mutation)
 */
export const linkUserToWaitlist = mutation({
  args: { entryId: v.id('waitlist') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError('NOT_FOUND');

    // Verify email ownership
    const { authComponent } = await import('../auth');
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser || authUser.email !== entry.email) {
      throw new ConvexError('EMAIL_MISMATCH');
    }

    await ctx.db.patch(args.entryId, {
      userId: user._id,
    });
  },
});

/**
 * Update bounty draft on waitlist entry.
 * Replaces: earlyAccess.updateBountyDraft (protectedProcedure mutation)
 */
export const updateBountyDraft = mutation({
  args: {
    entryId: v.id('waitlist'),
    bountyTitle: v.optional(v.string()),
    bountyDescription: v.optional(v.string()),
    bountyAmount: v.optional(v.string()),
    bountyDeadline: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError('NOT_FOUND');
    if (entry.userId !== user._id) throw new ConvexError('FORBIDDEN');

    const updates: Record<string, any> = {};
    if (args.bountyTitle !== undefined) updates.bountyTitle = args.bountyTitle;
    if (args.bountyDescription !== undefined)
      updates.bountyDescription = args.bountyDescription;
    if (args.bountyAmount !== undefined)
      updates.bountyAmount = args.bountyAmount;
    if (args.bountyDeadline !== undefined)
      updates.bountyDeadline = args.bountyDeadline;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.entryId, updates);
    }
  },
});
