import type { Client, Guild } from 'discord.js';
import { db, discordGuild } from '@bounty/db';
import { eq } from 'drizzle-orm';

/**
 * Set up guild event handlers to track bot installations
 */
export function setupGuildEvents(client: Client) {
  // Bot was added to a server
  client.on('guildCreate', async (guild: Guild) => {
    console.log(`Bot added to server: ${guild.name} (${guild.id})`);

    try {
      await db
        .insert(discordGuild)
        .values({
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          ownerId: guild.ownerId,
          memberCount: guild.memberCount,
          installedAt: new Date(),
          removedAt: null,
        })
        .onConflictDoUpdate({
          target: discordGuild.id,
          set: {
            name: guild.name,
            icon: guild.icon,
            ownerId: guild.ownerId,
            memberCount: guild.memberCount,
            removedAt: null, // Clear removal date if bot is re-added
          },
        });

      console.log(`Tracked guild installation: ${guild.name}`);
    } catch (error) {
      console.error('Failed to track guild installation:', error);
    }
  });

  // Bot was removed from a server
  client.on('guildDelete', async (guild: Guild) => {
    console.log(`Bot removed from server: ${guild.name} (${guild.id})`);

    try {
      await db
        .update(discordGuild)
        .set({ removedAt: new Date() })
        .where(eq(discordGuild.id, guild.id));

      console.log(`Tracked guild removal: ${guild.name}`);
    } catch (error) {
      console.error('Failed to track guild removal:', error);
    }
  });

  // Sync existing guilds when bot starts
  client.once('ready', async () => {
    console.log(`Bot is in ${client.guilds.cache.size} servers`);

    // Sync all current guilds to database
    for (const guild of client.guilds.cache.values()) {
      try {
        await db
          .insert(discordGuild)
          .values({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            ownerId: guild.ownerId,
            memberCount: guild.memberCount,
            installedAt: new Date(),
            removedAt: null,
          })
          .onConflictDoUpdate({
            target: discordGuild.id,
            set: {
              name: guild.name,
              icon: guild.icon,
              ownerId: guild.ownerId,
              memberCount: guild.memberCount,
              removedAt: null,
            },
          });
      } catch (error) {
        console.error(`Failed to sync guild ${guild.name}:`, error);
      }
    }

    console.log('Guild sync complete');
  });
}
