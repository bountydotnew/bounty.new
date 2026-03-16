/**
 * Notification functions.
 *
 * Replaces: packages/api/src/routers/notifications.ts (11 procedures)
 *
 * NOTE: With Convex's reactive queries, the SSE-based realtime notification
 * refresh system (Upstash Realtime) is completely eliminated. When a
 * notification is inserted or updated, any component querying notifications
 * will automatically re-render.
 */
import { query, mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { requireAuth, requireAdmin, getAuthenticatedUser } from '../lib/auth';
import { notificationType } from '../schema';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get notification stats (admin only).
 * Replaces: notifications.getStats (adminProcedure query)
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx);
    const all = await ctx.db.query('notifications').collect();
    return { total: all.length };
  },
});

/**
 * Get all notifications for the current user.
 * Replaces: notifications.getAll (protectedProcedure query)
 *
 * This is a reactive query — components using it will automatically
 * update when notifications change. No SSE needed!
 */
export const getAll = query({
  args: {
    limit: v.optional(v.float64()),
    offset: v.optional(v.float64()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];
    const limit = args.limit ?? 50;

    let q;
    if (args.unreadOnly) {
      q = ctx.db
        .query('notifications')
        .withIndex('by_userId_read', (q) =>
          q.eq('userId', user._id).eq('read', false)
        );
    } else {
      q = ctx.db
        .query('notifications')
        .withIndex('by_userId', (q) => q.eq('userId', user._id));
    }

    const notifications = await q.order('desc').take(limit);
    return notifications;
  },
});

/**
 * Get unread notification count for the current user.
 * Replaces: notifications.getUnreadCount (protectedProcedure query)
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return { count: 0 };
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_userId_read', (q) =>
        q.eq('userId', user._id).eq('read', false)
      )
      .collect();

    return { count: unread.length };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Send a notification to a user (admin only).
 * Replaces: notifications.sendToUser (adminProcedure mutation)
 */
export const sendToUser = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    message: v.string(),
    type: notificationType,
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      updatedAt: Date.now(),
    });
    // No need to emit realtime event — Convex reactive queries handle this!
  },
});

/**
 * Mark a single notification as read.
 * Replaces: notifications.markAsRead (protectedProcedure mutation)
 */
export const markAsRead = mutation({
  args: {
    id: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new ConvexError('NOT_FOUND');
    if (notification.userId !== user._id) throw new ConvexError('FORBIDDEN');

    await ctx.db.patch(args.id, { read: true, updatedAt: Date.now() });
  },
});

/**
 * Mark all notifications as read for the current user.
 * Replaces: notifications.markAllAsRead (protectedProcedure mutation)
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const now = Date.now();

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_userId_read', (q) =>
        q.eq('userId', user._id).eq('read', false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true, updatedAt: now });
    }
  },
});

/**
 * Clean up old notifications.
 * Replaces: notifications.cleanup (protectedProcedure mutation)
 */
export const cleanup = mutation({
  args: {
    daysToKeep: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const daysToKeep = args.daysToKeep ?? 30;
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const old = await ctx.db
      .query('notifications')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect();

    let deleted = 0;
    for (const notification of old) {
      if (notification._creationTime < cutoff) {
        await ctx.db.delete(notification._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

// ---------------------------------------------------------------------------
// Internal mutations (called from other functions)
// ---------------------------------------------------------------------------

/**
 * Create a notification for a user (internal).
 * Used by other functions (e.g. bounty comments, submissions) to send
 * notifications without going through the admin check.
 */
export const createNotification = internalMutation({
  args: {
    userId: v.id('users'),
    type: notificationType,
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      updatedAt: Date.now(),
    });
  },
});
