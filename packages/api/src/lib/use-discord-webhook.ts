interface DiscordWebhookPayload {
	content?: string;
	embeds?: DiscordEmbed[];
	username?: string;
	avatar_url?: string;
}

interface DiscordEmbed {
	title?: string;
	description?: string;
	color?: number;
	fields?: DiscordEmbedField[];
	timestamp?: string;
	footer?: {
		text: string;
		icon_url?: string;
	};
}

interface DiscordEmbedField {
	name: string;
	value: string;
	inline?: boolean;
}

interface SendWebhookOptions {
	webhookUrl: string;
	content?: string;
	embed?: Omit<DiscordEmbed, "timestamp">;
	username?: string;
	avatarUrl?: string;
}

interface SendErrorWebhookOptions {
	webhookUrl: string;
	error: Error | string;
	context?: Record<string, unknown>;
	location?: string;
	userId?: string;
}

async function sendDiscordWebhook({
	webhookUrl,
	content,
	embed,
	username = "bounty.new",
	avatarUrl,
}: SendWebhookOptions): Promise<boolean> {
	try {
		const payload: DiscordWebhookPayload = {
			username,
			...(avatarUrl && { avatar_url: avatarUrl }),
		};

		if (content) {
			payload.content = content;
		}

		if (embed) {
			payload.embeds = [
				{
					...embed,
					timestamp: new Date().toISOString(),
				},
			];
		}

		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		return response.ok;
	} catch (_error) {
		return false;
	}
}

export async function sendErrorWebhook({
	webhookUrl,
	error,
	context,
	location,
	userId,
}: SendErrorWebhookOptions): Promise<boolean> {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;

	const embed: Omit<DiscordEmbed, "timestamp"> = {
		title: "🚨 Production Error",
		description: `**Error:** ${errorMessage}`,
		color: 0xff_00_00, // Red color
		fields: [
			{
				name: "Environment",
				value: process.env.NODE_ENV || "unknown",
				inline: true,
			},
			{
				name: "Location",
				value: location || "Unknown",
				inline: true,
			},
		],
	};

	if (userId) {
		embed.fields?.push({
			name: "User ID",
			value: userId,
			inline: true,
		});
	}

	if (context && Object.keys(context).length > 0) {
		embed.fields?.push({
			name: "Context",
			value: `\`\`\`json\n${JSON.stringify(context, null, 2).slice(0, 1000)}\n\`\`\``,
			inline: false,
		});
	}

	if (errorStack) {
		embed.fields?.push({
			name: "Stack Trace",
			value: `\`\`\`\n${errorStack.slice(0, 1000)}\n\`\`\``,
			inline: false,
		});
	}

	embed.footer = {
		text: "bounty.new Error Monitoring",
	};

	return sendDiscordWebhook({
		webhookUrl,
		embed,
	});
}

export async function sendInfoWebhook({
	webhookUrl,
	title,
	message,
	context,
	color = 0x00_ff_00, // Green color
}: {
	webhookUrl: string;
	title: string;
	message: string;
	context?: Record<string, unknown>;
	color?: number;
}): Promise<boolean> {
	const embed: Omit<DiscordEmbed, "timestamp"> = {
		title,
		description: message,
		color,
		fields: [],
	};

	if (context && Object.keys(context).length > 0) {
		embed.fields?.push({
			name: "Details",
			value: `\`\`\`json\n${JSON.stringify(context, null, 2).slice(0, 1000)}\n\`\`\``,
			inline: false,
		});
	}

	embed.footer = {
		text: "bounty.new Notifications",
	};

	return sendDiscordWebhook({
		webhookUrl,
		embed,
	});
}

interface SendBountyCreatedWebhookOptions {
	webhookUrl: string;
	bounty: {
		id: string;
		title: string;
		description: string;
		amount: string;
		currency: string;
		creatorName: string | null;
		creatorHandle: string | null;
		bountyUrl: string;
		repositoryUrl?: string | null;
		issueUrl?: string | null;
		tags?: string[] | null;
		deadline?: Date | null;
	};
}

export async function sendBountyCreatedWebhook({
	webhookUrl,
	bounty,
}: SendBountyCreatedWebhookOptions): Promise<boolean> {
	const fields: DiscordEmbedField[] = [
		{
			name: "Amount",
			value: `${bounty.currency === "USD" ? "$" : ""}${bounty.amount} ${bounty.currency}`,
			inline: true,
		},
		{
			name: "Creator",
			value: bounty.creatorName || bounty.creatorHandle || "Unknown",
			inline: true,
		},
	];

	if (bounty.repositoryUrl) {
		fields.push({
			name: "Repository",
			value: `[View Repo](${bounty.repositoryUrl})`,
			inline: true,
		});
	}

	if (bounty.issueUrl) {
		fields.push({
			name: "GitHub Issue",
			value: `[View Issue](${bounty.issueUrl})`,
			inline: true,
		});
	}

	if (bounty.deadline) {
		fields.push({
			name: "Deadline",
			value: new Date(bounty.deadline).toLocaleDateString(),
			inline: true,
		});
	}

	if (bounty.tags && bounty.tags.length > 0) {
		fields.push({
			name: "Tags",
			value: bounty.tags.slice(0, 5).join(", "),
			inline: false,
		});
	}

	const embed: Omit<DiscordEmbed, "timestamp"> = {
		title: "💰 New Bounty Created",
		description:
			bounty.description.length > 500
				? `${bounty.description.slice(0, 500)}...`
				: bounty.description,
		color: 0x00_ff_88, // Teal/green color
		fields,
		footer: {
			text: "bounty.new",
		},
	};

	return sendDiscordWebhook({
		webhookUrl,
		content: `**[${bounty.title}](${bounty.bountyUrl})**`,
		embed,
	});
}
