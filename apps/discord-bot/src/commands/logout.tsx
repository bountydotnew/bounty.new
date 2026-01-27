import { db } from '@bounty/db';
import {
  ActionRow,
  Button,
  Container,
  TextDisplay,
  makeReacord,
} from '@bounty/reacord';
import { SlashCommandBuilder as Builder, MessageFlags } from 'discord.js';
import { Runtime } from 'effect';
import { account } from '@bounty/db/src/schema/auth';
import { eq, and } from 'drizzle-orm';
import type { Client } from 'discord.js';

/**
 * Get the logout command definition (without registering it)
 * This allows centralized command registration
 */
export function getLogoutCommandDefinition() {
  return new Builder()
    .setName('logout')
    .setDescription('Unlink your Discord account from bounty.new');
}

export function setupLogoutCommand(client: Client) {
  const reacord = makeReacord(client);
  const runtime = Runtime.defaultRuntime;

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'logout') return;

    try {
      const discordId = interaction.user.id;

      // Check if account is linked
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

      if (!existingAccount) {
        await Runtime.runPromise(runtime)(
          reacord.reply(
            interaction,
            <Container>
              <TextDisplay>
                ❌ Your Discord account is not linked to bounty.new.
                {'\n\n'}
                Use `/login` to link your account.
              </TextDisplay>
            </Container>
          )
        );
        return;
      }

      // Show confirmation button
      await Runtime.runPromise(runtime)(
        reacord.reply(
          interaction,
          <Container>
            <TextDisplay>
              ⚠️ **Unlink your Discord account from bounty.new?**
              {'\n\n'}
              This will remove the connection between your Discord and
              bounty.new accounts. You can always link again using `/login`.
            </TextDisplay>
            <ActionRow>
              <Button
                label="Unlink Account"
                style="danger"
                onClick={async (btnInteraction) => {
                  try {
                    // Delete the account link
                    await db
                      .delete(account)
                      .where(
                        and(
                          eq(account.providerId, 'discord'),
                          eq(account.accountId, discordId)
                        )
                      );

                    await btnInteraction.reply({
                      content:
                        '✅ Your Discord account has been unlinked from bounty.new.',
                      flags: MessageFlags.Ephemeral,
                    });
                  } catch (error) {
                    console.error('Error unlinking account:', error);
                    await btnInteraction.reply({
                      content: '❌ Failed to unlink account. Please try again.',
                      flags: MessageFlags.Ephemeral,
                    });
                  }
                }}
              />
              <Button
                label="Cancel"
                style="secondary"
                onClick={async (btnInteraction) => {
                  await btnInteraction.reply({
                    content: '👍 Cancelled. Your account remains linked.',
                    flags: MessageFlags.Ephemeral,
                  });
                }}
              />
            </ActionRow>
          </Container>
        )
      );
    } catch (error) {
      console.error('Error handling logout command:', error);
      if (!(interaction.replied || interaction.deferred)) {
        await interaction.reply({
          content: `❌ An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });
}
