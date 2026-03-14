/**
 * Linear integration functions — queries & mutations.
 *
 * Replaces: packages/api/src/routers/linear.ts (12 procedures)
 *
 * Actions that call the Linear API live in linearActions.ts ("use node").
 */
import { query, mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requireAuth, requireOrgMember, requireOrgOwner } from '../lib/auth';

// ============================================================================
// QUERIES (DB-only)
// ============================================================================

/**
 * Get Linear account connection status.
 * Replaces: linear.getAccountStatus (protectedProcedure query)
 */
export const getAccountStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Look for a Linear account via Better Auth
    // The Linear OAuth account stores the access token
    // For now, check if we have a linearAccount record
    const accounts = await ctx.db.query('linearAccounts').collect();
    const hasLinearAccount = accounts.length > 0;

    return { connected: hasLinearAccount };
  },
});

/**
 * Get Linear connection status for the current org.
 * Replaces: linear.getConnectionStatus (orgProcedure query)
 */
export const getConnectionStatus = query({
  args: { organizationId: v.optional(v.id('organizations')) },
  handler: async (ctx, args) => {
    const result = await requireOrgMember(ctx, args.organizationId as any);

    const workspace = await ctx.db
      .query('linearAccounts')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .first();

    return {
      connected: !!workspace,
      workspace: workspace
        ? {
            name: workspace.linearWorkspaceName,
            url: workspace.linearWorkspaceUrl,
            key: workspace.linearWorkspaceKey,
          }
        : null,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Disconnect a Linear workspace.
 * Replaces: linear.disconnect (orgOwnerProcedure mutation)
 */
export const disconnect = mutation({
  args: {
    organizationId: v.optional(v.id('organizations')),
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await requireOrgOwner(ctx, args.organizationId as any);

    const account = await ctx.db
      .query('linearAccounts')
      .withIndex('by_organizationId', (q) =>
        q.eq('organizationId', result.org._id)
      )
      .filter((q) => q.eq(q.field('linearWorkspaceId'), args.workspaceId))
      .first();

    if (!account) throw new ConvexError('WORKSPACE_NOT_FOUND');

    await ctx.db.delete(account._id);
  },
});
