import { discordBotEnv as env } from "@bounty/env/discord-bot";
import { db } from "@bounty/db";
import {
	ActionRow,
	Button,
	Container,
	TextDisplay,
	makeReacord,
} from "@bounty/reacord";
import { SlashCommandBuilder as Builder, MessageFlags } from "discord.js";
import { Runtime } from "effect";
import { account } from "@bounty/db/src/schema/auth";
import { eq, and } from "drizzle-orm";
import type { Client } from "discord.js";

/**
 * Get the login command definition (without registering it)
 * This allows centralized command registration
 */
export function getLoginCommandDefinition() {
	return new Builder()
		.setName("login")
		.setDescription("Link your Discord account to bounty.new");
}

export function setupLoginCommand(client: Client) {
	const reacord = makeReacord(client);
	const runtime = Runtime.defaultRuntime;

	client.on("interactionCreate", async (interaction) => {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== "login") return;

		try {
			const discordId = interaction.user.id;

			// Check if account is already linked
			const [existingAccount] = await db
				.select()
				.from(account)
				.where(
					and(
						eq(account.providerId, "discord"),
						eq(account.accountId, discordId),
					),
				)
				.limit(1);

			if (existingAccount) {
				await Runtime.runPromise(runtime)(
					reacord.reply(
						interaction,
						<Container>
							<TextDisplay>
								✅ Your Discord account is already linked to bounty.new!
								{"\n\n"}
								Visit your profile: {env.BETTER_AUTH_URL}/profile
							</TextDisplay>
						</Container>,
					),
				);
				return;
			}

			// Use Better Auth's Discord OAuth flow
			// The callback URL is handled by Better Auth at /api/auth/callback/discord
			const oauthUrl = new URL("https://discord.com/api/oauth2/authorize");
			oauthUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID || "");
			oauthUrl.searchParams.set(
				"redirect_uri",
				`${env.BETTER_AUTH_URL}/api/auth/callback/discord`,
			);
			oauthUrl.searchParams.set("response_type", "code");
			oauthUrl.searchParams.set("scope", "identify email");

			await Runtime.runPromise(runtime)(
				reacord.reply(
					interaction,
					<Container>
						<TextDisplay>
							🔗 **Link your Discord account to bounty.new**
							{"\n\n"}
							Click the button below to authorize the connection.
							{"\n\n"}
							⚠️ **Note:** You must be logged into bounty.new in your browser for
							this to work.
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
					</Container>,
				),
			);
		} catch (error) {
			console.error("Error handling login command:", error);
			if (!(interaction.replied || interaction.deferred)) {
				await interaction.reply({
					content: `❌ An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	});
}
