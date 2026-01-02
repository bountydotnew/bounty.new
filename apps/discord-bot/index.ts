// CRITICAL: Load .env file FIRST, then validate environment variables
// before importing anything that uses @bounty/db
import { discordBotEnv } from '@bounty/env/discord-bot';

// Access env to trigger validation synchronously
// This will throw if required env vars are missing
const env = discordBotEnv;

// CRITICAL: Set DATABASE_URL in process.env BEFORE any imports that use @bounty/db
// The @bounty/db package checks process.env.DATABASE_URL at module load time
if (!process.env.DATABASE_URL) {
  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  } else {
    throw new Error(
      'DATABASE_URL is required but not found in environment variables. ' +
        'Please ensure it is set in your .env file or environment.'
    );
  }
}

// Now use dynamic imports to ensure env is set before modules that use @bounty/db load
async function startBot() {
  const { Client, GatewayIntentBits } = await import('discord.js');
  const { bot } = await import('./src/bot');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // Required for slash commands and guild data
      GatewayIntentBits.GuildMessages, // Required for reading messages in guilds
      GatewayIntentBits.MessageContent, // Privileged intent - must be enabled in Discord Developer Portal
    ],
  });

  // Validate Discord bot token at runtime
  if (!env.DISCORD_BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN is required but not found in environment variables');
  }

  client.once('clientReady', () => {
    console.log(`Bot is ready! Logged in as ${client.user?.tag}`);
  });

  client.login(env.DISCORD_BOT_TOKEN).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1);
  });

  bot(client);
}

startBot().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
