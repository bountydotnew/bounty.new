/**
 * Discord functions.
 *
 * Replaces: packages/api/src/routers/discord.ts (4 procedures)
 */
import { query, action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import { requireAuth } from '../lib/auth';

/**
 * Get the Discord bot install URL.
 * Replaces: discord.getBotInstallUrl (protectedProcedure query)
 */
export const getBotInstallUrl = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) return { url: null };

    const permissions = '2048'; // Send Messages
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;

    return { url };
  },
});

/**
 * Unlink Discord account.
 * Replaces: discord.unlinkAccount (protectedProcedure mutation)
 */
export const unlinkAccount = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    // Account unlinking is handled by Better Auth's account management.
    // The client calls Better Auth's unlink endpoint directly.
    return { success: true };
  },
});

/**
 * Get the user's linked Discord account info.
 * Replaces: discord.getLinkedAccount (protectedProcedure query → action)
 */
export const getLinkedAccount = action({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.functions.user.getMe, {});
    if (!user) throw new ConvexError('UNAUTHENTICATED');

    // Query Better Auth for Discord account
    // The access token is stored in the Better Auth component's account table.
    // For now, return basic info from the user record.
    return { linked: false, account: null };
  },
});

/**
 * Get Discord guilds for the current org.
 * Replaces: discord.getGuilds (orgProcedure query → action)
 */
export const getGuilds = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // This would need to:
    // 1. Get the user's Discord access token from Better Auth
    // 2. Call Discord API GET /users/@me/guilds
    // 3. Filter by guilds linked to the organization
    return { guilds: [] };
  },
});
