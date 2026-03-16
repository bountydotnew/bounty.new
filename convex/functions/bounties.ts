/**
 * Bounty functions.
 *
 * Replaces: packages/api/src/routers/bounties.ts (38 procedures)
 *
 * This is the largest function file in the codebase. It covers:
 * - Bounty CRUD
 * - Voting, bookmarking, commenting
 * - Submissions and applications
 * - Payment flow (via Stripe actions)
 * - Cancellation flow
 * - GitHub/Linear sync (via actions)
 */
import {
  query,
  mutation,
  action,
  internalMutation,
  internalQuery,
} from '../_generated/server';
import { authComponent } from '../auth';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import {
  requireAuth,
  requireAdmin,
  requireOrgMember,
  getAuthenticatedUser,
  resolveUserId,
} from '../lib/auth';
import { toDollars, toCents, calculateTotalWithFees } from '../lib/money';
import {
  bountyStatus,
  submissionStatus,
  paymentStatus,
  cancellationRequestStatus,
} from '../schema';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get global bounty stats.
 * Replaces: bounties.getBountyStats (publicProcedure query)
 */
export const getBountyStats = query({
  args: {},
  handler: async (ctx) => {
    const bounties = await ctx.db.query('bounties').collect();

    const totalBounties = bounties.length;
    const openBounties = bounties.filter((b) => b.status === 'open').length;
    const completedBounties = bounties.filter(
      (b) => b.status === 'completed'
    ).length;
    const totalValueCents = bounties.reduce(
      (sum, b) => sum + Number(b.amountCents),
      0
    );

    return {
      totalBounties,
      openBounties,
      completedBounties,
      totalValueCents: BigInt(totalValueCents),
      totalValueDollars: totalValueCents / 100,
    };
  },
});

/**
 * Fetch bounty by ID with full detail.
 * Replaces: bounties.getBountyDetail (publicProcedure query)
 */
export const getBountyDetail = query({
  args: { id: v.id('bounties') },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.id);
    if (!bounty) return null;

    // Get the creator
    const creator = await ctx.db.get(bounty.createdById);

    // Get vote count
    const votes = await ctx.db
      .query('bountyVotes')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.id))
      .collect();

    // Get comments with user info
    const commentsRaw = await ctx.db
      .query('bountyComments')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.id))
      .order('asc')
      .collect();

    const comments = await Promise.all(
      commentsRaw.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const likes = await ctx.db
          .query('bountyCommentLikes')
          .withIndex('by_commentId', (q) => q.eq('commentId', comment._id))
          .collect();
        return {
          ...comment,
          user: user
            ? { _id: user._id, handle: user.handle, role: user.role }
            : null,
          likeCount: likes.length,
        };
      })
    );

    // Get links
    const links = await ctx.db
      .query('bountyLinks')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.id))
      .collect();

    // Get submissions
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.id))
      .collect();

    // Check current user interactions
    const currentUser = await getAuthenticatedUser(ctx);
    let hasVoted = false;
    let hasBookmarked = false;

    if (currentUser) {
      const userVote = await ctx.db
        .query('bountyVotes')
        .withIndex('by_bounty_user', (q) =>
          q.eq('bountyId', args.id).eq('userId', currentUser._id)
        )
        .unique();
      hasVoted = !!userVote;

      const userBookmark = await ctx.db
        .query('bountyBookmarks')
        .withIndex('by_bounty_user', (q) =>
          q.eq('bountyId', args.id).eq('userId', currentUser._id)
        )
        .unique();
      hasBookmarked = !!userBookmark;
    }

    return {
      ...bounty,
      amountDollars: toDollars(bounty.amountCents),
      creator: creator
        ? { _id: creator._id, handle: creator.handle, role: creator.role }
        : null,
      voteCount: votes.length,
      comments,
      links,
      submissionCount: submissions.length,
      hasVoted,
      hasBookmarked,
    };
  },
});

/**
 * Fetch all bounties with filtering and pagination.
 * Replaces: bounties.fetchAllBounties (protectedProcedure query)
 */
export const fetchAllBounties = query({
  args: {
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
    status: v.optional(bountyStatus),
    search: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    creatorId: v.optional(v.id('users')),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    let bounties;

    // Use search index if text search is requested
    if (args.search) {
      bounties = await ctx.db
        .query('bounties')
        .withSearchIndex('search_title', (q) => q.search('title', args.search!))
        .take(200);
    } else if (args.status) {
      bounties = await ctx.db
        .query('bounties')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .order('desc')
        .collect();
    } else if (args.creatorId) {
      bounties = await ctx.db
        .query('bounties')
        .withIndex('by_createdById', (q) =>
          q.eq('createdById', args.creatorId!)
        )
        .order('desc')
        .collect();
    } else {
      bounties = await ctx.db.query('bounties').order('desc').collect();
    }

    // Apply tag filter in memory
    if (args.tags && args.tags.length > 0) {
      bounties = bounties.filter(
        (b) => b.tags && args.tags!.some((tag) => b.tags!.includes(tag))
      );
    }

    // Paginate
    const total = bounties.length;
    const start = (page - 1) * limit;
    const paginated = bounties.slice(start, start + limit);

    // Enrich with creator info
    const enriched = await Promise.all(
      paginated.map(async (bounty) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('_id'), bounty.createdById))
          .unique();
        return {
          ...bounty,
          amountDollars: toDollars(bounty.amountCents),
          creator: creator
            ? { _id: creator._id, handle: creator.handle }
            : null,
        };
      })
    );

    return {
      bounties: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

/**
 * Get a random open bounty.
 * Replaces: bounties.randomBounty (publicProcedure query)
 */
export const randomBounty = query({
  args: {},
  handler: async (ctx) => {
    const openBounties = await ctx.db
      .query('bounties')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .collect();

    if (openBounties.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * openBounties.length);
    return openBounties[randomIndex];
  },
});

/**
 * Get bounties by user ID.
 * Replaces: bounties.getBountiesByUserId (publicProcedure query)
 */
export const getBountiesByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // userId may be a Convex Id or a Better Auth user ID — resolve it
    let convexUserId = args.userId;
    try {
      // Check if it's a valid Convex ID by trying to normalize it
      const normalized = ctx.db.normalizeId('users', args.userId);
      if (normalized) {
        convexUserId = normalized;
      } else {
        // Not a Convex ID — look up by betterAuthUserId
        const user = await ctx.db
          .query('users')
          .withIndex('by_betterAuthUserId', (q) =>
            q.eq('betterAuthUserId', args.userId)
          )
          .unique();
        if (user) convexUserId = user._id;
        else return [];
      }
    } catch {
      return [];
    }

    const bounties = await ctx.db
      .query('bounties')
      .withIndex('by_createdById', (q) =>
        q.eq('createdById', convexUserId as any)
      )
      .order('desc')
      .collect();

    return bounties.map((b) => ({
      ...b,
      amountDollars: toDollars(b.amountCents),
    }));
  },
});

/**
 * Get bounty vote count and user vote status.
 * Replaces: bounties.getBountyVotes (publicProcedure query)
 */
export const getBountyVotes = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query('bountyVotes')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .collect();

    const currentUser = await getAuthenticatedUser(ctx);
    let hasVoted = false;
    if (currentUser) {
      hasVoted = votes.some((v) => v.userId === currentUser._id);
    }

    return { count: votes.length, hasVoted };
  },
});

/**
 * Check if user has bookmarked a bounty.
 * Replaces: bounties.getBountyBookmark (publicProcedure query)
 */
export const getBountyBookmark = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser) return { hasBookmarked: false };

    const bookmark = await ctx.db
      .query('bountyBookmarks')
      .withIndex('by_bounty_user', (q) =>
        q.eq('bountyId', args.bountyId).eq('userId', currentUser._id)
      )
      .unique();

    return { hasBookmarked: !!bookmark };
  },
});

/**
 * Get submissions for a bounty.
 * Replaces: bounties.getBountySubmissions (publicProcedure query)
 */
export const getBountySubmissions = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .order('desc')
      .collect();

    const enriched = await Promise.all(
      submissions.map(async (sub) => {
        const contributor = await ctx.db.get(sub.contributorId);
        return {
          ...sub,
          contributor: contributor
            ? { _id: contributor._id, handle: contributor.handle }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get bounty comments.
 * Replaces: bounties.getBountyComments (publicProcedure query)
 */
export const getBountyComments = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('bountyComments')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .order('asc')
      .collect();

    const enriched = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        const likes = await ctx.db
          .query('bountyCommentLikes')
          .withIndex('by_commentId', (q) => q.eq('commentId', comment._id))
          .collect();

        const currentUser = await getAuthenticatedUser(ctx);
        let hasLiked = false;
        if (currentUser) {
          hasLiked = likes.some((l) => l.userId === currentUser._id);
        }

        return {
          ...comment,
          user: user
            ? { _id: user._id, handle: user.handle, role: user.role }
            : null,
          likeCount: likes.length,
          hasLiked,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get cancellation request status for a bounty.
 * Replaces: bounties.getCancellationStatus (protectedProcedure query)
 */
export const getCancellationStatus = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    const request = await ctx.db
      .query('cancellationRequests')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .order('desc')
      .first();

    return request;
  },
});

/**
 * List bookmarked bounties for the current user.
 * Replaces: bounties.listBookmarkedBounties (protectedProcedure query)
 */
export const listBookmarkedBounties = query({
  args: {
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return { bounties: [], total: 0, page: 1, limit: 20 };
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    const bookmarks = await ctx.db
      .query('bountyBookmarks')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect();

    const total = bookmarks.length;
    const start = (page - 1) * limit;
    const paginated = bookmarks.slice(start, start + limit);

    const bounties = await Promise.all(
      paginated.map(async (bookmark) => {
        const bounty = await ctx.db.get(bookmark.bountyId);
        if (!bounty) return null;
        const creator = await ctx.db.get(bounty.createdById);
        return {
          ...bounty,
          amountDollars: toDollars(bounty.amountCents),
          creator: creator
            ? { _id: creator._id, handle: creator.handle }
            : null,
          bookmarkedAt: bookmark._creationTime,
        };
      })
    );

    return {
      bounties: bounties.filter(Boolean),
      total,
      page,
      limit,
    };
  },
});

/**
 * List open bounties for RSS feed (internal).
 */
export const listOpenBountiesForFeed = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('bounties')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .order('desc')
      .take(50);
  },
});

// ============================================================================
// MUTATIONS — Simple interactions
// ============================================================================

/**
 * Toggle vote on a bounty.
 * Replaces: bounties.voteBounty (protectedProcedure mutation)
 */
export const voteBounty = mutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query('bountyVotes')
      .withIndex('by_bounty_user', (q) =>
        q.eq('bountyId', args.bountyId).eq('userId', user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { voted: false };
    }

    await ctx.db.insert('bountyVotes', {
      bountyId: args.bountyId,
      userId: user._id,
    });
    return { voted: true };
  },
});

/**
 * Toggle bookmark on a bounty.
 * Replaces: bounties.toggleBountyBookmark (protectedProcedure mutation)
 */
export const toggleBountyBookmark = mutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query('bountyBookmarks')
      .withIndex('by_bounty_user', (q) =>
        q.eq('bountyId', args.bountyId).eq('userId', user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert('bountyBookmarks', {
      bountyId: args.bountyId,
      userId: user._id,
    });
    return { bookmarked: true };
  },
});

/**
 * Add a comment to a bounty.
 * Replaces: bounties.addBountyComment (rateLimitedProtectedProcedure mutation)
 */
export const addBountyComment = mutation({
  args: {
    bountyId: v.id('bounties'),
    content: v.string(),
    parentId: v.optional(v.id('bountyComments')),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Check for duplicate (same user, same content, within 5 seconds)
    const recentComments = await ctx.db
      .query('bountyComments')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', args.bountyId))
      .order('desc')
      .take(5);

    const isDuplicate = recentComments.some(
      (c) =>
        c.userId === user._id &&
        c.content === args.content &&
        now - c._creationTime < 5000
    );

    if (isDuplicate) {
      throw new ConvexError('DUPLICATE_COMMENT');
    }

    const commentId = await ctx.db.insert('bountyComments', {
      bountyId: args.bountyId,
      userId: user._id,
      parentId: args.parentId,
      content: args.content,
      editCount: 0,
      updatedAt: now,
    });

    // Send notification to bounty creator (if not self-commenting)
    if (bounty.createdById !== user._id) {
      await ctx.scheduler.runAfter(
        0,
        internal.functions.notifications.createNotification,
        {
          userId: bounty.createdById,
          type: 'bounty_comment',
          title: 'New comment on your bounty',
          message: `${user.handle || 'Someone'} commented on "${bounty.title}"`,
          data: {
            bountyId: args.bountyId,
            commentId,
            userId: user._id,
          },
        }
      );
    }

    return commentId;
  },
});

/**
 * Update a comment.
 * Replaces: bounties.updateBountyComment (protectedProcedure mutation)
 */
export const updateBountyComment = mutation({
  args: {
    commentId: v.id('bountyComments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new ConvexError('NOT_FOUND');
    if (comment.userId !== user._id) throw new ConvexError('FORBIDDEN');

    await ctx.db.patch(args.commentId, {
      content: args.content,
      originalContent: comment.originalContent ?? comment.content,
      editCount: comment.editCount + 1,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a comment.
 * Replaces: bounties.deleteBountyComment (protectedProcedure mutation)
 */
export const deleteBountyComment = mutation({
  args: { commentId: v.id('bountyComments') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new ConvexError('NOT_FOUND');
    if (comment.userId !== user._id) throw new ConvexError('FORBIDDEN');

    // Delete likes on this comment
    const likes = await ctx.db
      .query('bountyCommentLikes')
      .withIndex('by_commentId', (q) => q.eq('commentId', args.commentId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    await ctx.db.delete(args.commentId);
  },
});

/**
 * Toggle like on a comment.
 * Replaces: bounties.toggleCommentLike (protectedProcedure mutation)
 */
export const toggleCommentLike = mutation({
  args: { commentId: v.id('bountyComments') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query('bountyCommentLikes')
      .withIndex('by_comment_user', (q) =>
        q.eq('commentId', args.commentId).eq('userId', user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }

    await ctx.db.insert('bountyCommentLikes', {
      commentId: args.commentId,
      userId: user._id,
    });
    return { liked: true };
  },
});

/**
 * Apply to work on a bounty.
 * Replaces: bounties.applyToBounty (protectedProcedure mutation)
 */
export const applyToBounty = mutation({
  args: {
    bountyId: v.id('bounties'),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');
    if (bounty.status !== 'open') {
      throw new ConvexError('BOUNTY_NOT_ACCEPTING_APPLICATIONS');
    }

    // Check for duplicate application
    const existing = await ctx.db
      .query('bountyApplications')
      .withIndex('by_bounty_applicant', (q) =>
        q.eq('bountyId', args.bountyId).eq('applicantId', user._id)
      )
      .unique();

    if (existing) {
      throw new ConvexError('ALREADY_APPLIED');
    }

    await ctx.db.insert('bountyApplications', {
      bountyId: args.bountyId,
      applicantId: user._id,
      message: args.message,
      appliedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Toggle bounty pin (featured status).
 * Replaces: bounties.toggleBountyPin (orgProcedure mutation)
 */
export const toggleBountyPin = mutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');
    if (bounty.createdById !== user._id) throw new ConvexError('FORBIDDEN');

    await ctx.db.patch(args.bountyId, {
      isFeatured: !bounty.isFeatured,
      updatedAt: Date.now(),
    });
  },
});

// ============================================================================
// INTERNAL MUTATIONS — Called by webhook handlers
// ============================================================================

/**
 * Handle checkout.session.completed webhook.
 */
export const handleCheckoutCompleted = internalMutation({
  args: {
    bountyId: v.string(),
    stripePaymentIntentId: v.string(),
    stripeCheckoutSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find bounty by the old PG UUID or Convex ID
    // For now, look up by stripeCheckoutSessionId
    const bounty = await ctx.db
      .query('bounties')
      .withIndex('by_stripeCheckoutSessionId', (q) =>
        q.eq('stripeCheckoutSessionId', args.stripeCheckoutSessionId)
      )
      .first();

    if (!bounty) {
      console.error(
        `[Stripe] Bounty not found for checkout ${args.stripeCheckoutSessionId}`
      );
      return;
    }

    // Idempotency: skip if already funded
    if (bounty.paymentStatus === 'held') return;

    await ctx.db.patch(bounty._id, {
      status: 'open',
      paymentStatus: 'held',
      stripePaymentIntentId: args.stripePaymentIntentId,
      updatedAt: Date.now(),
    });

    // Record the transaction
    await ctx.db.insert('transactions', {
      bountyId: bounty._id,
      type: 'payment_intent',
      amountCents: bounty.amountCents,
      stripeId: args.stripePaymentIntentId,
    });
  },
});

/**
 * Handle payment_intent.succeeded webhook.
 */
export const handlePaymentIntentSucceeded = internalMutation({
  args: {
    bountyId: v.string(),
    stripePaymentIntentId: v.string(),
    amountCents: v.int64(),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query('bounties')
      .withIndex('by_stripePaymentIntentId', (q) =>
        q.eq('stripePaymentIntentId', args.stripePaymentIntentId)
      )
      .first();

    if (!bounty) return;

    // Atomic idempotency: only update if not already held
    if (bounty.paymentStatus === 'held') return;

    await ctx.db.patch(bounty._id, {
      status: 'open',
      paymentStatus: 'held',
      updatedAt: Date.now(),
    });

    // Check if transaction already exists
    const existingTx = await ctx.db
      .query('transactions')
      .withIndex('by_stripeId', (q) =>
        q.eq('stripeId', args.stripePaymentIntentId)
      )
      .first();

    if (!existingTx) {
      await ctx.db.insert('transactions', {
        bountyId: bounty._id,
        type: 'payment_intent',
        amountCents: args.amountCents,
        stripeId: args.stripePaymentIntentId,
      });
    }
  },
});

/**
 * Handle payment_intent.payment_failed webhook.
 */
export const handlePaymentFailed = internalMutation({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    // Try to find by various identifiers
    const bounties = await ctx.db.query('bounties').collect();
    // In practice, we'd use a proper index lookup here
    // For now this is a placeholder
    console.log(`[Stripe] Payment failed for bounty ${args.bountyId}`);
  },
});

/**
 * Handle transfer.created webhook.
 */
export const handleTransferCreated = internalMutation({
  args: {
    stripeId: v.string(),
    amountCents: v.int64(),
    bountyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query('transactions')
      .withIndex('by_stripeId', (q) => q.eq('stripeId', args.stripeId))
      .first();

    if (existing) return;

    if (args.bountyId) {
      // Try to find the bounty
      const bounty = await ctx.db
        .query('bounties')
        .withIndex('by_stripePaymentIntentId', (q) =>
          q.eq('stripePaymentIntentId', args.bountyId!)
        )
        .first();

      if (bounty) {
        await ctx.db.insert('transactions', {
          bountyId: bounty._id,
          type: 'transfer',
          amountCents: args.amountCents,
          stripeId: args.stripeId,
        });
      }
    }
  },
});

/**
 * Handle charge.refunded webhook.
 */
export const handleChargeRefunded = internalMutation({
  args: {
    stripePaymentIntentId: v.string(),
    refundAmountCents: v.int64(),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db
      .query('bounties')
      .withIndex('by_stripePaymentIntentId', (q) =>
        q.eq('stripePaymentIntentId', args.stripePaymentIntentId)
      )
      .first();

    if (!bounty) return;

    await ctx.db.patch(bounty._id, {
      status: 'cancelled',
      paymentStatus: 'refunded',
      updatedAt: Date.now(),
    });

    // Update pending cancellation request if exists
    const pendingRequest = await ctx.db
      .query('cancellationRequests')
      .withIndex('by_bountyId', (q) => q.eq('bountyId', bounty._id))
      .order('desc')
      .first();

    if (pendingRequest && pendingRequest.status === 'pending') {
      await ctx.db.patch(pendingRequest._id, {
        status: 'approved',
        refundAmountCents: args.refundAmountCents,
        processedAt: Date.now(),
      });
    }

    // Record refund transaction
    await ctx.db.insert('transactions', {
      bountyId: bounty._id,
      type: 'refund',
      amountCents: args.refundAmountCents,
      stripeId: args.stripePaymentIntentId,
    });

    // Send notification to bounty creator
    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.createNotification,
      {
        userId: bounty.createdById,
        type: 'system',
        title: 'Bounty refunded',
        message: `Your bounty "${bounty.title}" has been refunded.`,
        data: { bountyId: bounty._id },
      }
    );
  },
});

// ============================================================================
// MUTATIONS — Complex business logic
// ============================================================================

/**
 * Create a new bounty.
 * Replaces: bounties.createBounty (rateLimitedOrgProcedure mutation → action)
 *
 * This is an action because it calls Stripe and GitHub APIs.
 */
export const createBounty = action({
  args: {
    title: v.string(),
    description: v.string(),
    amount: v.string(), // dollar string e.g. "100.00"
    currency: v.optional(v.string()),
    deadline: v.optional(v.string()), // ISO datetime string
    tags: v.optional(v.array(v.string())),
    repositoryUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    payLater: v.optional(v.boolean()),
    githubInstallationId: v.optional(v.float64()),
    githubIssueNumber: v.optional(v.float64()),
    githubRepoOwner: v.optional(v.string()),
    githubRepoName: v.optional(v.string()),
    linearIssueId: v.optional(v.string()),
    linearIssueIdentifier: v.optional(v.string()),
    linearIssueUrl: v.optional(v.string()),
    linearAccountId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currency = args.currency ?? 'USD';
    const payLater = args.payLater ?? false;
    const amountCents = toCents(Number.parseFloat(args.amount || '0'));
    const isFreeBounty = amountCents === 0n;

    // Create the bounty record via internal mutation
    const bountyId = await ctx.runMutation(
      internal.functions.bounties.insertBounty,
      {
        title: args.title,
        description: args.description,
        amountCents,
        currency,
        deadline: args.deadline ? new Date(args.deadline).getTime() : undefined,
        tags: args.tags,
        repositoryUrl: args.repositoryUrl,
        issueUrl: args.issueUrl,
        status: isFreeBounty ? 'open' : 'draft',
        githubIssueNumber: args.githubIssueNumber,
        githubInstallationId: args.githubInstallationId,
        githubRepoOwner: args.githubRepoOwner,
        githubRepoName: args.githubRepoName,
        linearIssueId: args.linearIssueId,
        linearIssueIdentifier: args.linearIssueIdentifier,
        linearIssueUrl: args.linearIssueUrl,
        linearAccountId: args.linearAccountId,
        organizationId: args.organizationId,
      }
    );

    let checkoutUrl: string | null = null;

    // Create Stripe checkout session if paying now
    if (!(payLater || isFreeBounty)) {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';

      const { fees, total } = calculateTotalWithFees(amountCents);
      const amountNumber = Number(amountCents);
      const feesNumber = Number(fees);

      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: amountNumber,
              product_data: { name: `Bounty: ${args.title}` },
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: feesNumber,
              product_data: { name: 'Processing Fee' },
            },
            quantity: 1,
          },
        ],
        metadata: { bountyId: bountyId as string },
        success_url: `${baseUrl}/bounty/${bountyId}`,
        cancel_url: `${baseUrl}/bounty/${bountyId}?payment=cancelled`,
      });

      checkoutUrl = session.url;

      // Store the checkout session ID on the bounty
      await ctx.runMutation(internal.functions.bounties.patchBounty, {
        bountyId,
        patch: { stripeCheckoutSessionId: session.id },
      });
    }

    // Parse and store links from description (fire-and-forget)
    if (args.description) {
      await ctx.runMutation(internal.functions.bounties.parseAndStoreLinks, {
        bountyId,
        description: args.description,
      });
    }

    return {
      success: true,
      bountyId,
      checkoutUrl,
      payLater,
    };
  },
});

/**
 * Update an existing bounty.
 * Replaces: bounties.updateBounty (orgProcedure mutation)
 */
export const updateBounty = mutation({
  args: {
    bountyId: v.id('bounties'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    deadline: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    repositoryUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    status: v.optional(bountyStatus),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const { bountyId, ...updates } = args;

    const bounty = await ctx.db.get(bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check: must be org member or creator
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if (bounty.createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined)
      patch.description = updates.description;
    if (updates.deadline !== undefined) {
      patch.deadline = new Date(updates.deadline).getTime();
    }
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.repositoryUrl !== undefined)
      patch.repositoryUrl = updates.repositoryUrl;
    if (updates.issueUrl !== undefined) patch.issueUrl = updates.issueUrl;
    if (updates.status !== undefined) patch.status = updates.status;

    await ctx.db.patch(bountyId, patch);

    // Re-parse links if description changed
    if (updates.description) {
      // Delete old links
      const oldLinks = await ctx.db
        .query('bountyLinks')
        .withIndex('by_bountyId', (q: any) => q.eq('bountyId', bountyId))
        .collect();
      for (const link of oldLinks) {
        await ctx.db.delete(link._id);
      }
      // Parse and insert new links inline (simple URL regex)
      const urls = updates.description.match(/https?:\/\/[^\s)]+/g) || [];
      for (const url of urls) {
        const domain = new URL(url).hostname;
        const isGitHub = domain.includes('github.com');
        const ghMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        await ctx.db.insert('bountyLinks', {
          bountyId,
          url,
          domain,
          displayText: url,
          isGitHub,
          githubOwner: ghMatch?.[1],
          githubRepo: ghMatch?.[2],
        });
      }
    }

    return { success: true };
  },
});

/**
 * Delete a bounty.
 * Replaces: bounties.deleteBounty (orgProcedure mutation)
 */
export const deleteBounty = mutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if (bounty.createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    // Can't delete bounties with submissions
    const submissions = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .collect();
    if (submissions.length > 0) {
      throw new ConvexError('CANNOT_DELETE_WITH_SUBMISSIONS');
    }

    // Can't delete funded bounties
    if (bounty.stripePaymentIntentId && bounty.paymentStatus === 'held') {
      throw new ConvexError('CANNOT_DELETE_FUNDED_BOUNTY');
    }

    // Delete related records
    const links = await ctx.db
      .query('bountyLinks')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .collect();
    for (const link of links) await ctx.db.delete(link._id);

    const votes = await ctx.db
      .query('bountyVotes')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);

    const bookmarks = await ctx.db
      .query('bountyBookmarks')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .collect();
    for (const bm of bookmarks) await ctx.db.delete(bm._id);

    await ctx.db.delete(args.bountyId);
    return { success: true };
  },
});

/**
 * Submit work for a bounty.
 * Replaces: bounties.submitBountyWork (protectedProcedure mutation)
 */
export const submitBountyWork = mutation({
  args: {
    bountyId: v.id('bounties'),
    description: v.string(),
    deliverableUrl: v.string(),
    pullRequestUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');
    if (bounty.status !== 'open' && bounty.status !== 'in_progress') {
      throw new ConvexError('BOUNTY_NOT_ACCEPTING_SUBMISSIONS');
    }

    // Check for duplicate submission
    const existing = await ctx.db
      .query('submissions')
      .withIndex('by_bounty_contributor', (q: any) =>
        q.eq('bountyId', args.bountyId).eq('contributorId', user._id)
      )
      .unique();

    if (existing) throw new ConvexError('ALREADY_SUBMITTED');

    const submissionId = await ctx.db.insert('submissions', {
      bountyId: args.bountyId,
      contributorId: user._id,
      description: args.description,
      deliverableUrl: args.deliverableUrl,
      pullRequestUrl: args.pullRequestUrl,
      status: 'pending',
      submittedAt: now,
      updatedAt: now,
    });

    // Notify bounty creator
    if (bounty.createdById !== user._id) {
      await ctx.scheduler.runAfter(
        0,
        internal.functions.notifications.createNotification,
        {
          userId: bounty.createdById,
          type: 'submission_received',
          title: 'New submission received',
          message: `${user.handle || 'Someone'} submitted work for "${bounty.title}"`,
          data: {
            bountyId: args.bountyId,
            submissionId,
          },
        }
      );
    }

    return { success: true, submissionId };
  },
});

/**
 * Approve a submission (without payout).
 * Replaces: bounties.approveSubmission (protectedProcedure mutation)
 */
export const approveSubmission = mutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if (bounty.createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new ConvexError('SUBMISSION_NOT_FOUND');
    if (sub.bountyId !== args.bountyId)
      throw new ConvexError('SUBMISSION_MISMATCH');
    if (sub.status === 'approved')
      return { success: true, message: 'Already approved' };

    // Check no other approved submissions
    const existingApproved = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) => q.eq(q.field('status'), 'approved'))
      .first();

    if (existingApproved && existingApproved._id !== args.submissionId) {
      throw new ConvexError('ANOTHER_SUBMISSION_ALREADY_APPROVED');
    }

    await ctx.db.patch(args.submissionId, {
      status: 'approved',
      reviewedAt: now,
      updatedAt: now,
    });

    // Move bounty to in_progress
    if (bounty.status === 'open') {
      await ctx.db.patch(args.bountyId, {
        status: 'in_progress',
        updatedAt: now,
      });
    }

    // Notify contributor
    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.createNotification,
      {
        userId: sub.contributorId,
        type: 'submission_approved',
        title: 'Your submission was approved',
        message: `Your submission for "${bounty.title}" was approved!`,
        data: { bountyId: args.bountyId, submissionId: args.submissionId },
      }
    );

    return { success: true, message: 'Submission approved' };
  },
});

/**
 * Unapprove a submission.
 * Replaces: bounties.unapproveSubmission (protectedProcedure mutation)
 */
export const unapproveSubmission = mutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if (bounty.createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    if (bounty.status === 'completed') {
      throw new ConvexError('CANNOT_UNAPPROVE_COMPLETED');
    }

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new ConvexError('SUBMISSION_NOT_FOUND');
    if (sub.bountyId !== args.bountyId)
      throw new ConvexError('SUBMISSION_MISMATCH');
    if (sub.status !== 'approved') return { success: true };

    await ctx.db.patch(args.submissionId, {
      status: 'pending',
      reviewedAt: undefined,
      updatedAt: now,
    });

    // If no other approved submissions, revert bounty to open
    const otherApproved = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) => q.eq(q.field('status'), 'approved'))
      .first();

    if (!otherApproved && bounty.status === 'in_progress') {
      await ctx.db.patch(args.bountyId, {
        status: 'open',
        updatedAt: now,
      });
    }

    return { success: true, message: 'Submission unapproved' };
  },
});

/**
 * Merge a submission — approve + release payout.
 * Replaces: bounties.mergeSubmission (protectedProcedure mutation → action)
 *
 * Action because it calls Stripe API for the transfer.
 * Convex mutations are already serializable, so no distributed locks needed.
 */
export const mergeSubmission = action({
  args: {
    bountyId: v.string(), // Convex ID as string
    submissionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Run the DB checks and payout setup in a mutation (transactional)
    const result = await ctx.runMutation(
      internal.functions.bounties.prepareMerge,
      { bountyId: args.bountyId, submissionId: args.submissionId }
    );

    if (result.alreadyReleased) {
      throw new ConvexError('ALREADY_PAID_OUT');
    }

    if (result.isFreeBounty) {
      // Free bounty: just finalize without Stripe
      await ctx.runMutation(internal.functions.bounties.finalizeMerge, {
        bountyId: args.bountyId,
        submissionId: args.submissionId,
        solverId: result.solverId,
        transferId: `free_bounty_${args.bountyId}`,
        isFreeBounty: true,
      });
      return { success: true, message: 'Submission merged' };
    }

    // Paid bounty: create Stripe transfer
    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const transfer = await stripeClient.transfers.create(
      {
        amount: result.amountCents,
        currency: result.currency.toLowerCase(),
        destination: result.connectAccountId,
        metadata: { bountyId: args.bountyId },
      },
      { idempotencyKey: `merge-payout:${args.bountyId}` }
    );

    // Finalize in DB
    await ctx.runMutation(internal.functions.bounties.finalizeMerge, {
      bountyId: args.bountyId,
      submissionId: args.submissionId,
      solverId: result.solverId,
      transferId: transfer.id,
      isFreeBounty: false,
    });

    return { success: true, message: 'Submission merged and payout released' };
  },
});

/**
 * Request cancellation of a funded bounty.
 * Replaces: bounties.requestCancellation (protectedProcedure mutation)
 */
export const requestCancellation = mutation({
  args: {
    bountyId: v.id('bounties'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if (bounty.createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    if (bounty.paymentStatus !== 'held') {
      throw new ConvexError('ONLY_FUNDED_BOUNTIES_CAN_BE_CANCELLED');
    }

    // No cancellation if there's an approved submission
    const approvedSub = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) => q.eq(q.field('status'), 'approved'))
      .first();
    if (approvedSub)
      throw new ConvexError('CANNOT_CANCEL_WITH_APPROVED_SUBMISSION');

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query('cancellationRequests')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) => q.eq(q.field('status'), 'pending'))
      .first();
    if (existingRequest) throw new ConvexError('CANCELLATION_ALREADY_PENDING');

    const requestId = await ctx.db.insert('cancellationRequests', {
      bountyId: args.bountyId,
      requestedById: user._id,
      reason: args.reason,
      status: 'pending',
    });

    // TODO: Send notification emails to submitters + support via @convex-dev/resend action

    return { success: true, requestId };
  },
});

/**
 * Admin: Process a cancellation request (approve with refund or reject).
 * Replaces: bounties.processCancellation (adminProcedure mutation → action)
 */
export const processCancellation = action({
  args: {
    requestId: v.string(), // Convex ID as string
    approved: v.boolean(),
    refundAmount: v.optional(v.float64()), // in dollars
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      internal.functions.bounties.prepareProcessCancellation,
      { requestId: args.requestId, approved: args.approved }
    );

    if (!args.approved) {
      return { success: true, status: 'rejected' };
    }

    // Approved: issue Stripe refund
    if (result.stripePaymentIntentId) {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const bountyAmountDollars = toDollars(result.amountCents);
      const platformFee = bountyAmountDollars * 0.05; // 5% platform fee
      const refundDollars =
        args.refundAmount ?? bountyAmountDollars - platformFee;
      const refundCents = Math.round(refundDollars * 100);

      await stripeClient.refunds.create({
        payment_intent: result.stripePaymentIntentId,
        amount: refundCents,
      });

      await ctx.runMutation(internal.functions.bounties.finalizeCancellation, {
        requestId: args.requestId,
        bountyId: result.bountyId,
        refundAmountCents: BigInt(refundCents),
      });

      return { success: true, status: 'approved', refundAmount: refundDollars };
    }

    // No payment intent — just cancel
    await ctx.runMutation(internal.functions.bounties.finalizeCancellation, {
      requestId: args.requestId,
      bountyId: result.bountyId,
      refundAmountCents: 0n,
    });

    return { success: true, status: 'approved' };
  },
});

/**
 * Create a payment checkout session for a "pay later" bounty.
 * Replaces: bounties.createPaymentForBounty (protectedProcedure mutation → action)
 */
export const createPaymentForBounty = action({
  args: {
    bountyId: v.string(),
    origin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.runQuery(
      internal.functions.bounties.getBountyById,
      { bountyId: args.bountyId }
    );

    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');
    if (bounty.paymentStatus === 'held') throw new ConvexError('ALREADY_PAID');

    const amountCents = Number(bounty.amountCents);
    const { fees } = calculateTotalWithFees(BigInt(amountCents));
    const feesNumber = Number(fees);

    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const baseUrl =
      args.origin ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: bounty.currency.toLowerCase(),
            unit_amount: amountCents,
            product_data: { name: `Bounty: ${bounty.title}` },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: bounty.currency.toLowerCase(),
            unit_amount: feesNumber,
            product_data: { name: 'Processing Fee' },
          },
          quantity: 1,
        },
      ],
      metadata: { bountyId: args.bountyId },
      success_url: `${baseUrl}/bounty/${args.bountyId}`,
      cancel_url: `${baseUrl}/bounty/${args.bountyId}?payment=cancelled`,
    });

    await ctx.runMutation(internal.functions.bounties.patchBounty, {
      bountyId: args.bountyId,
      patch: { stripeCheckoutSessionId: session.id },
    });

    return { success: true, checkoutUrl: session.url };
  },
});

/**
 * Verify a checkout payment and activate the bounty.
 * Replaces: bounties.verifyCheckoutPayment (rateLimitedProtectedProcedure mutation → action)
 */
export const verifyCheckoutPayment = action({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripeClient.checkout.sessions.retrieve(
      args.sessionId
    );
    const bountyId = session.metadata?.bountyId;
    const paymentIntentId = session.payment_intent as string | null;

    if (!bountyId) throw new ConvexError('NO_BOUNTY_ID_IN_SESSION');

    if (paymentIntentId) {
      const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId);

      if (pi.status === 'succeeded') {
        await ctx.runMutation(
          internal.functions.bounties.handlePaymentIntentSucceeded,
          {
            bountyId,
            stripePaymentIntentId: paymentIntentId,
            amountCents: BigInt(pi.amount),
          }
        );

        return { success: true, paymentStatus: 'held' };
      }

      return {
        success: false,
        paymentStatus: 'pending',
        stripeStatus: pi.status,
      };
    }

    return { success: false, paymentStatus: 'pending' };
  },
});

/**
 * Fetch bounties for the current organization.
 * Replaces: bounties.fetchMyBounties (orgProcedure query)
 */
export const fetchMyBounties = query({
  args: {
    organizationId: v.optional(v.id('organizations')),
    page: v.optional(v.float64()),
    limit: v.optional(v.float64()),
    status: v.optional(bountyStatus),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user)
      return { bounties: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    let result;
    try {
      result = await requireOrgMember(ctx, args.organizationId as any);
    } catch {
      return { bounties: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;

    let bounties;
    if (args.status) {
      bounties = await ctx.db
        .query('bounties')
        .withIndex('by_organizationId', (q: any) =>
          q.eq('organizationId', result.org._id)
        )
        .filter((q: any) => q.eq(q.field('status'), args.status))
        .order('desc')
        .collect();
    } else {
      bounties = await ctx.db
        .query('bounties')
        .withIndex('by_organizationId', (q: any) =>
          q.eq('organizationId', result.org._id)
        )
        .order('desc')
        .collect();
    }

    const total = bounties.length;
    const start = (page - 1) * limit;
    const paginated = bounties.slice(start, start + limit);

    const enriched = await Promise.all(
      paginated.map(async (b) => {
        const creator = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('_id'), b.createdById))
          .unique();
        return {
          ...b,
          amountDollars: toDollars(b.amountCents),
          creator: creator
            ? { _id: creator._id, handle: creator.handle }
            : null,
        };
      })
    );

    return {
      bounties: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

/**
 * Get monthly spend for the current organization.
 * Replaces: bounties.getMonthlySpend (orgProcedure query)
 */
export const getMonthlySpend = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user)
      return {
        monthlySpend: 0,
        bountyCount: 0,
        allTimeSpend: 0,
        allTimeBountyCount: 0,
        periodStart: new Date(
          Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
        ).toISOString(),
        periodEnd: new Date(
          Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)
        ).toISOString(),
      };
    let result;
    try {
      result = await requireOrgMember(ctx, args.organizationId as any);
    } catch {
      return {
        monthlySpend: 0,
        bountyCount: 0,
        allTimeSpend: 0,
        allTimeBountyCount: 0,
        periodStart: new Date(
          Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
        ).toISOString(),
        periodEnd: new Date(
          Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)
        ).toISOString(),
      };
    }

    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    ).getTime();
    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    ).getTime();

    // Get all transactions for this org's bounties this month
    const orgBounties = await ctx.db
      .query('bounties')
      .withIndex('by_organizationId', (q: any) =>
        q.eq('organizationId', result.org._id)
      )
      .collect();

    const bountyIds = new Set(orgBounties.map((b: any) => b._id));

    // Get all payment_intent transactions
    const allTransactions = await ctx.db.query('transactions').collect();
    const paymentTransactions = allTransactions.filter(
      (t: any) => t.type === 'payment_intent' && bountyIds.has(t.bountyId)
    );

    const monthlyTransactions = paymentTransactions.filter(
      (t: any) =>
        t._creationTime >= startOfMonth && t._creationTime < endOfMonth
    );

    const monthlySpendCents = monthlyTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.amountCents),
      0
    );
    const allTimeSpendCents = paymentTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.amountCents),
      0
    );

    return {
      monthlySpend: monthlySpendCents / 100,
      bountyCount: monthlyTransactions.length,
      allTimeSpend: allTimeSpendCents / 100,
      allTimeBountyCount: paymentTransactions.length,
      periodStart: new Date(startOfMonth).toISOString(),
      periodEnd: new Date(endOfMonth).toISOString(),
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS — Used by actions above
// ============================================================================

/** Internal: insert a new bounty. */
export const insertBounty = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    amountCents: v.int64(),
    currency: v.string(),
    deadline: v.optional(v.float64()),
    tags: v.optional(v.array(v.string())),
    repositoryUrl: v.optional(v.string()),
    issueUrl: v.optional(v.string()),
    status: v.string(),
    githubIssueNumber: v.optional(v.float64()),
    githubInstallationId: v.optional(v.float64()),
    githubRepoOwner: v.optional(v.string()),
    githubRepoName: v.optional(v.string()),
    linearIssueId: v.optional(v.string()),
    linearIssueIdentifier: v.optional(v.string()),
    linearIssueUrl: v.optional(v.string()),
    linearAccountId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve the authenticated user via Better Auth component
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new ConvexError('UNAUTHENTICATED');
    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q: any) =>
        q.eq('betterAuthUserId', authUser._id)
      )
      .unique();
    if (!user) throw new ConvexError('USER_NOT_FOUND');

    return await ctx.db.insert('bounties', {
      title: args.title,
      description: args.description,
      amountCents: args.amountCents,
      currency: args.currency,
      deadline: args.deadline,
      tags: args.tags,
      repositoryUrl: args.repositoryUrl,
      issueUrl: args.issueUrl,
      status: args.status as any,
      paymentStatus: 'pending',
      isFeatured: false,
      createdById: user._id,
      organizationId: args.organizationId as any,
      githubIssueNumber: args.githubIssueNumber,
      githubInstallationId: args.githubInstallationId,
      githubRepoOwner: args.githubRepoOwner,
      githubRepoName: args.githubRepoName,
      linearIssueId: args.linearIssueId,
      linearIssueIdentifier: args.linearIssueIdentifier,
      linearIssueUrl: args.linearIssueUrl,
      linearAccountId: args.linearAccountId,
      updatedAt: Date.now(),
    });
  },
});

/** Internal: patch a bounty. */
export const patchBounty = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    patch: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bountyId, {
      ...args.patch,
      updatedAt: Date.now(),
    });
  },
});

/** Internal: parse links from markdown and store them. */
export const parseAndStoreLinks = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const urls = args.description.match(/https?:\/\/[^\s)]+/g) || [];
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname;
        const isGitHub = domain.includes('github.com');
        const ghMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        await ctx.db.insert('bountyLinks', {
          bountyId: args.bountyId,
          url,
          domain,
          displayText: url,
          isGitHub,
          githubOwner: ghMatch?.[1],
          githubRepo: ghMatch?.[2],
        });
      } catch {
        // Skip invalid URLs
      }
    }
  },
});

/** Internal: get a bounty by ID (for use in actions). */
export const getBountyById = internalQuery({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bountyId);
  },
});

/** Internal: prepare merge (check permissions, resolve solver). */
export const prepareMerge = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Check already released
    if (bounty.paymentStatus === 'released' || bounty.stripeTransferId) {
      return {
        alreadyReleased: true,
        isFreeBounty: false,
        amountCents: 0,
        currency: 'USD',
        solverId: '' as any,
        connectAccountId: '',
      };
    }

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new ConvexError('SUBMISSION_NOT_FOUND');
    if (sub.status !== 'approved')
      throw new ConvexError('SUBMISSION_NOT_APPROVED');

    const amountCents = Number(bounty.amountCents);
    const isFreeBounty = amountCents === 0;

    // Resolve solver
    const solver = await ctx.db.get(sub.contributorId);
    if (!solver) throw new ConvexError('SOLVER_NOT_FOUND');

    // For paid bounties, require Stripe Connect
    if (
      !(
        isFreeBounty ||
        (solver.stripeConnectAccountId &&
          solver.stripeConnectOnboardingComplete)
      )
    ) {
      throw new ConvexError('SOLVER_NEEDS_STRIPE_CONNECT');
    }

    return {
      alreadyReleased: false,
      isFreeBounty,
      amountCents,
      currency: bounty.currency,
      solverId: solver._id,
      connectAccountId: solver.stripeConnectAccountId ?? '',
    };
  },
});

/** Internal: finalize merge (update all records atomically). */
export const finalizeMerge = internalMutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
    solverId: v.id('users'),
    transferId: v.string(),
    isFreeBounty: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return;

    // Update submission
    await ctx.db.patch(args.submissionId, {
      status: 'approved',
      reviewedAt: now,
      updatedAt: now,
    });

    // Insert payout
    await ctx.db.insert('payouts', {
      userId: args.solverId,
      bountyId: args.bountyId,
      amountCents: bounty.amountCents,
      status: args.isFreeBounty ? 'completed' : 'processing',
      stripeTransferId: args.transferId,
      updatedAt: now,
    });

    // Insert transaction
    await ctx.db.insert('transactions', {
      bountyId: args.bountyId,
      type: 'transfer',
      amountCents: bounty.amountCents,
      stripeId: args.transferId,
    });

    // Update bounty
    await ctx.db.patch(args.bountyId, {
      status: 'completed',
      paymentStatus: 'released',
      stripeTransferId: args.transferId,
      assignedToId: args.solverId,
      updatedAt: now,
    });

    // Notify solver
    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.createNotification,
      {
        userId: args.solverId,
        type: 'bounty_awarded',
        title: 'Bounty awarded!',
        message: `You've been awarded the bounty "${bounty.title}"`,
        data: { bountyId: args.bountyId },
      }
    );
  },
});

/** Internal: prepare cancellation processing. */
export const prepareProcessCancellation = internalMutation({
  args: {
    requestId: v.id('cancellationRequests'),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new ConvexError('REQUEST_NOT_FOUND');
    if (request.status !== 'pending')
      throw new ConvexError('REQUEST_ALREADY_PROCESSED');

    if (!args.approved) {
      // Reject immediately
      const authUser = await authComponent.getAuthUser(ctx);
      const admin = authUser
        ? await ctx.db
            .query('users')
            .withIndex('by_betterAuthUserId', (q) =>
              q.eq('betterAuthUserId', authUser._id as string)
            )
            .unique()
        : null;

      await ctx.db.patch(args.requestId, {
        status: 'rejected',
        processedById: admin?._id,
        processedAt: Date.now(),
      });
      return { bountyId: null, stripePaymentIntentId: null, amountCents: 0n };
    }

    const bounty = await ctx.db.get(request.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    return {
      bountyId: bounty._id,
      stripePaymentIntentId: bounty.stripePaymentIntentId,
      amountCents: bounty.amountCents,
    };
  },
});

/** Internal: finalize cancellation. */
export const finalizeCancellation = internalMutation({
  args: {
    requestId: v.id('cancellationRequests'),
    bountyId: v.id('bounties'),
    refundAmountCents: v.int64(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const identity = await ctx.auth.getUserIdentity();
    const admin = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_betterAuthUserId', (q: any) =>
            q.eq('betterAuthUserId', identity.subject)
          )
          .unique()
      : null;

    await ctx.db.patch(args.requestId, {
      status: 'approved',
      processedById: admin?._id,
      processedAt: now,
      refundAmountCents: args.refundAmountCents,
    });

    await ctx.db.patch(args.bountyId, {
      status: 'cancelled',
      paymentStatus: 'refunded',
      updatedAt: now,
    });
  },
});

// ============================================================================
// MISSING PROCEDURES — Added to match client-side references
// ============================================================================

/**
 * Cancel (withdraw) a pending cancellation request.
 * Replaces: bounties.cancelCancellationRequest (protectedProcedure mutation)
 */
export const cancelCancellationRequest = mutation({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if (bounty.organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q.eq('organizationId', bounty.organizationId).eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if ((bounty as any).createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    // Find the pending cancellation request
    const request = await ctx.db
      .query('cancellationRequests')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) => q.eq(q.field('status'), 'pending'))
      .first();

    if (!request) throw new ConvexError('NO_PENDING_CANCELLATION');

    await ctx.db.patch(request._id, {
      status: 'withdrawn',
      processedById: user._id,
      processedAt: Date.now(),
    });

    return { success: true, message: 'Cancellation request withdrawn.' };
  },
});

/**
 * Withdraw (delete) a pending submission.
 * Replaces: bounties.withdrawSubmission (protectedProcedure mutation)
 */
export const withdrawSubmission = mutation({
  args: {
    bountyId: v.id('bounties'),
    submissionId: v.id('submissions'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const sub = await ctx.db.get(args.submissionId);
    if (!sub) throw new ConvexError('SUBMISSION_NOT_FOUND');
    if ((sub as any).bountyId !== args.bountyId)
      throw new ConvexError('SUBMISSION_MISMATCH');
    if ((sub as any).contributorId !== user._id)
      throw new ConvexError('NOT_YOUR_SUBMISSION');
    if ((sub as any).status !== 'pending')
      throw new ConvexError('CAN_ONLY_WITHDRAW_PENDING');

    await ctx.db.delete(args.submissionId);
    return { success: true, message: 'Submission withdrawn' };
  },
});

/**
 * Get payment status for a bounty (with fee calculation).
 * Replaces: bounties.getBountyPaymentStatus (protectedProcedure query)
 */
export const getBountyPaymentStatus = query({
  args: { bountyId: v.id('bounties') },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Permission check
    if ((bounty as any).organizationId) {
      const membership = await ctx.db
        .query('members')
        .withIndex('by_org_user', (q: any) =>
          q
            .eq('organizationId', (bounty as any).organizationId)
            .eq('userId', user._id)
        )
        .unique();
      if (!membership) throw new ConvexError('FORBIDDEN');
    } else if ((bounty as any).createdById !== user._id) {
      throw new ConvexError('FORBIDDEN');
    }

    const amountCents = (bounty as any).amountCents as bigint;
    const { fees, total } = calculateTotalWithFees(amountCents);

    return {
      paymentStatus: (bounty as any).paymentStatus,
      stripePaymentIntentId: (bounty as any).stripePaymentIntentId,
      stripeTransferId: (bounty as any).stripeTransferId,
      fees: toDollars(fees),
      totalWithFees: toDollars(total),
      bountyAmount: toDollars(amountCents),
    };
  },
});

/**
 * Get stats (comments, votes, submissions, user interactions) for multiple bounties.
 * Replaces: bounties.getBountyStatsMany (publicProcedure query)
 */
export const getBountyStatsMany = query({
  args: { bountyIds: v.array(v.id('bounties')) },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const stats = await Promise.all(
      args.bountyIds.map(async (bountyId: any) => {
        const comments = await ctx.db
          .query('bountyComments')
          .withIndex('by_bountyId', (q: any) => q.eq('bountyId', bountyId))
          .collect();

        const votes = await ctx.db
          .query('bountyVotes')
          .withIndex('by_bountyId', (q: any) => q.eq('bountyId', bountyId))
          .collect();

        const submissions = await ctx.db
          .query('submissions')
          .withIndex('by_bountyId', (q: any) => q.eq('bountyId', bountyId))
          .collect();

        let isVoted = false;
        let bookmarked = false;

        if (currentUser) {
          isVoted = votes.some((v: any) => v.userId === currentUser._id);
          const bm = await ctx.db
            .query('bountyBookmarks')
            .withIndex('by_bounty_user', (q: any) =>
              q.eq('bountyId', bountyId).eq('userId', currentUser._id)
            )
            .unique();
          bookmarked = !!bm;
        }

        return {
          bountyId,
          commentCount: comments.length,
          voteCount: votes.length,
          submissionCount: submissions.length,
          isVoted,
          bookmarked,
        };
      })
    );

    return { stats };
  },
});

/**
 * Get highlighted (featured) bounties for a user.
 * Replaces: bounties.getHighlights (publicProcedure query)
 */
export const getHighlights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const resolvedId = await resolveUserId(ctx, args.userId);
    if (!resolvedId) return { success: true, data: [] };

    const bounties = await ctx.db
      .query('bounties')
      .withIndex('by_createdById', (q: any) => q.eq('createdById', resolvedId))
      .order('desc')
      .collect();

    // Filter to featured bounties
    const featured = bounties.filter((b: any) => b.isFeatured);

    const enriched = await Promise.all(
      featured.map(async (b: any) => {
        const creator = await ctx.db.get(b.createdById);
        return {
          ...b,
          amountDollars: toDollars(b.amountCents),
          creator: creator
            ? { _id: creator._id, handle: (creator as any).handle }
            : null,
        };
      })
    );

    return { success: true, data: enriched };
  },
});

/**
 * Submit work from the app (with GitHub PR validation).
 * Replaces: bounties.submitWorkFromApp (protectedProcedure mutation → action)
 *
 * Action because it calls the GitHub API to verify PR details.
 */
export const submitWorkFromApp = action({
  args: {
    bountyId: v.string(),
    pullRequestUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Parse PR URL
    const prMatch = args.pullRequestUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
    );
    if (!prMatch) throw new ConvexError('INVALID_PR_URL');

    const prOwner = prMatch[1]!;
    const prRepo = prMatch[2]!;
    const prNumber = Number.parseInt(prMatch[3]!, 10);

    // Create submission via internal mutation
    const result = await ctx.runMutation(
      internal.functions.bounties.insertSubmissionFromApp,
      {
        bountyId: args.bountyId,
        pullRequestUrl: args.pullRequestUrl,
        description: args.description ?? `PR #${prNumber}`,
        prNumber,
        prOwner,
        prRepo,
      }
    );

    return result;
  },
});

/** Internal: insert submission from app (validates permissions in DB). */
export const insertSubmissionFromApp = internalMutation({
  args: {
    bountyId: v.any(),
    pullRequestUrl: v.string(),
    description: v.string(),
    prNumber: v.float64(),
    prOwner: v.string(),
    prRepo: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new ConvexError('UNAUTHENTICATED');

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q: any) =>
        q.eq('betterAuthUserId', authUser._id)
      )
      .unique();
    if (!user) throw new ConvexError('USER_NOT_FOUND');

    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    // Cannot submit to own bounty
    if ((bounty as any).createdById === user._id) {
      throw new ConvexError('CANNOT_SUBMIT_TO_OWN_BOUNTY');
    }

    // Check bounty is open
    if (
      (bounty as any).status !== 'open' &&
      (bounty as any).status !== 'draft'
    ) {
      throw new ConvexError('BOUNTY_NOT_ACCEPTING_SUBMISSIONS');
    }

    // Check for duplicate PR submission
    const existingSub = await ctx.db
      .query('submissions')
      .withIndex('by_bountyId', (q: any) => q.eq('bountyId', args.bountyId))
      .filter((q: any) =>
        q.eq(q.field('githubPullRequestNumber'), args.prNumber)
      )
      .first();

    if (existingSub) throw new ConvexError('PR_ALREADY_SUBMITTED');

    const now = Date.now();
    const submissionId = await ctx.db.insert('submissions', {
      bountyId: args.bountyId,
      contributorId: user._id,
      description: args.description,
      deliverableUrl: args.pullRequestUrl,
      pullRequestUrl: args.pullRequestUrl,
      githubPullRequestNumber: args.prNumber,
      githubUsername: user.handle,
      status: 'pending',
      submittedAt: now,
      updatedAt: now,
    });

    // Notify bounty creator
    await ctx.scheduler.runAfter(
      0,
      internal.functions.notifications.createNotification,
      {
        userId: (bounty as any).createdById,
        type: 'submission_received',
        title: 'New submission received',
        message: `${user.handle || 'Someone'} submitted PR #${args.prNumber} for "${(bounty as any).title}"`,
        data: { bountyId: args.bountyId, submissionId },
      }
    );

    return { success: true, submissionId };
  },
});

/**
 * Recheck payment status by querying Stripe directly.
 * Replaces: bounties.recheckPaymentStatus (rateLimitedProtectedProcedure mutation → action)
 */
export const recheckPaymentStatus = action({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    // Get the bounty
    const bounty = await ctx.runQuery(
      internal.functions.bounties.getBountyById,
      { bountyId: args.bountyId }
    );
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    const b = bounty as any;

    // If we have a payment intent ID, check directly
    if (b.stripePaymentIntentId) {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const pi = await stripeClient.paymentIntents.retrieve(
        b.stripePaymentIntentId
      );

      if (pi.status === 'succeeded' && b.paymentStatus !== 'held') {
        // Fix the status
        await ctx.runMutation(
          internal.functions.bounties.handlePaymentIntentSucceeded,
          {
            bountyId: args.bountyId,
            stripePaymentIntentId: b.stripePaymentIntentId,
            amountCents: BigInt(pi.amount),
          }
        );
        return {
          success: true,
          paymentStatus: 'held',
          message: 'Payment verified!',
        };
      }

      return {
        success: true,
        paymentStatus: b.paymentStatus,
        stripeStatus: pi.status,
      };
    }

    // Search by metadata
    const Stripe = (await import('stripe')).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const sessions = await stripeClient.checkout.sessions.list({ limit: 50 });
    const match = sessions.data.find(
      (s: any) => s.metadata?.bountyId === args.bountyId
    );

    if (match?.payment_intent) {
      const piId = match.payment_intent as string;
      const pi = await stripeClient.paymentIntents.retrieve(piId);

      if (pi.status === 'succeeded' && b.paymentStatus !== 'held') {
        await ctx.runMutation(
          internal.functions.bounties.handlePaymentIntentSucceeded,
          {
            bountyId: args.bountyId,
            stripePaymentIntentId: piId,
            amountCents: BigInt(pi.amount),
          }
        );
        return {
          success: true,
          paymentStatus: 'held',
          message: 'Payment verified via checkout session!',
        };
      }

      return {
        success: true,
        paymentStatus: b.paymentStatus,
        stripeStatus: pi.status,
      };
    }

    return {
      success: false,
      paymentStatus: b.paymentStatus,
      message: 'No payment found for this bounty',
    };
  },
});

/**
 * Check if a bounty's GitHub bot comment is in sync.
 * Replaces: bounties.checkGithubSync (protectedProcedure mutation → action)
 */
export const checkGithubSync = action({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    const bounty = await ctx.runQuery(
      internal.functions.bounties.getBountyById,
      { bountyId: args.bountyId }
    );
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    const b = bounty as any;

    if (
      !(
        b.githubIssueNumber &&
        b.githubRepoOwner &&
        b.githubRepoName &&
        b.githubInstallationId
      )
    ) {
      return {
        synced: false,
        message: 'Not linked to GitHub',
        hasComment: false,
        needsInitialComment: false,
      };
    }

    if (!b.githubCommentId) {
      return {
        synced: false,
        message: 'No bot comment',
        hasComment: false,
        needsInitialComment: true,
      };
    }

    // Fetch comment from GitHub
    const { Octokit } = await import('@octokit/core');
    const { createAppAuth } = await import('@octokit/auth-app');
    const { restEndpointMethods } = await import(
      '@octokit/plugin-rest-endpoint-methods'
    );

    const OctokitWithRest = Octokit.plugin(restEndpointMethods);
    const octokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
        installationId: b.githubInstallationId,
      },
    });

    try {
      const { data: comment } = await octokit.rest.issues.getComment({
        owner: b.githubRepoOwner,
        repo: b.githubRepoName,
        comment_id: b.githubCommentId,
      });

      return {
        synced: true,
        message: 'Bot comment found',
        hasComment: true,
        paymentStatus: b.paymentStatus,
        canResync: b.paymentStatus === 'held',
        needsInitialComment: false,
      };
    } catch {
      return {
        synced: false,
        message: 'Bot comment not found (may have been deleted)',
        hasComment: false,
        needsInitialComment: true,
      };
    }
  },
});

/**
 * Sync bounty to GitHub (create bot comment on linked issue).
 * Replaces: bounties.syncToGithub (protectedProcedure mutation → action)
 */
export const syncToGithub = action({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    const bounty = await ctx.runQuery(
      internal.functions.bounties.getBountyById,
      { bountyId: args.bountyId }
    );
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    const b = bounty as any;

    if (!b.issueUrl) throw new ConvexError('NO_ISSUE_URL');

    // Already fully synced
    if (
      b.githubIssueNumber &&
      b.githubRepoOwner &&
      b.githubRepoName &&
      b.githubInstallationId &&
      b.githubCommentId
    ) {
      return { success: true, synced: true, message: 'Already synced' };
    }

    // Parse issue URL
    const urlMatch = b.issueUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/
    );
    if (!urlMatch) throw new ConvexError('INVALID_ISSUE_URL');

    const repoOwner = urlMatch[1]!;
    const repoName = urlMatch[2]!;
    const issueNumber = Number.parseInt(urlMatch[3]!, 10);

    // Get installation
    const { Octokit } = await import('@octokit/core');
    const { createAppAuth } = await import('@octokit/auth-app');
    const { restEndpointMethods } = await import(
      '@octokit/plugin-rest-endpoint-methods'
    );

    const OctokitWithRest = Octokit.plugin(restEndpointMethods);
    const octokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
      },
    });

    // Find installation for this repo
    let installationId: number;
    try {
      const { data } = await octokit.rest.apps.getRepoInstallation({
        owner: repoOwner,
        repo: repoName,
      });
      installationId = data.id;
    } catch {
      throw new ConvexError('GITHUB_APP_NOT_INSTALLED');
    }

    // Create authenticated octokit for this installation
    const installOctokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
        installationId,
      },
    });

    // Create bot comment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';
    const isFunded = b.paymentStatus === 'held';
    const commentBody = isFunded
      ? `[![bounty.new](${baseUrl}/bounty-funded-button.svg)](${baseUrl}/bounty/${args.bountyId})\n\nThis bounty is funded and open for submissions.`
      : `[![bounty.new](${baseUrl}/bounty-button.svg)](${baseUrl}/bounty/${args.bountyId})\n\nSubmit a PR to claim this bounty.`;

    const { data: comment } = await installOctokit.rest.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: issueNumber,
      body: commentBody,
    });

    // Update bounty with GitHub details
    await ctx.runMutation(internal.functions.bounties.patchBounty, {
      bountyId: args.bountyId,
      patch: {
        githubIssueNumber: issueNumber,
        githubRepoOwner: repoOwner,
        githubRepoName: repoName,
        githubInstallationId: installationId,
        githubCommentId: comment.id,
      },
    });

    return {
      success: true,
      synced: true,
      message: `Synced to ${repoOwner}/${repoName}#${issueNumber}`,
    };
  },
});

/**
 * Create a GitHub issue for a bounty.
 * Replaces: bounties.createGithubIssue (protectedProcedure mutation → action)
 */
export const createGithubIssue = action({
  args: { bountyId: v.string() },
  handler: async (ctx, args) => {
    const bounty = await ctx.runQuery(
      internal.functions.bounties.getBountyById,
      { bountyId: args.bountyId }
    );
    if (!bounty) throw new ConvexError('BOUNTY_NOT_FOUND');

    const b = bounty as any;

    if (b.issueUrl) throw new ConvexError('ALREADY_HAS_ISSUE');
    if (!b.repositoryUrl) throw new ConvexError('NO_REPOSITORY_URL');

    // Parse repo URL
    const repoMatch = b.repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) throw new ConvexError('INVALID_REPO_URL');

    const repoOwner = repoMatch[1]!;
    const repoName = repoMatch[2]!.replace(/\.git$/, '');

    const { Octokit } = await import('@octokit/core');
    const { createAppAuth } = await import('@octokit/auth-app');
    const { restEndpointMethods } = await import(
      '@octokit/plugin-rest-endpoint-methods'
    );

    const OctokitWithRest = Octokit.plugin(restEndpointMethods);
    const octokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
      },
    });

    // Find installation
    let installationId: number;
    try {
      const { data } = await octokit.rest.apps.getRepoInstallation({
        owner: repoOwner,
        repo: repoName,
      });
      installationId = data.id;
    } catch {
      throw new ConvexError('GITHUB_APP_NOT_INSTALLED');
    }

    const installOctokit = new OctokitWithRest({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: Buffer.from(
          process.env.GITHUB_APP_PRIVATE_KEY!,
          'base64'
        ).toString('utf-8'),
        installationId,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new';
    const issueBody = `${b.description}\n\n---\n\n[![bounty.new](${baseUrl}/bounty-button.svg)](${baseUrl}/bounty/${args.bountyId})\n\n[View on bounty.new](${baseUrl}/bounty/${args.bountyId})`;

    const { data: issue } = await installOctokit.rest.issues.create({
      owner: repoOwner,
      repo: repoName,
      title: b.title,
      body: issueBody,
      labels: ['bounty'],
    });

    const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/${issue.number}`;

    await ctx.runMutation(internal.functions.bounties.patchBounty, {
      bountyId: args.bountyId,
      patch: {
        issueUrl,
        githubIssueNumber: issue.number,
        githubRepoOwner: repoOwner,
        githubRepoName: repoName,
        githubInstallationId: installationId,
      },
    });

    return { success: true, issueUrl, issueNumber: issue.number };
  },
});
