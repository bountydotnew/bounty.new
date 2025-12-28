import type { Client } from 'discord.js';
import { REST, Routes } from 'discord.js';
import { setupLoginCommand, getLoginCommandDefinition } from './login.js';
import { setupBountyCommands, getBountyCommandDefinitions } from './bounty.js';
import { setupUserCommand } from './user';
import { discordBotEnv as env } from '@bounty/env/discord-bot';

export function setupCommands(client: Client) {
  // Set up command handlers first
  setupLoginCommand(client);
  setupBountyCommands(client);
  setupUserCommand(client);

  // Register all commands together after bot is ready
  // This prevents commands from overwriting each other
  client.once('clientReady', async () => {
    try {
      const commands = [
        getLoginCommandDefinition(),
        ...getBountyCommandDefinitions(),
        // Add user command definition here when implemented
      ].map((cmd) => cmd.toJSON());

      const rest = new REST().setToken(env.DISCORD_BOT_TOKEN);

      const data = await rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID),
        { body: commands },
      );

      console.log(
        `Successfully registered ${Array.isArray(data) ? data.length : 0} application (/) commands.`,
      );
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  });
}
