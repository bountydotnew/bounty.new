// Validate env first
import { discordBotEnv as env } from '@bounty/env/discord-bot';

// Now safe to import db
import { db } from '@bounty/db';
import {
  ActionRow,
  Button,
  Container,
  TextDisplay,
  makeReacord,
} from '@bounty/reacord';
import { SlashCommandBuilder as Builder, Routes, REST } from 'discord.js';
import { Runtime } from 'effect';
import { account } from '@bounty/db/src/schema/auth';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import type { Client } from 'discord.js';

/**
 * Generate a secure state token for OAuth flow
 */
function generateStateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Store OAuth state in database (or use Redis in production)
 * For now, we'll use a simple in-memory store with expiration
 */
const oauthStates = new Map<
  string,
  { discordId: string; expiresAt: number }
>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Get the login command definition (without registering it)
 * This allows centralized command registration
 */
export function getLoginCommandDefinition() {
  return new Builder()
    .setName('login')
    .setDescription('Link your Discord account to bounty.new');
}

export function setupLoginCommand(client: Client) {
  const reacord = makeReacord(client);
  const runtime = Runtime.defaultRuntime;

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'login') return;

    try {
      const discordId = interaction.user.id;

      // Check if account is already linked
      const [existingAccount] = await db
        .select()
        .from(account)
        .where(
          and(
            eq(account.providerId, 'discord'),
            eq(account.accountId, discordId)
          )
        )
        .limit(1);

      if (existingAccount) {
        await Runtime.runPromise(runtime)(
          reacord.reply(interaction, (
            <Container>
              <TextDisplay>
                ✅ Your Discord account is already linked to bounty.new!
                {'\n\n'}
                Visit your profile: {env.BETTER_AUTH_URL}/profile
              </TextDisplay>
            </Container>
          )),
        );
        return;
      }

      // Generate OAuth state token
      const state = generateStateToken();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      oauthStates.set(state, { discordId, expiresAt });

      // Create OAuth URL
      const redirectUri = `${env.BETTER_AUTH_URL}/api/discord/callback`;
      const oauthUrl = new URL('https://discord.com/api/oauth2/authorize');
      oauthUrl.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('scope', 'identify email');
      oauthUrl.searchParams.set('state', state);

      await Runtime.runPromise(runtime)(
        reacord.reply(interaction, (
          <Container>
            <TextDisplay>
              🔗 **Link your Discord account to bounty.new**
              {'\n\n'}
              Click the button below to authorize the connection. This will open a secure OAuth flow.
              {'\n\n'}
              ⚠️ **Note:** You must be logged into bounty.new in your browser for this to work.
            </TextDisplay>
            <ActionRow>
              <Button
                label="Link Account"
                style="primary"
                onClick={async (btnInteraction) => {
                  await btnInteraction.reply({
                    content: `🔗 Click here to link your account:\n${oauthUrl.toString()}`,
                    flags: MessageFlags.Ephemeral,
                  });
                }}
              />
            </ActionRow>
          </Container>
        )),
      );
    } catch (error) {
      console.error('Error handling login command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });
}
