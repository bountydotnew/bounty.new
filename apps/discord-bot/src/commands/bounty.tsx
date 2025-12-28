import { discordBotEnv as env } from '@bounty/env/discord-bot';
import { db } from '@bounty/db';
import { account } from '@bounty/db/src/schema/auth';
import { createServerCaller } from '@bounty/api';
import {
  ActionRow,
  Container,
  ModalButton,
  Section,
  TextDisplay,
  makeReacord,
} from '@bounty/reacord';
import type { ChatInputCommandInteraction, Client } from 'discord.js';
import { SlashCommandBuilder as Builder, MessageFlags } from 'discord.js';
import { Runtime } from 'effect';
import { eq, and } from 'drizzle-orm';

/**
 * Get the bounty.new user ID from Discord user ID
 */
async function getUserIdFromDiscordId(discordId: string): Promise<string | null> {
  const [discordAccount] = await db
    .select({ userId: account.userId })
    .from(account)
    .where(and(
      eq(account.providerId, 'discord'),
      eq(account.accountId, discordId)
    ))
    .limit(1);

  return discordAccount?.userId ?? null;
}

/**
 * Clean and truncate description for Discord display
 */
function cleanDescription(description: string, maxLength = 80): string {
  const cleaned = description
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*Summary by.*?\*\*/g, '')
    .replace(/^---.*?---$/gm, '')
    .replace(/^\*\*.*?\*\*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const finalText = lastSpace > maxLength * 0.7
    ? truncated.slice(0, lastSpace)
    : truncated;

  return `${finalText.trim()}...`;
}

/**
 * Reply to modal interaction, handling deferred state
 */
async function replyToModal(
  interaction: { replied: boolean; deferred: boolean; reply: (opts: unknown) => Promise<void>; followUp: (opts: unknown) => Promise<void> },
  content: string,
): Promise<void> {
  const opts = { content, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(opts);
  } else {
    await interaction.reply(opts);
  }
}

/**
 * Require user to be authenticated (linked Discord account)
 */
async function requireAuth(
  interaction: ChatInputCommandInteraction,
): Promise<string> {
  const userId = await getUserIdFromDiscordId(interaction.user.id);
  if (!userId) {
    await interaction.reply({
      content:
        '❌ You need to link your Discord account first. Use `/login` to get started.',
      flags: MessageFlags.Ephemeral,
    });
    throw new Error('User not authenticated');
  }
  return userId;
}

/**
 * Get the bounty command definitions (without registering them)
 * This allows centralized command registration
 */
export function getBountyCommandDefinitions() {
  return [
    new Builder()
      .setName('bounty')
      .setDescription('Manage bounties')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('create')
          .setDescription('Create a new bounty'),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('list')
          .setDescription('List all active bounties')
          .addIntegerOption((option) =>
            option
              .setName('page')
              .setDescription('Page number')
              .setMinValue(1)
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('view')
          .setDescription('View a specific bounty')
          .addStringOption((option) =>
            option
              .setName('id')
              .setDescription('Bounty ID')
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('close')
          .setDescription('Close a bounty')
          .addStringOption((option) =>
            option
              .setName('id')
              .setDescription('Bounty ID')
              .setRequired(true),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('approve')
          .setDescription('Approve a submission for a bounty')
          .addStringOption((option) =>
            option
              .setName('bounty_id')
              .setDescription('Bounty ID')
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName('submission_id')
              .setDescription('Submission ID')
              .setRequired(true),
          ),
      ),
  ];
}

export function setupBountyCommands(client: Client) {
  const reacord = makeReacord(client);
  const runtime = Runtime.defaultRuntime;

  client.on('interactionCreate', async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'bounty') return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'create') {
        await handleCreate(interaction, reacord, runtime);
      } else if (subcommand === 'list') {
        await handleList(interaction, reacord, runtime);
      } else if (subcommand === 'view') {
        await handleView(interaction, reacord, runtime);
      } else if (subcommand === 'close') {
        await handleClose(interaction);
      } else if (subcommand === 'approve') {
        await handleApprove(interaction);
      }
    } catch (error) {
      console.error('Error handling bounty command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });
}

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  reacord: ReturnType<typeof makeReacord>,
  runtime: Runtime.Runtime<never>,
) {
  const userId = await requireAuth(interaction);

  const instance = await Runtime.runPromise(runtime)(
    reacord.reply(interaction, (
      <Container>
        <TextDisplay>Click the button below to create a new bounty:</TextDisplay>
        <ActionRow>
          <ModalButton
            label="Create Bounty"
            style="primary"
            modalTitle="Create New Bounty"
            fields={[
              {
                type: 'textInput',
                id: 'title',
                label: 'Title',
                description: 'Enter the bounty title',
                placeholder: 'e.g., Fix login bug',
                required: true,
                maxLength: 200,
              },
              {
                type: 'textInput',
                id: 'description',
                label: 'Description',
                description: 'Describe what needs to be done',
                style: 'paragraph',
                placeholder: 'Detailed description of the bounty...',
                required: true,
                minLength: 10,
              },
              {
                type: 'textInput',
                id: 'amount',
                label: 'Reward Amount',
                description: 'Amount in USD (e.g., 100.00)',
                placeholder: '100.00',
                required: true,
              },
              {
                type: 'textInput',
                id: 'deadline',
                label: 'Deadline (Optional)',
                description: 'ISO date string (e.g., 2024-12-31T23:59:59Z)',
                placeholder: '2024-12-31T23:59:59Z',
                required: false,
              },
            ]}
            onSubmit={async (values, modalInteraction) => {
              try {
                const title = values.getTextInput('title') || '';
                const description = values.getTextInput('description') || '';
                const amount = values.getTextInput('amount') || '';
                const deadline = values.getTextInput('deadline');

                const caller = await createServerCaller(userId);
                const result = await caller.bounties.createBounty({
                  title,
                  description,
                  amount,
                  currency: 'USD',
                  deadline: deadline || undefined,
                });

                if (result.success && result.data) {
                  const bounty = result.data;
                  const bountyUrl = `${env.BETTER_AUTH_URL}/bounty/${bounty.id}`;
                  
                  // Use followUp with components styled like Sections (with View button)
                  await modalInteraction.followUp({
                    content: '✅ Bounty created successfully!',
                    flags: MessageFlags.Ephemeral,
                    components: [
                      {
                        type: 1, // ActionRow
                        components: [
                          {
                            type: 2, // Button
                            style: 5, // Link button
                            label: 'View',
                            url: bountyUrl,
                          },
                        ],
                      },
                    ],
                    embeds: [
                      {
                        title: bounty.title,
                        description: `${bounty.description}\n\n**Reward:** $${bounty.amount} ${bounty.currency}${deadline ? `\n**Deadline:** ${new Date(deadline).toLocaleDateString()}` : ''}`,
                        color: 0x00_ff_00, // Green
                        url: bountyUrl,
                      },
                    ],
                  });
                } else {
                  await replyToModal(modalInteraction, '❌ Failed to create bounty');
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                await replyToModal(modalInteraction, `❌ Error: ${errorMessage}`);
              }
            }}
          />
        </ActionRow>
      </Container>
    )),
  );
}

async function handleList(
  interaction: ChatInputCommandInteraction,
  reacord: ReturnType<typeof makeReacord>,
  runtime: Runtime.Runtime<never>,
) {
  const userId = await requireAuth(interaction);
  const page = interaction.options.getInteger('page') || 1;

  const caller = await createServerCaller(userId);
  const result = await caller.bounties.fetchAllBounties({
    page,
    limit: 10,
    status: 'open',
  });

  if (!result.success || !result.data) {
    await interaction.reply({
      content: '❌ Failed to fetch bounties',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const bounties = result.data;
  const pagination = result.pagination;

  if (bounties.length === 0) {
    await interaction.reply({
      content: '📭 No active bounties found.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const instance = await Runtime.runPromise(runtime)(
    reacord.reply(interaction, (
      <Container>
        <TextDisplay>
          **Active Bounties** (Page {pagination.page} of {pagination.totalPages})
        </TextDisplay>
        {bounties.map((bounty) => (
          <Section
            key={bounty.id}
            accessory={{
              type: 'link',
              url: `${env.BETTER_AUTH_URL}/bounty/${bounty.id}`,
              label: 'View',
            }}
          >
            <TextDisplay>
              **{bounty.title}**
              {'\n'}
              `{bounty.id}`
              {'\n'}
              {cleanDescription(bounty.description)}
              {bounty.description.replace(/<!--[\s\S]*?-->/g, '').trim().length > 80 && (
                <>
                  {'\n\n'}
                  *View full details on bounty.new*
                </>
              )}
              {'\n\n'}
              **Reward:** ${bounty.amount} {bounty.currency}
              {bounty.deadline
                ? `\n**Deadline:** ${new Date(bounty.deadline).toLocaleDateString()}`
                : ''}
              {bounty.tags && bounty.tags.length > 0
                ? `\n**Tags:** ${bounty.tags.join(', ')}`
                : ''}
            </TextDisplay>
          </Section>
        ))}
      </Container>
    )),
  );
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  reacord: ReturnType<typeof makeReacord>,
  runtime: Runtime.Runtime<never>,
) {
  const userId = await requireAuth(interaction);
  const bountyId = interaction.options.getString('id', true);

  const caller = await createServerCaller(userId);
  const result = await caller.bounties.fetchBountyById({ id: bountyId });

  if (!result.success || !result.data) {
    await interaction.reply({
      content: '❌ Bounty not found',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const bounty = result.data;
  const bountyUrl = `${env.BETTER_AUTH_URL}/bounty/${bounty.id}`;

  const instance = await Runtime.runPromise(runtime)(
    reacord.reply(interaction, (
      <Container>
        <Section
          accessory={{
            type: 'link',
            url: bountyUrl,
            label: 'View on Website',
          }}
        >
          <TextDisplay>
            **{bounty.title}**
            {'\n\n'}
            {bounty.description}
            {'\n\n'}
            **Status:** {bounty.status}
            {'\n'}**Reward:** ${bounty.amount} {bounty.currency}
            {bounty.deadline
              ? `\n**Deadline:** ${new Date(bounty.deadline).toLocaleDateString()}`
              : ''}
            {bounty.tags && bounty.tags.length > 0
              ? `\n**Tags:** ${bounty.tags.join(', ')}`
              : ''}
            {bounty.repositoryUrl
              ? `\n**Repository:** ${bounty.repositoryUrl}`
              : ''}
            {bounty.issueUrl ? `\n**Issue:** ${bounty.issueUrl}` : ''}
            {'\n'}**Created by:** {bounty.creator.name}
            {'\n'}**Created:** {new Date(bounty.createdAt).toLocaleDateString()}
          </TextDisplay>
        </Section>
      </Container>
    )),
  );
}

async function handleClose(
  interaction: ChatInputCommandInteraction,
) {
  const userId = await requireAuth(interaction);
  const bountyId = interaction.options.getString('id', true);

  const caller = await createServerCaller(userId);
  
  // First verify the bounty exists and belongs to the user
  const bountyResult = await caller.bounties.fetchBountyById({
    id: bountyId,
  });

  if (!bountyResult.success || !bountyResult.data) {
    await interaction.reply({
      content: '❌ Bounty not found',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (bountyResult.data.createdById !== userId) {
    await interaction.reply({
      content: '❌ You can only close your own bounties',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Update bounty status to cancelled
  const updateResult = await caller.bounties.updateBounty({
    id: bountyId,
    status: 'cancelled',
  });

  if (updateResult.success) {
    await interaction.reply({
      content: `✅ Bounty "${bountyResult.data.title}" has been closed.`,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply({
      content: '❌ Failed to close bounty',
      flags: MessageFlags.Ephemeral,
    });
  }
}

async function handleApprove(interaction: ChatInputCommandInteraction) {
  const userId = await requireAuth(interaction);
  const bountyId = interaction.options.getString('bounty_id', true);
  const submissionId = interaction.options.getString('submission_id', true);

  const caller = await createServerCaller(userId);

  try {
    const result = await caller.bounties.approveSubmission({
      bountyId,
      submissionId,
    });

    if (result.success) {
      await interaction.reply({
        content: `✅ Submission approved! The bounty has been marked as completed.`,
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: '❌ Failed to approve submission',
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await interaction.reply({
      content: `❌ ${message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
