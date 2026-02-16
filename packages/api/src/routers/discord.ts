import { env } from '@bounty/env/server';
import { account, discordGuild } from '@bounty/db';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { protectedProcedure, orgProcedure, router } from '../trpc';

// Discord bot permissions - basic permissions for reading messages and sending embeds
// https://discord.com/developers/docs/topics/permissions
const BOT_PERMISSIONS = '2147485696'; // Send Messages, Embed Links, Read Message History

interface DiscordGuildFromAPI {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordUserFromAPI {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
}

export const discordRouter = router({
  /**
   * Get the Discord bot install URL (for adding bot to a server)
   */
  getBotInstallUrl: protectedProcedure.query(() => {
    const clientId = env.DISCORD_CLIENT_ID;

    if (!clientId) {
      return { url: null, configured: false };
    }

    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('permissions', BOT_PERMISSIONS);
    url.searchParams.set('scope', 'bot applications.commands');

    return { url: url.toString(), configured: true };
  }),

  /**
   * Get the user's linked Discord account (if any)
   * Fetches username and avatar from Discord API
   */
  getLinkedAccount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [discordAccount] = await ctx.db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, 'discord')))
      .limit(1);

    if (!discordAccount) {
      return { linked: false, account: null };
    }

    // Fetch user profile from Discord API
    let username: string | null = null;
    let avatar: string | null = null;
    let globalName: string | null = null;

    if (discordAccount.accessToken) {
      try {
        const response = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${discordAccount.accessToken}`,
          },
        });

        if (response.ok) {
          const discordUser = (await response.json()) as DiscordUserFromAPI;
          username = discordUser.username;
          globalName = discordUser.global_name;
          avatar = discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordAccount.accountId}/${discordUser.avatar}.png`
            : null;
        }
      } catch (error) {
        console.error('Failed to fetch Discord user profile:', error);
      }
    }

    // Ensure we always have a valid displayName
    const discordId = discordAccount.accountId ?? 'Unknown';
    const displayName = globalName || username || discordId;

    return {
      linked: true,
      account: {
        discordId,
        username,
        globalName,
        displayName,
        avatar,
        linkedAt: discordAccount.createdAt,
      },
    };
  }),

  /**
   * Unlink Discord account
   */
  unlinkAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await ctx.db
      .delete(account)
      .where(
        and(eq(account.userId, userId), eq(account.providerId, 'discord'))
      );

    return { success: true };
  }),

  /**
   * Get servers where the bot is installed that the user is a member of (scoped to active org)
   */
  getGuilds: orgProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user's Discord account with access token
    const [discordAccount] = await ctx.db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, 'discord')))
      .limit(1);

    if (!discordAccount?.accessToken) {
      return { guilds: [], userGuildIds: [] };
    }

    // Fetch user's guilds from Discord API
    let userGuildIds: string[] = [];
    try {
      const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${discordAccount.accessToken}`,
        },
      });

      if (response.ok) {
        const userGuilds = (await response.json()) as DiscordGuildFromAPI[];
        userGuildIds = userGuilds.map((g) => g.id);
      }
    } catch (error) {
      console.error('Failed to fetch user guilds from Discord:', error);
    }

    if (userGuildIds.length === 0) {
      return { guilds: [], userGuildIds: [] };
    }

    // Get guilds where bot is installed AND user is a member AND belongs to active org
    const guilds = await ctx.db
      .select({
        id: discordGuild.id,
        name: discordGuild.name,
        icon: discordGuild.icon,
        memberCount: discordGuild.memberCount,
        installedAt: discordGuild.installedAt,
      })
      .from(discordGuild)
      .where(
        and(
          isNull(discordGuild.removedAt),
          inArray(discordGuild.id, userGuildIds),
          eq(discordGuild.organizationId, ctx.org.id)
        )
      )
      .orderBy(discordGuild.name);

    return { guilds, userGuildIds };
  }),
});
