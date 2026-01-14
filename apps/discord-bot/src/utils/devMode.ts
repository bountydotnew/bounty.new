import type { ChatInputCommandInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import { discordBotEnv as env } from '@bounty/env/discord-bot';

/**
 * Check if dev mode is enabled and if the user is authorized
 * Throws an error if dev mode is enabled and the user is not the whitelisted dev user
 */
export async function requireDevAuth(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  // If dev mode is disabled, allow all users
  if (!env.DEV_MODE) {
    return;
  }

  // Dev mode is enabled - check if user is the whitelisted dev
  if (!env.DEV_USER_ID) {
    console.error('DEV_MODE is enabled but DEV_USER_ID is not set');
    await interaction.reply({
      content: '❌ Bot is in dev mode but no dev user is configured.',
      flags: MessageFlags.Ephemeral,
    });
    throw new Error('Dev mode enabled but DEV_USER_ID not set');
  }

  if (interaction.user.id !== env.DEV_USER_ID) {
    await interaction.reply({
      content: '❌ Bot is in dev mode. Only the developer can use commands.',
      flags: MessageFlags.Ephemeral,
    });
    throw new Error('User not authorized in dev mode');
  }
}
