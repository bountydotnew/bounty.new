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

export async function sendDiscordWebhook({
  webhookUrl,
  content,
  embed,
  username = "bounty.new",
  avatarUrl,
}: SendWebhookOptions): Promise<boolean> {
  try {
    const payload: DiscordWebhookPayload = {
      username,
      avatar_url: avatarUrl,
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
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
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
    color: 0xff0000, // Red color
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
      value:
        "```json\n" + JSON.stringify(context, null, 2).slice(0, 1000) + "\n```",
      inline: false,
    });
  }

  if (errorStack) {
    embed.fields?.push({
      name: "Stack Trace",
      value: "```\n" + errorStack.slice(0, 1000) + "\n```",
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
  color = 0x00ff00, // Green color
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
      value:
        "```json\n" + JSON.stringify(context, null, 2).slice(0, 1000) + "\n```",
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
